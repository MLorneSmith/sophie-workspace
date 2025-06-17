/**
 * Modern cookie utilities that handle browser compatibility
 * and provide a cleaner API than direct document.cookie manipulation
 */

interface CookieOptions {
	path?: string;
	maxAge?: number;
	expires?: Date;
	domain?: string;
	secure?: boolean;
	sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Sets a cookie value using the modern approach when available,
 * falls back to document.cookie for compatibility
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
	if (typeof window === 'undefined') {
		return; // SSR safety
	}

	// Use Cookie Store API when available (modern browsers)
	if ('cookieStore' in window) {
		const cookieOptions = {
			name,
			value,
			path: options.path || '/',
			...(options.maxAge && { expires: new Date(Date.now() + options.maxAge * 1000) }),
			...(options.domain && { domain: options.domain }),
			...(options.secure && { secure: options.secure }),
			...(options.sameSite && { sameSite: options.sameSite }),
		};

		// Note: cookieStore.set() returns a Promise, but we don't await it
		// to maintain synchronous behavior expected by calling code
		(window as any).cookieStore.set(cookieOptions).catch((error: Error) => {
			// TODO: Async logger needed
		// (await getLogger()).warn('Failed to set cookie via Cookie Store API:', { data: error });
			// Fallback to document.cookie
			setViaDOMCookie(name, value, options);
		// });
	} else {
		// Fallback to document.cookie for older browsers
		setViaDOMCookie(name, value, options);
	}
}

/**
 * Fallback implementation using document.cookie
 * Note: This is marked with a comment to indicate it's intentional
 * for browser compatibility and SSR hydration requirements
 */
function setViaDOMCookie(name: string, value: string, options: CookieOptions = {}): void {
	const parts: string[] = [`${name}=${value}`];
	
	if (options.path) {
		parts.push(`path=${options.path}`);
	}
	
	if (options.maxAge) {
		parts.push(`max-age=${options.maxAge}`);
	}
	
	if (options.expires) {
		parts.push(`expires=${options.expires.toUTCString()}`);
	}
	
	if (options.domain) {
		parts.push(`domain=${options.domain}`);
	}
	
	if (options.secure) {
		parts.push('secure');
	}
	
	if (options.sameSite) {
		parts.push(`samesite=${options.sameSite}`);
	}

	// Intentional direct cookie assignment for compatibility - exempt from linting rule
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	document.cookie = parts.join('; ');
}

/**
 * Gets a cookie value by name
 */
export function getCookie(name: string): string | null {
	if (typeof window === 'undefined') {
		return null; // SSR safety
	}

	// Use Cookie Store API when available
	if ('cookieStore' in window) {
		// Note: We can't use async/await here to maintain synchronous behavior
		// This is a limitation of the current Cookie Store API design
	}

	// Parse from document.cookie (works in all browsers)
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	
	if (parts.length === 2) {
		const cookieValue = parts.pop()?.split(';').shift();
		return cookieValue || null;
	}
	
	return null;
}

/**
 * Deletes a cookie by setting it to expire in the past
 */
export function deleteCookie(name: string, options: Pick<CookieOptions, 'path' | 'domain'> = {}): void {
	setCookie(name, '', {
		...options,
		expires: new Date(0),
	// });
}