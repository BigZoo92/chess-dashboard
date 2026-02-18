import { monitorEventLoopDelay } from 'node:perf_hooks';

type OtelSdk = {
  start: () => Promise<void> | void;
  shutdown: () => Promise<void> | void;
};

const toBool = (value: string | undefined): boolean => value === '1' || value === 'true';

const withPath = (base: string, path: string): string => {
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${normalizedBase}${path}`;
};

const formatError = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

let sdk: OtelSdk | null = null;
let shutdownHooksRegistered = false;

const registerShutdownHooks = (): void => {
  if (shutdownHooksRegistered) {
    return;
  }
  shutdownHooksRegistered = true;

  const shutdown = async () => {
    if (!sdk) {
      return;
    }

    try {
      await Promise.resolve(sdk.shutdown());
    } catch (error) {
      console.warn('[observability] failed to shutdown OpenTelemetry SDK:', formatError(error));
    } finally {
      sdk = null;
    }
  };

  for (const signal of ['SIGTERM', 'SIGINT'] as const) {
    process.once(signal, () => {
      void shutdown();
    });
  }

  process.once('beforeExit', () => {
    void shutdown();
  });
};

const initOpenTelemetry = async (): Promise<void> => {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://otel-collector:4318';
  const serviceName = process.env.OTEL_SERVICE_NAME || 'api';

  const [
    { NodeSDK },
    { getNodeAutoInstrumentations },
    { OTLPTraceExporter },
    { OTLPMetricExporter },
    { PeriodicExportingMetricReader },
    { metrics },
    { PrismaInstrumentation }
  ] = await Promise.all([
    import('@opentelemetry/sdk-node'),
    import('@opentelemetry/auto-instrumentations-node'),
    import('@opentelemetry/exporter-trace-otlp-http'),
    import('@opentelemetry/exporter-metrics-otlp-http'),
    import('@opentelemetry/sdk-metrics'),
    import('@opentelemetry/api'),
    import('@prisma/instrumentation')
  ]);

  const traceExporter = new OTLPTraceExporter({
    url: withPath(endpoint, '/v1/traces')
  });
  const metricExporter = new OTLPMetricExporter({
    url: withPath(endpoint, '/v1/metrics')
  });
  const metricReader = new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 10000,
    exportTimeoutMillis: 5000
  });

  const nextSdk = new NodeSDK({
    serviceName,
    traceExporter,
    metricReader,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false }
      }),
      new PrismaInstrumentation()
    ]
  });

  await Promise.resolve(nextSdk.start());
  sdk = nextSdk;
  registerShutdownHooks();

  const meter = metrics.getMeter(serviceName);
  const eventLoopDelay = monitorEventLoopDelay({ resolution: 20 });
  eventLoopDelay.enable();

  const eventLoopLagGauge = meter.createObservableGauge('nodejs.eventloop.lag.mean.ms', {
    description: 'Mean event loop lag in milliseconds'
  });
  eventLoopLagGauge.addCallback((observableResult: { observe: (value: number) => void }) => {
    observableResult.observe(eventLoopDelay.mean / 1_000_000);
    eventLoopDelay.reset();
  });

  const heapUsedGauge = meter.createObservableGauge('nodejs.memory.heap.used.bytes', {
    description: 'Heap memory used by the Node.js process'
  });
  heapUsedGauge.addCallback((observableResult: { observe: (value: number) => void }) => {
    observableResult.observe(process.memoryUsage().heapUsed);
  });
};

const initPyroscope = async (): Promise<void> => {
  const module = await import('@pyroscope/nodejs');
  const candidate = (module as { default?: unknown }).default ?? module;
  const pyroscope = candidate as {
    init?: (options: {
      appName: string;
      serverAddress: string;
      tags?: Record<string, string>;
    }) => void;
    start?: () => void;
  };

  if (typeof pyroscope.init !== 'function') {
    console.warn('[observability] pyroscope init function not found, skipping profiling setup.');
    return;
  }

  pyroscope.init({
    appName: process.env.OTEL_SERVICE_NAME || 'api',
    serverAddress: process.env.PYROSCOPE_SERVER_ADDRESS || 'http://pyroscope:4040',
    tags: {
      env: process.env.NODE_ENV || 'development'
    }
  });

  if (typeof pyroscope.start === 'function') {
    pyroscope.start();
  }
};

export const initObservability = async (): Promise<void> => {
  if (!toBool(process.env.OBSERVABILITY_ENABLED)) {
    return;
  }

  try {
    await initOpenTelemetry();
  } catch (error) {
    console.warn('[observability] OpenTelemetry initialization failed:', formatError(error));
  }

  try {
    await initPyroscope();
  } catch (error) {
    console.warn('[observability] Pyroscope initialization failed:', formatError(error));
  }
};
