/**
 * TTS (Text-to-Speech) Module for Alpha Orchestrator
 *
 * Provides audio notifications when the orchestrator completes.
 * Uses Kokoro TTS for high-quality neural text-to-speech.
 *
 * Configuration via environment variables:
 * - CLAUDE_TTS_ENABLED: Set to "0" to disable (default: "1")
 * - CLAUDE_TTS_VOICE: Voice selection (default: "af_heart")
 * - CLAUDE_TTS_SPEED: Speech speed multiplier (default: "1.1")
 *
 * Requirements:
 * - Python 3.9+
 * - pip install kokoro>=0.9.4 soundfile sounddevice
 * - System: espeak-ng (sudo apt-get install espeak-ng)
 */

import { spawn } from "node:child_process";

// Configuration from environment
const TTS_ENABLED = process.env.CLAUDE_TTS_ENABLED !== "0";
const TTS_VOICE = process.env.CLAUDE_TTS_VOICE || "af_heart";
const TTS_SPEED = process.env.CLAUDE_TTS_SPEED || "1.1";

/**
 * Speak text using Kokoro TTS.
 *
 * Runs in background subprocess to avoid blocking the orchestrator.
 * Fails silently if TTS is not available or disabled.
 *
 * @param text - Text to speak
 * @param log - Optional logger function (defaults to console.log)
 */
export function speak(
	text: string,
	_log?: (...args: unknown[]) => void,
): void {
	if (!TTS_ENABLED) {
		return;
	}

	// Escape text for Python string (handle quotes and special chars)
	const escapedText = text
		.replace(/\\/g, "\\\\")
		.replace(/"/g, '\\"')
		.replace(/\n/g, " ");

	// Python script to run TTS
	// Uses Kokoro's streaming API for immediate playback
	const pythonScript = `
import sounddevice as sd
from kokoro import KPipeline

try:
    pipeline = KPipeline(lang_code='a')
    for _, _, audio in pipeline("${escapedText}", voice="${TTS_VOICE}", speed=${TTS_SPEED}):
        sd.play(audio, samplerate=24000)
        sd.wait()
except Exception as e:
    pass  # Fail silently
`;

	try {
		// Spawn Python in background, detached from parent
		const child = spawn("python3", ["-c", pythonScript], {
			stdio: "ignore",
			detached: true,
		});

		// Unref to allow parent to exit independently
		child.unref();
	} catch {
		// Fail silently - TTS is optional
	}
}

/**
 * Speak orchestrator completion message.
 *
 * @param status - Completion status ("completed" | "partial" | "failed")
 * @param featuresCompleted - Number of features completed
 * @param featuresTotal - Total number of features
 * @param log - Optional logger function
 */
export function speakCompletion(
	status: "completed" | "partial" | "failed",
	featuresCompleted: number,
	featuresTotal: number,
): void {
	if (!TTS_ENABLED) {
		return;
	}

	let message: string;

	switch (status) {
		case "completed":
			message =
				featuresTotal === 1
					? "Implementation complete. One feature done."
					: `Implementation complete. ${featuresCompleted} features done.`;
			break;
		case "partial":
			message = `Implementation finished with ${featuresCompleted} of ${featuresTotal} features completed.`;
			break;
		case "failed":
			message = "Implementation failed. Check the logs for details.";
			break;
		default:
			message = "Task finished.";
	}

	speak(message);
}

/**
 * Check if TTS dependencies are available.
 *
 * @returns Promise<boolean> - true if TTS is available
 */
export async function isTTSAvailable(): Promise<boolean> {
	if (!TTS_ENABLED) {
		return false;
	}

	return new Promise((resolve) => {
		const child = spawn("python3", [
			"-c",
			"from kokoro import KPipeline; import sounddevice; print('ok')",
		]);

		let output = "";
		child.stdout?.on("data", (data) => {
			output += data.toString();
		});

		child.on("close", (code) => {
			resolve(code === 0 && output.includes("ok"));
		});

		child.on("error", () => {
			resolve(false);
		});

		// Timeout after 5 seconds
		setTimeout(() => {
			child.kill();
			resolve(false);
		}, 5000);
	});
}
