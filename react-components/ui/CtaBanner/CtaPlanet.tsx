import { useEffect, useRef } from "react";

/** Where the planet's disc sits inside the photo (texture UV centre and radii). */
const DISC = { u: 0.5006, v: 0.4966, ru: 0.2017, rv: 0.3025 };
const SUN = [0.671, 0.559, 0.487];
/** Longitude band visible in the photo; the far side reuses it. */
const LON = [(-37 * Math.PI) / 180, (65 * Math.PI) / 180];
const PERIOD_SECONDS = 90;

const VERTEX_SHADER = `
attribute vec2 aPos;
varying vec2 vPos;
void main() { vPos = aPos; gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAGMENT_SHADER = `
precision highp float;
uniform sampler2D uTex;
uniform vec3 uSun;
uniform vec4 uDisc;
uniform vec2 uLon;
uniform float uAngle;
varying vec2 vPos;
const float DISSOLVE = 0.0698;
const float LIFT = 0.2094;
void fold(float lon, float lat, out float lonA, out float lonB, out float wB) {
  float span = uLon.y - uLon.x;
  float w = 0.14 * sin(3.0 * lat);
  float s = mod(lon + uAngle - uLon.x, 2.0 * span);
  float d = s < span ? s : s - 2.0 * span;
  bool nearWrap = s < 0.5 * span || s >= 1.5 * span;
  wB = nearWrap ? 1.0 - smoothstep(-DISSOLVE, DISSOLVE, d + w)
                : smoothstep(span - DISSOLVE, span + DISSOLVE, s + w);
  lonA = uLon.x + (nearWrap ? d : s);
  lonB = nearWrap ? uLon.x - d - 2.0 * w : uLon.y + (span - s) - 2.0 * w;
}
float shade(float d) { return 0.12 + 0.88 * pow(clamp(d, 0.0, 1.0), 0.8); }
vec3 relit(vec3 n, float lon, float lat) {
  float cl = cos(lat);
  vec3 ns = vec3(sin(lon) * cl, sin(lat), cos(lon) * cl);
  float k = 1.0 - 0.02 * smoothstep(0.85, 1.0, length(ns.xy));
  vec3 tex = texture2D(uTex, vec2(uDisc.x + ns.x * uDisc.z * k, uDisc.y - ns.y * uDisc.w * k)).rgb;
  float gain = min(shade(dot(n, uSun)) / shade(dot(ns, uSun)), 2.2);
  vec3 lifted = 1.0 - (1.0 - tex) * exp(-tex * (gain - 1.0) / max(1.0 - tex, 0.02));
  return gain > 1.0 ? lifted : tex * gain;
}
void main() {
  float r2 = dot(vPos, vPos);
  if (r2 > 1.0) discard;
  vec3 n = vec3(vPos, sqrt(1.0 - r2));
  float lat = asin(clamp(vPos.y, -1.0, 1.0));
  float lonA, lonB, wB;
  fold(atan(vPos.x, n.z), lat, lonA, lonB, wB);
  gl_FragColor = vec4(mix(relit(n, lonA, lat), relit(n, lonB, min(lat + LIFT, 1.45)), wB), 1.0);
}
`;

type CtaPlanetProps = {
  src: string;
};

/**
 * The photo is shown as-is; once its pixels are uploaded, a WebGL canvas fades in over the
 * planet's disc and re-projects it onto a spinning sphere.
 */
export function CtaPlanet({ src }: CtaPlanetProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) return;
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false });
    if (!gl) return;

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
    };
    const vertex = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    gl.uniform3fv(gl.getUniformLocation(program, "uSun"), SUN);
    gl.uniform4f(gl.getUniformLocation(program, "uDisc"), DISC.u, DISC.v, DISC.ru, DISC.rv);
    gl.uniform2fv(gl.getUniformLocation(program, "uLon"), LON);
    const angleLocation = gl.getUniformLocation(program, "uAngle");

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.clearColor(0, 0, 0, 0);

    let frame = 0;
    let visible = true;
    let stopped = false;
    let textureReady = false;
    let frameCount = 0;
    let start = 0;

    const render = (time: number) => {
      frame = 0;
      if (stopped || !visible || document.hidden) return;
      if (frameCount < 2) start = time;
      frameCount++;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(canvas.clientWidth * ratio);
      const height = Math.round(canvas.clientHeight * ratio);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
      gl.uniform1f(angleLocation, ((time - start) / 1000 / PERIOD_SECONDS) * Math.PI * 2);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      canvas.style.opacity = "1";
      frame = requestAnimationFrame(render);
    };

    const resume = () => {
      if (frame || !textureReady || stopped || !visible || document.hidden) return;
      frame = requestAnimationFrame(render);
    };

    const upload = () => {
      if (stopped) return;
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      } catch {
        // A cross-origin image without CORS headers taints the canvas; keep the static photo.
        return;
      }
      textureReady = true;
      resume();
    };

    if (img.complete && img.naturalWidth > 0) upload();
    else img.addEventListener("load", upload, { once: true });

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      resume();
    });
    observer.observe(canvas);
    document.addEventListener("visibilitychange", resume);

    const stop = () => {
      stopped = true;
      cancelAnimationFrame(frame);
      canvas.style.opacity = "0";
    };
    motion.addEventListener("change", stop);

    return () => {
      stop();
      observer.disconnect();
      motion.removeEventListener("change", stop);
      document.removeEventListener("visibilitychange", resume);
      img.removeEventListener("load", upload);
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, [src]);

  return (
    <>
      <img
        ref={imgRef}
        className="ca-cta__orb-img"
        crossOrigin="anonymous"
        src={src}
        alt=""
        decoding="async"
        width={2000}
        height={1333}
      />
      <canvas ref={canvasRef} className="ca-cta__orb-canvas" aria-hidden="true" />
    </>
  );
}

export default CtaPlanet;
