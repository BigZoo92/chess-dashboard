import http from 'k6/http';
import { check, sleep } from 'k6';

const target = __ENV.K6_TARGET || 'http://api:3001';
const username = __ENV.K6_USERNAME;
const cachePath = __ENV.K6_CACHE_PATH || '/api/sync/status';
const iterations = Number(__ENV.K6_ITERATIONS || 1);

const withOptionalUsername = (path) => {
  if (!username) {
    return path;
  }
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}username=${encodeURIComponent(username)}`;
};

const getHeader = (response, name) => {
  const wanted = name.toLowerCase();
  for (const key of Object.keys(response.headers)) {
    if (key.toLowerCase() === wanted) {
      return response.headers[key];
    }
  }
  return '';
};

const requestUrl = `${target}${withOptionalUsername(cachePath)}`;

export const options = {
  vus: 1,
  iterations,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

export default function () {
  const first = http.get(requestUrl, {
    tags: { scenario: 'cache-hit', phase: 'first' },
  });
  sleep(0.2);
  const second = http.get(requestUrl, {
    tags: { scenario: 'cache-hit', phase: 'second' },
  });

  const firstXCache = getHeader(first, 'X-Cache');
  const secondXCache = getHeader(second, 'X-Cache');
  const secondEtag = getHeader(second, 'ETag');

  check(first, {
    'first request status < 500': (r) => r.status < 500,
    'first request exposes x-cache': () => firstXCache.length > 0,
  });

  check(second, {
    'second request status < 500': (r) => r.status < 500,
    'second request cached': () => secondXCache === 'HIT' || secondXCache === 'STALE',
  });

  if (__VU === 1 && __ITER === 0) {
    console.log(
      `[cache-hit] first status=${first.status} x-cache=${firstXCache || '-'} age=${getHeader(first, 'Age') || '-'} cache-control=${getHeader(first, 'Cache-Control') || '-'} etag=${getHeader(first, 'ETag') || '-'}`
    );
    console.log(
      `[cache-hit] second status=${second.status} x-cache=${secondXCache || '-'} age=${getHeader(second, 'Age') || '-'} cache-control=${getHeader(second, 'Cache-Control') || '-'} etag=${secondEtag || '-'}`
    );
  }

  if (!secondEtag) {
    return;
  }

  const conditional = http.get(requestUrl, {
    headers: {
      'If-None-Match': secondEtag,
    },
    tags: { scenario: 'cache-hit', phase: 'conditional' },
  });

  check(conditional, {
    'conditional request returns 304 or 200': (r) => r.status === 304 || r.status === 200,
  });

  if (__VU === 1 && __ITER === 0) {
    console.log(
      `[cache-hit] conditional status=${conditional.status} x-cache=${getHeader(conditional, 'X-Cache') || '-'}`
    );
  }
}
