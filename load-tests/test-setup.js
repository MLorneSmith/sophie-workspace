// Simple test to verify k6 setup and configuration
import http from "k6/http";
import { check, sleep } from "k6";
import { apiBaseUrl } from "./k6.config.js";

export const options = {
	vus: 1,
	duration: "10s",
	thresholds: {
		http_req_duration: ["p(95)<2000"],
		http_req_failed: ["rate<0.1"],
	},
};

export default function () {
	console.log(`Testing connectivity to: ${apiBaseUrl}`);

	const response = http.get(apiBaseUrl);

	const success = check(response, {
		"status is 200": (r) => r.status === 200,
		"response time < 2s": (r) => r.timings.duration < 2000,
	});

	if (success) {
		console.log("✅ k6 setup test passed");
	} else {
		console.log("❌ k6 setup test failed");
		console.log(`Status: ${response.status}`);
		console.log(`Duration: ${response.timings.duration}ms`);
	}

	sleep(1);
}
