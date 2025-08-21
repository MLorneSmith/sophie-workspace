import { check, group, sleep } from "k6";
import { SharedArray } from "k6/data";
import http from "k6/http";
import { Rate, Trend } from "k6/metrics";
import { apiBaseUrl, testUserEmail, testUserPassword } from "../k6.config.js";
import { getAuthHeaders, login } from "../utils/auth.js";

// Custom metrics
export const journeyCompletionRate = new Rate("journey_completion");
export const actionDuration = new Trend("user_action_duration");

// Test data
const testActions = new SharedArray("actions", () => [
	{ name: "view_dashboard", weight: 30 },
	{ name: "create_project", weight: 10 },
	{ name: "edit_project", weight: 15 },
	{ name: "view_analytics", weight: 20 },
	{ name: "manage_team", weight: 10 },
	{ name: "update_profile", weight: 15 },
]);

export const options = {
	scenarios: {
		user_journey: {
			executor: "ramping-arrival-rate",
			startRate: 10,
			timeUnit: "1m",
			preAllocatedVUs: 50,
			maxVUs: 200,
			stages: [
				{ duration: "2m", target: 30 }, // Ramp up to 30 iterations per minute
				{ duration: "5m", target: 30 }, // Stay at 30 iterations per minute
				{ duration: "2m", target: 50 }, // Peak load
				{ duration: "1m", target: 10 }, // Ramp down
			],
		},
	},
	thresholds: {
		http_req_duration: ["p(95)<2500", "p(99)<4000"],
		http_req_failed: ["rate<0.1"],
		journey_completion: ["rate>0.9"], // 90% of journeys should complete
		user_action_duration: ["p(95)<3000"], // 95% of actions under 3s
	},
};

function selectAction() {
	const rand = Math.random() * 100;
	let cumulative = 0;

	for (const action of testActions) {
		cumulative += action.weight;
		if (rand <= cumulative) {
			return action.name;
		}
	}
	return testActions[0].name;
}

export function setup() {
	const authData = login(testUserEmail, testUserPassword, apiBaseUrl);
	if (!authData) {
		throw new Error("Setup failed: Could not authenticate test user");
	}
	return authData;
}

export default function (authData) {
	const headers = getAuthHeaders(authData.token);
	let journeyComplete = true;

	group("User Journey", () => {
		// Always start with dashboard
		const dashboardResponse = http.get(`${apiBaseUrl}/dashboard`, headers);
		if (
			!check(dashboardResponse, { "dashboard loads": (r) => r.status === 200 })
		) {
			journeyComplete = false;
			return;
		}

		sleep(2);

		// Perform 3-5 random actions
		const numActions = 3 + Math.floor(Math.random() * 3);

		for (let i = 0; i < numActions; i++) {
			const action = selectAction();
			const actionStart = new Date().getTime();

			switch (action) {
				case "view_dashboard":
					performDashboardView(headers);
					break;
				case "create_project":
					performProjectCreate(headers);
					break;
				case "edit_project":
					performProjectEdit(headers);
					break;
				case "view_analytics":
					performAnalyticsView(headers);
					break;
				case "manage_team":
					performTeamManagement(headers);
					break;
				case "update_profile":
					performProfileUpdate(headers);
					break;
			}

			const actionEnd = new Date().getTime();
			actionDuration.add(actionEnd - actionStart);

			sleep(2 + Math.random() * 3); // Random think time
		}
	});

	journeyCompletionRate.add(journeyComplete);
}

function performDashboardView(headers) {
	group("View Dashboard", () => {
		const batch = http.batch([
			["GET", `${apiBaseUrl}/api/dashboard/stats`, null, headers],
			["GET", `${apiBaseUrl}/api/dashboard/recent-activity`, null, headers],
		]);

		batch.forEach((response) => {
			check(response, { "dashboard data loads": (r) => r.status === 200 });
		});
	});
}

function performProjectCreate(headers) {
	group("Create Project", () => {
		const projectData = JSON.stringify({
			name: `Load Test Project ${Date.now()}`,
			description: "Created during load testing",
			template: "blank",
		});

		const createResponse = http.post(
			`${apiBaseUrl}/api/projects`,
			projectData,
			headers,
		);
		check(createResponse, {
			"project created": (r) => r.status === 201,
		});
	});
}

function performProjectEdit(headers) {
	group("Edit Project", () => {
		// First get a project
		const projectsResponse = http.get(
			`${apiBaseUrl}/api/projects?limit=1`,
			headers,
		);
		if (projectsResponse.status === 200) {
			const projects = JSON.parse(projectsResponse.body).data;
			if (projects.length > 0) {
				const projectId = projects[0].id;
				const updateData = JSON.stringify({
					description: `Updated at ${new Date().toISOString()}`,
				});

				const updateResponse = http.patch(
					`${apiBaseUrl}/api/projects/${projectId}`,
					updateData,
					headers,
				);
				check(updateResponse, {
					"project updated": (r) => r.status === 200,
				});
			}
		}
	});
}

function performAnalyticsView(headers) {
	group("View Analytics", () => {
		const analyticsResponse = http.get(
			`${apiBaseUrl}/api/analytics/overview`,
			headers,
		);
		check(analyticsResponse, {
			"analytics loads": (r) => r.status === 200,
		});

		// Load detailed metrics
		const metricsResponse = http.get(
			`${apiBaseUrl}/api/analytics/metrics?period=7d`,
			headers,
		);
		check(metricsResponse, {
			"metrics load": (r) => r.status === 200,
		});
	});
}

function performTeamManagement(headers) {
	group("Manage Team", () => {
		const teamResponse = http.get(`${apiBaseUrl}/api/team/members`, headers);
		check(teamResponse, {
			"team list loads": (r) => r.status === 200,
		});

		const invitationsResponse = http.get(
			`${apiBaseUrl}/api/team/invitations`,
			headers,
		);
		check(invitationsResponse, {
			"invitations load": (r) => r.status === 200,
		});
	});
}

function performProfileUpdate(headers) {
	group("Update Profile", () => {
		// Get current profile
		const profileResponse = http.get(`${apiBaseUrl}/api/user/profile`, headers);
		check(profileResponse, {
			"profile loads": (r) => r.status === 200,
		});

		// Update profile
		const updateData = JSON.stringify({
			bio: `Updated during load test at ${new Date().toISOString()}`,
		});

		const updateResponse = http.patch(
			`${apiBaseUrl}/api/user/profile`,
			updateData,
			headers,
		);
		check(updateResponse, {
			"profile updated": (r) => r.status === 200,
		});
	});
}
