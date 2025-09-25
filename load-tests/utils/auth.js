import { check } from "k6";
import http from "k6/http";

export function login(email, password, baseUrl) {
	const loginUrl = `${baseUrl}/auth/sign-in`;

	const payload = JSON.stringify({
		email: email,
		password: password,
	});

	const params = {
		headers: {
			"Content-Type": "application/json",
		},
	};

	const response = http.post(loginUrl, payload, params);

	check(response, {
		"login successful": (r) => r.status === 200,
		"auth token present": (r) => r.cookies["auth-token"] !== undefined,
	});

	if (response.status !== 200) {
		console.error(`Login failed: ${response.status} ${response.body}`);
		return null;
	}

	return {
		token: response.cookies["auth-token"],
		sessionId: response.json("sessionId"),
	};
}

export function getAuthHeaders(token) {
	return {
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
	};
}
