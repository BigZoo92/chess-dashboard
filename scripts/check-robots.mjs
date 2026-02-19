const target = process.argv[2] ?? 'http://localhost:8080/robots.txt';
const allowedDirectives = new Set([
  'user-agent',
  'allow',
  'disallow',
  'sitemap',
  'crawl-delay',
  'host'
]);

function fail(message) {
  console.error(`robots check failed: ${message}`);
  process.exit(1);
}

let response;
try {
  response = await fetch(target, { redirect: 'follow' });
} catch (error) {
  fail(`request error for ${target}: ${error instanceof Error ? error.message : String(error)}`);
}

if (response.status !== 200) {
  fail(`expected status 200, got ${response.status}`);
}

const contentType = response.headers.get('content-type') ?? '';
if (!/^text\/plain\b/i.test(contentType)) {
  fail(`expected Content-Type text/plain, got "${contentType || 'missing'}"`);
}

const body = await response.text();
const lines = body.split(/\r?\n/);

for (const [index, rawLine] of lines.entries()) {
  const line = rawLine.trim();
  if (!line || line.startsWith('#')) {
    continue;
  }

  const match = /^([A-Za-z-]+)\s*:/.exec(line);
  if (!match) {
    fail(`line ${index + 1} is not a valid directive: "${rawLine}"`);
  }

  const directive = match[1].toLowerCase();
  if (!allowedDirectives.has(directive)) {
    fail(`line ${index + 1} has unknown directive "${match[1]}"`);
  }
}

console.log(`robots check passed for ${target}`);
console.log(`status=${response.status} content-type=${contentType}`);
