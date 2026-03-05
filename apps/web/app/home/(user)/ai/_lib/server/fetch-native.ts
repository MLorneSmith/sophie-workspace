import "server-only";

import http from "node:http";
import https from "node:https";

// ---------------------------------------------------------------------------
// Native fetch — completely bypasses Next.js's globalThis.fetch
// ---------------------------------------------------------------------------
//
// Uses node:http / node:https directly instead of globalThis.fetch.
// This avoids:
//  1. Next.js fetch patching deadlocks (Next.js #65381)
//  2. AbortSignal.any([AbortSignal.timeout()]) unreliability (Node.js #57736)
//  3. Any other fetch interception by instrumentation libraries
//
// Trade-off: slightly more code than fetch(), but 100% reliable timeouts.
// ---------------------------------------------------------------------------

/**
 * Perform an HTTP(S) request using Node.js core modules.
 * Completely bypasses globalThis.fetch and Next.js patching.
 *
 * @param url      - URL to fetch
 * @param options  - Standard RequestInit-like options
 * @param timeout  - Timeout in ms (default 10_000). Set to 0 to disable.
 */
export async function nativeFetch(
	url: string | URL,
	options: RequestInit = {},
	timeout = 10_000,
): Promise<Response> {
	const parsedUrl = typeof url === "string" ? new URL(url) : url;
	const isHttps = parsedUrl.protocol === "https:";
	const transport = isHttps ? https : http;

	return new Promise<Response>((resolve, reject) => {
		const req = transport.request(
			parsedUrl,
			{
				method: (options.method as string) ?? "GET",
				headers: options.headers as Record<string, string>,
				timeout: timeout > 0 ? timeout : undefined,
			},
			(res) => {
				const chunks: Buffer[] = [];
				res.on("data", (chunk: Buffer) => chunks.push(chunk));
				res.on("end", () => {
					const body = Buffer.concat(chunks);
					const headers = new Headers();
					for (const [key, value] of Object.entries(res.headers)) {
						if (value) {
							if (Array.isArray(value)) {
								for (const v of value) headers.append(key, v);
							} else {
								headers.set(key, value);
							}
						}
					}

					resolve(
						new Response(body, {
							status: res.statusCode ?? 200,
							statusText: res.statusMessage ?? "",
							headers,
						}),
					);
				});
				res.on("error", reject);
			},
		);

		if (timeout > 0) {
			req.on("timeout", () => {
				req.destroy();
				reject(
					new DOMException(
						`Request timed out after ${timeout}ms: ${parsedUrl.hostname}`,
						"AbortError",
					),
				);
			});
		}

		// Forward caller's abort signal
		if (options.signal) {
			if (options.signal.aborted) {
				req.destroy();
				reject(new DOMException("Request aborted", "AbortError"));
				return;
			}
			options.signal.addEventListener(
				"abort",
				() => {
					req.destroy();
					reject(new DOMException("Request aborted", "AbortError"));
				},
				{ once: true },
			);
		}

		req.on("error", (err) => {
			if (
				err.message.includes("ECONNRESET") ||
				err.message.includes("socket hang up")
			) {
				// Already destroyed by timeout or abort — ignore
				return;
			}
			reject(err);
		});

		// Send body if present
		if (options.body) {
			req.write(options.body);
		}
		req.end();
	});
}
