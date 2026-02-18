import http from 'k6/http';
import { check, sleep } from 'k6';

const target = __ENV.K6_TARGET || 'http://api:3001';
const username = __ENV.K6_USERNAME;
const summaryPath = __ENV.K6_SUMMARY_PATH || '/api/stats/summary';
const gamesPath = __ENV.K6_GAMES_PATH || '/api/games?page=1&pageSize=50';
const maxVus = Number(__ENV.K6_RAMP_MAX_VUS || 50);
const warmupVus = Math.max(1, Math.floor(maxVus * 0.2));
const midVus = Math.max(2, Math.floor(maxVus * 0.6));

const withOptionalUsername = (path) => {
  if (!username) {
    return path;
  }
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}username=${encodeURIComponent(username)}`;
};

const routes = [
  { name: 'health', path: '/health', weight: 2 },
  { name: 'summary', path: withOptionalUsername(summaryPath), weight: 5 },
  { name: 'games', path: withOptionalUsername(gamesPath), weight: 3 },
];

const totalWeight = routes.reduce((sum, route) => sum + route.weight, 0);

const pickRoute = () => {
  let cursor = Math.random() * totalWeight;
  for (const route of routes) {
    cursor -= route.weight;
    if (cursor <= 0) {
      return route;
    }
  }
  return routes[routes.length - 1];
};

export const options = {
  scenarios: {
    ramp_api: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: warmupVus },
        { duration: '60s', target: midVus },
        { duration: '90s', target: maxVus },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    checks: ['rate>0.98'],
  },
};

export default function () {
  const route = pickRoute();
  const response = http.get(`${target}${route.path}`, {
    tags: {
      endpoint: route.name,
      scenario: 'ramp',
    },
  });

  check(response, {
    'status is not 5xx': (r) => r.status < 500,
    'response time < 1500ms': (r) => r.timings.duration < 1500,
  });

  sleep(Math.random() * 0.8 + 0.2);
}
