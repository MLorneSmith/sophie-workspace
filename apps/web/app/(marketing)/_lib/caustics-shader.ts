/**
 * WebGL2 caustics shader — procedural glass/light animation.
 *
 * Produces slow-moving diagonal light streaks (deep navy + warm amber)
 * on a black background, replicating the Payload CMS hero effect.
 */

// ---------- GLSL sources ----------

const VERTEX_SRC = /* glsl */ `#version 300 es
precision mediump float;
in vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SRC = /* glsl */ `#version 300 es
precision mediump float;

uniform float u_time;
uniform vec2  u_resolution;

out vec4 fragColor;

/* ---- Noise ---- */

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    v += a * vnoise(p);
    p = rot * p * 2.0;
    a *= 0.5;
  }
  return v;
}

/* ---- Main ---- */
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 p = vec2(uv.x * aspect, uv.y);

  float t = u_time * 0.08; // Faster overall animation

  // Diagonal rotation — beams go BL to TR (~40°)
  float angle = 0.70;
  float ca = cos(angle), sa = sin(angle);
  mat2 diag = mat2(ca, -sa, sa, ca);
  vec2 rp = diag * p;

  // === BEAM LAYER 1 (primary) ===
  // All beams use same rotation — no crossing angles
  float warp1 = fbm(vec2(rp.x * 0.25 + t * 0.15, rp.y * 0.1)) * 0.7;
  float wave1 = sin(rp.y * 2.4 + warp1 - t * 0.6);

  // Sharp edges
  float beam1 = smoothstep(-0.06, 0.005, wave1) * (1.0 - smoothstep(0.15, 0.65, wave1));

  // Accent patches traveling DOWN the beam (TR → BL = +t in rp.x)
  // Lower frequency = larger, less frequent patches
  float travelRaw1 = sin(rp.x * 0.4 + t * 2.5 + warp1 * 1.5) * 0.5 + 0.5;
  float travelPatch1 = smoothstep(0.40, 0.70, travelRaw1); // Narrower band = rarer
  float travelFine1 = vnoise(vec2(rp.x * 0.8 + t * 2.5, rp.y * 0.4));
  travelFine1 = smoothstep(0.35, 0.6, travelFine1);
  float accentMask1 = travelPatch1 * (0.4 + travelFine1 * 0.6);

  // BLACK patches traveling down the beam — distinct voids
  float blackRaw1 = sin(rp.x * 0.5 + t * 2.2 + 1.5) * 0.5 + 0.5;
  float blackPatch1 = smoothstep(0.50, 0.72, blackRaw1);
  float blackNoise1 = vnoise(vec2(rp.x * 0.8 + t * 2.5, rp.y * 0.3 + 5.0));
  blackPatch1 *= smoothstep(0.3, 0.6, blackNoise1);

  // Dark travel + black patches dim the beam
  float dark1 = fbm(vec2(rp.x * 0.6 + t * 1.0, rp.y * 0.3 + t * 0.12));
  dark1 = smoothstep(0.20, 0.55, dark1);
  float beamVis1 = beam1 * (0.08 + dark1 * 0.92) * (1.0 - blackPatch1 * 0.90);

  // === BEAM LAYER 2 (same angle, offset phase) ===
  // Same rotation matrix — all beams perfectly parallel
  float warp2 = fbm(vec2(rp.x * 0.2 + t * 0.12 + 5.0, rp.y * 0.08)) * 0.6;
  float wave2 = sin(rp.y * 2.0 + warp2 + 2.0 - t * 0.5);

  float beam2 = smoothstep(-0.06, 0.005, wave2) * (1.0 - smoothstep(0.15, 0.65, wave2));

  // Accent traveling down beam 2
  float travelRaw2 = sin(rp.x * 0.35 + t * 2.0 + warp2 * 1.5 + 3.0) * 0.5 + 0.5;
  float travelPatch2 = smoothstep(0.40, 0.70, travelRaw2);
  float travelFine2 = vnoise(vec2(rp.x * 0.7 + t * 2.0 + 7.0, rp.y * 0.3));
  travelFine2 = smoothstep(0.35, 0.6, travelFine2);
  float accentMask2 = travelPatch2 * (0.4 + travelFine2 * 0.6);

  // Black patches for beam 2
  float blackRaw2 = sin(rp.x * 0.45 + t * 1.8 + 4.0) * 0.5 + 0.5;
  float blackPatch2 = smoothstep(0.50, 0.72, blackRaw2);
  float blackNoise2 = vnoise(vec2(rp.x * 0.7 + t * 2.2 + 12.0, rp.y * 0.25));
  blackPatch2 *= smoothstep(0.3, 0.6, blackNoise2);

  float dark2 = fbm(vec2(rp.x * 0.5 + t * 0.9 + 10.0, rp.y * 0.25));
  dark2 = smoothstep(0.20, 0.55, dark2);
  float beamVis2 = beam2 * (0.08 + dark2 * 0.92) * (1.0 - blackPatch2 * 0.90);

  // === SHARP CAUSTIC EDGE LINES ===
  float edge1 = smoothstep(0.06, 0.0, abs(wave1 + 0.005));
  float edge2 = smoothstep(0.06, 0.0, abs(wave2 + 0.005));

  // === COLOR (reduced intensity — more black overall) ===
  vec3 col = vec3(0.0);

  // #24A9E0 derived — dark cyan-blue for beam fill
  vec3 blue     = vec3(0.04, 0.16, 0.28);
  vec3 blueBrt  = vec3(0.06, 0.24, 0.40);
  // #E0D824 = (0.878, 0.847, 0.141)
  vec3 accent   = vec3(0.88, 0.85, 0.14);

  // Beam 1: blue dominant, accent is a subtle tint — not vivid
  vec3 beamColor1 = mix(blue * 1.4, accent * 0.35, accentMask1 * 0.30);
  col += beamColor1 * beamVis1;

  // Beam 2
  vec3 beamColor2 = mix(blue * 1.1, accent * 0.30, accentMask2 * 0.25);
  col += beamColor2 * beamVis2;

  // Caustic edge highlights
  vec3 edgeColor1 = mix(blueBrt, accent * 0.25, accentMask1 * 0.20);
  col += edgeColor1 * edge1 * 0.5;
  vec3 edgeColor2 = mix(blueBrt, accent * 0.25, accentMask2 * 0.20);
  col += edgeColor2 * edge2 * 0.35;

  // === VIGNETTE ===
  vec2 vc = uv - 0.5;
  float vignette = 1.0 - dot(vc, vc) * 1.0;
  vignette = clamp(vignette, 0.0, 1.0);
  vignette = smoothstep(0.0, 0.6, vignette);
  col *= vignette;

  fragColor = vec4(col, 1.0);
}
`;

// ---------- WebGL setup ----------

function compileShader(
	gl: WebGL2RenderingContext,
	type: number,
	source: string,
): WebGLShader {
	const shader = gl.createShader(type);
	if (!shader) throw new Error("Failed to create shader");
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const info = gl.getShaderInfoLog(shader);
		gl.deleteShader(shader);
		throw new Error(`Shader compile error: ${info}`);
	}
	return shader;
}

export interface CausticsGL {
	render(time: number): void;
	resize(width: number, height: number, dpr: number): void;
	destroy(): void;
}

export function initCausticsGL(canvas: HTMLCanvasElement): CausticsGL | null {
	const gl = canvas.getContext("webgl2", {
		alpha: false,
		antialias: false,
		powerPreference: "low-power",
	});
	if (!gl) return null;

	// Immediately clear to black to prevent flash on load
	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT);

	// Compile program
	const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SRC);
	const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC);
	const program = gl.createProgram()!;
	gl.attachShader(program, vs);
	gl.attachShader(program, fs);
	gl.linkProgram(program);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		const info = gl.getProgramInfoLog(program);
		throw new Error(`Program link error: ${info}`);
	}

	// biome-ignore lint/correctness/useHookAtTopLevel: WebGL API method, not a React hook
	gl.useProgram(program);

	// Full-screen quad (triangle strip)
	const verts = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
	const vbo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

	const aPos = gl.getAttribLocation(program, "a_position");
	gl.enableVertexAttribArray(aPos);
	gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

	// Uniform locations
	const uTime = gl.getUniformLocation(program, "u_time");
	const uRes = gl.getUniformLocation(program, "u_resolution");

	return {
		render(time: number) {
			gl.uniform1f(uTime, time);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		},

		resize(width: number, height: number, dpr: number) {
			const w = Math.round(width * dpr);
			const h = Math.round(height * dpr);
			canvas.width = w;
			canvas.height = h;
			gl.viewport(0, 0, w, h);
			gl.uniform2f(uRes, w, h);
		},

		destroy() {
			gl.deleteBuffer(vbo);
			gl.deleteProgram(program);
			gl.deleteShader(vs);
			gl.deleteShader(fs);
			const ext = gl.getExtension("WEBGL_lose_context");
			ext?.loseContext();
		},
	};
}
