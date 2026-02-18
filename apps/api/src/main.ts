import { initObservability } from './observability/init.js';

await initObservability();
await import('./server.js');
