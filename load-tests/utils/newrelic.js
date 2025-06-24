import http from "k6/http";
import { Rate, Trend, Counter } from "k6/metrics";

// New Relic configuration
const NEW_RELIC_LICENSE_KEY = __ENV.NEW_RELIC_LICENSE_KEY || "";
const NEW_RELIC_API_URL = "https://metric-api.newrelic.com/metric/v1";

// Custom metrics to send to New Relic
export const newRelicMetrics = {
	responseTime: new Trend("newrelic_response_time"),
	errorRate: new Rate("newrelic_error_rate"),
	throughput: new Counter("newrelic_throughput"),
};

// Function to send metrics to New Relic
export function sendMetricsToNewRelic(testName, metrics) {
	if (!NEW_RELIC_LICENSE_KEY) {
		console.warn("NEW_RELIC_LICENSE_KEY not set, skipping metrics export");
		return;
	}

	const timestamp = Math.floor(Date.now() / 1000);

	const payload = [
		{
			common: {
				timestamp: timestamp,
				interval: { ms: 10000 },
				attributes: {
					"service.name": "slideheroes-load-test",
					"test.name": testName,
					environment: "staging",
				},
			},
			metrics: [
				{
					name: "k6.http_req_duration.p95",
					type: "gauge",
					value: metrics.http_req_duration?.p95 || 0,
					timestamp: timestamp,
				},
				{
					name: "k6.http_req_duration.p99",
					type: "gauge",
					value: metrics.http_req_duration?.p99 || 0,
					timestamp: timestamp,
				},
				{
					name: "k6.http_reqs.rate",
					type: "gauge",
					value: metrics.http_reqs?.rate || 0,
					timestamp: timestamp,
				},
				{
					name: "k6.http_req_failed.rate",
					type: "gauge",
					value: metrics.http_req_failed?.rate || 0,
					timestamp: timestamp,
				},
				{
					name: "k6.vus",
					type: "gauge",
					value: metrics.vus?.value || 0,
					timestamp: timestamp,
				},
			],
		},
	];

	const params = {
		headers: {
			"Content-Type": "application/json",
			"Api-Key": NEW_RELIC_LICENSE_KEY,
		},
	};

	try {
		const response = http.post(
			NEW_RELIC_API_URL,
			JSON.stringify(payload),
			params,
		);
		if (response.status !== 202) {
			console.error(
				`Failed to send metrics to New Relic: ${response.status} ${response.body}`,
			);
		}
	} catch (error) {
		console.error("Error sending metrics to New Relic:", error);
	}
}

// Helper to create a New Relic dashboard for k6 metrics
export function getNewRelicDashboardQuery() {
	return `
    FROM Metric 
    SELECT 
      average(k6.http_req_duration.p95) as 'Response Time p95',
      average(k6.http_req_duration.p99) as 'Response Time p99',
      average(k6.http_reqs.rate) as 'Requests/sec',
      average(k6.http_req_failed.rate) as 'Error Rate',
      average(k6.vus) as 'Virtual Users'
    WHERE service.name = 'slideheroes-load-test'
    FACET test.name
    TIMESERIES AUTO
  `;
}
