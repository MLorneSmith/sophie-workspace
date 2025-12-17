import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
	title: "Payload CMS",
};

/**
 * Root Layout for Payload
 *
 * This layout wraps both the Payload admin and frontend routes.
 * It installs the global error handler for Performance API errors.
 */
export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body>
				{/* Install global Performance API error handler */}
				<PerformanceErrorHandlerScript />
				{children}
			</body>
		</html>
	);
}

/**
 * Client-side script that installs the global error handler
 * This catches Performance API errors at the window level
 */
function PerformanceErrorHandlerScript() {
	return (
		<script
			// biome-ignore lint/security/noDangerouslySetInnerHtml: Required for inline script injection to catch errors early
			dangerouslySetInnerHTML={{
				__html: `
          (function() {
            function isPerformanceApiError(error) {
              if (!(error instanceof Error)) return false;
              var message = error.message || '';
              return (
                message.indexOf("Failed to execute 'measure' on 'Performance'") !== -1 ||
                message.indexOf('cannot have a negative time stamp') !== -1 ||
                (message.indexOf('Performance') !== -1 && message.indexOf('timestamp') !== -1)
              );
            }

            var originalHandler = window.onerror;

            window.onerror = function(event, source, lineno, colno, error) {
              var errorObj = error || new Error(typeof event === 'string' ? event : (event && event.message) || 'Unknown error');

              if (isPerformanceApiError(errorObj)) {
                return true;
              }

              if (typeof originalHandler === 'function') {
                return originalHandler(event, source, lineno, colno, error);
              }

              return false;
            };
          })();
        `,
			}}
		/>
	);
}
