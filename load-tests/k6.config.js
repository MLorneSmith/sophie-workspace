export const defaultOptions = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users
    { duration: '1m', target: 10 },  // Stay at 10 users
    { duration: '30s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests under 500ms, 99% under 1s
    http_req_failed: ['rate<0.05'], // Error rate under 5%
    http_reqs: ['rate>10'], // At least 10 requests per second
  },
  ext: {
    loadimpact: {
      projectID: __ENV.K6_PROJECT_ID || '',
      name: 'SlideHeroes Load Test',
    },
  },
};

export const apiBaseUrl = __ENV.K6_API_URL || 'https://staging.slideheroes.com';
export const testUserEmail = __ENV.K6_TEST_USER_EMAIL || 'loadtest@slideheroes.com';
export const testUserPassword = __ENV.K6_TEST_USER_PASSWORD || 'test123';