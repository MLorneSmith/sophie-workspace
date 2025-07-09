import { check, sleep } from "k6";
import http from "k6/http";
import { Rate, Trend } from "k6/metrics";
import { apiBaseUrl, testUserEmail, testUserPassword } from "../k6.config.js";

// Custom metrics
export const loginErrorRate = new Rate("login_errors");
export const loginDuration = new Trend("login_duration");

export const options = {
	scenarios: {
		login_flow: {
			executor: "ramping-vus",
			startVUs: 0,
			stages: [
				{ duration: "30s", target: 20 }, // Ramp up to 20 users
				{ duration: "1m", target: 20 }, // Stay at 20 users
				{ duration: "30s", target: 0 }, // Ramp down
			],
			gracefulRampDown: "30s",
		},
	},
	thresholds: {
		http_req_duration: ["p(95)<1000"], // 95% of requests under 1s
		http_req_failed: ["rate<0.1"], // Error rate under 10%
		login_errors: ["rate<0.1"], // Login error rate under 10%
		login_duration: ["p(95)<1500"], // 95% of logins complete under 1.5s
	},
};

export default function () {
	// 1. Visit homepage
	const homepageStart = new Date().getTime();
	const homepage = http.get(apiBaseUrl);
	check(homepage, {
		"homepage loaded": (r) => r.status === 200,
	});

	sleep(1); // User reads the page

	// 2. Navigate to login
	const loginPageUrl = `${apiBaseUrl}/auth/sign-in`;
	const loginPage = http.get(loginPageUrl);
	check(loginPage, {
		"login page loaded": (r) => r.status === 200,
	});

	sleep(2); // User fills in form

	// 3. Submit login
	const loginStart = new Date().getTime();
	const loginPayload = JSON.stringify({
		email: testUserEmail,
		password: testUserPassword,
	});

	const loginParams = {
		headers: {
			"Content-Type": "application/json",
		},
	};

	const loginResponse = http.post(
		`${apiBaseUrl}/api/auth/sign-in`,
		loginPayload,
		loginParams,
	);
	const loginEnd = new Date().getTime();

	const loginSuccess = check(loginResponse, {
		"login successful": (r) => r.status === 200,
		"session created": (r) => r.json("session") !== undefined,
	});

	// Record metrics
	loginErrorRate.add(!loginSuccess);
	loginDuration.add(loginEnd - loginStart);

	if (loginSuccess) {
		sleep(1);

		// 4. Access dashboard
		const dashboardResponse = http.get(`${apiBaseUrl}/dashboard`, {
			headers: {
				Cookie: loginResponse.headers["Set-Cookie"],
			},
		});

		check(dashboardResponse, {
			"dashboard accessible": (r) => r.status === 200,
		});
	}

	sleep(3); // User interacts with dashboard
}
