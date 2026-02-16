import net from 'node:net';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required.');
}

const { hostname, port } = new URL(databaseUrl);

const maxAttempts = 30;
const delayMs = 1000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const canConnect = (host: string, targetPort: number) =>
  new Promise<boolean>((resolve) => {
    const socket = new net.Socket();
    const timeoutMs = 1000;

    socket.setTimeout(timeoutMs);

    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(targetPort, host);
  });

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  const connected = await canConnect(hostname, Number(port || 5432));
  if (connected) {
    console.log(`Database reachable on ${hostname}:${port || 5432}`);
    process.exit(0);
  }

  console.log(`Waiting for database... (${attempt}/${maxAttempts})`);
  await wait(delayMs);
}

throw new Error('Database did not become reachable in time.');
