import { check, group, sleep } from "k6";
import http from "k6/http";
import { Counter, Trend } from "k6/metrics";
import { apiBaseUrl, testUserEmail, testUserPassword } from "../k6.config.js";
import { getAuthHeaders, login } from "../utils/auth.js";

// Custom metrics
export const dashboardErrors = new Counter("dashboard_errors");
export const apiCallDuration = new Trend("api_call_duration");

export const options = {
	scenarios: {
		dashboard_load: {
			executor: "constant-vus",
			vus: 50,
			duration: "5m",
		},
	},
	thresholds: {
		http_req_duration: ["p(95)<2000", "p(99)<3000"], // 95% under 2s, 99% under 3s
		http_req_failed: ["rate<0.05"], // Error rate under 5%
		dashboard_errors: ["count<50"], // Less than 50 dashboard errors total
		api_call_duration: ["p(95)<1000"], // 95% of API calls under 1s
	},
};

export function setup() {
	// Setup: Create a test user session
	const authData = login(testUserEmail, testUserPassword, apiBaseUrl);
	if (!authData) {
		throw new Error("Setup failed: Could not authenticate test user");
	}
	return authData;
}

export default function (authData) {
	const headers = getAuthHeaders(authData.token);

	group("Dashboard Initial Load", () => {
		// Load dashboard page
		const dashboardResponse = http.get(`${apiBaseUrl}/dashboard`, headers);
		const dashboardSuccess = check(dashboardResponse, {
			"dashboard loads": (r) => r.status === 200,
		});

		if (!dashboardSuccess) {
			dashboardErrors.add(1);
			return;
		}

		// Simulate parallel API calls that dashboard makes
		const batch = http.batch([
			["GET", `${apiBaseUrl}/api/user/profile`, null, headers],
			["GET", `${apiBaseUrl}/api/projects`, null, headers],
			["GET", `${apiBaseUrl}/api/analytics/summary`, null, headers],
			["GET", `${apiBaseUrl}/api/notifications`, null, headers],
		]);

		batch.forEach((response, index) => {
			const endpoints = ["profile", "projects", "analytics", "notifications"];
			check(response, {
				[`${endpoints[index]} API call successful`]: (r) => r.status === 200,
			});
			apiCallDuration.add(response.timings.duration);
		});
	});

	sleep(5); // User views dashboard

	group("Project Operations", () => {
		// List projects
		const projectsStart = new Date().getTime();
		const projectsResponse = http.get(
			`${apiBaseUrl}/api/projects?limit=10&page=1`,
			headers,
		);
		const projectsEnd = new Date().getTime();

		check(projectsResponse, {
			"projects list loads": (r) => r.status === 200,
			"projects returned": (r) => JSON.parse(r.body).data.length > 0,
		});

		apiCallDuration.add(projectsEnd - projectsStart);

		sleep(2);

		// View specific project details
		if (projectsResponse.status === 200) {
			const projects = JSON.parse(projectsResponse.body).data;
			if (projects.length > 0) {
				const projectId = projects[0].id;
				const projectDetailResponse = http.get(
					`${apiBaseUrl}/api/projects/${projectId}`,
					headers,
				);

				check(projectDetailResponse, {
					"project details load": (r) => r.status === 200,
				});
			}
		}
	});

	sleep(3);

	group("Real-time Updates", () => {
		// Simulate polling for updates
		for (let i = 0; i < 3; i++) {
			const updatesResponse = http.get(
				`${apiBaseUrl}/api/updates/check`,
				headers,
			);
			check(updatesResponse, {
				"updates check successful": (r) => r.status === 200,
			});
			sleep(10); // Poll every 10 seconds
		}
	});
}
