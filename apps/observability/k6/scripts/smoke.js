import http from 'k6/http';
import { check, sleep } from 'k6';

const target = __ENV.K6_TARGET || 'http://api:3001';
const vus = Number(__ENV.K6_VUS || 5);
const duration = __ENV.K6_DURATION || '30s';

export const options = {
  vus,
  duration,
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<500'],
  },
};

export default function () {
  const response = http.get(`${target}/health`);

  check(response, {
    'health status is 200': (r) => r.status === 200,
    'health payload is ok': (r) => r.json('ok') === true,
  });

  sleep(1);
}
