export interface WebGLCapabilityReport {
  available: boolean;
  renderer: string;
  maxTextureSize: number;
  extensions: string[];
}

export function isWebGL2Available(canvas?: HTMLCanvasElement): boolean {
  if (typeof document === 'undefined' && !canvas) return false;
  const target = canvas ?? document.createElement('canvas');
  return Boolean(target.getContext('webgl2'));
}

export function getWebGL2Context(canvas: HTMLCanvasElement): WebGL2RenderingContext | null {
  return canvas.getContext('webgl2', { antialias: false, alpha: false, preserveDrawingBuffer: true });
}

export function inspectWebGL2(canvas?: HTMLCanvasElement): WebGLCapabilityReport {
  if (typeof document === 'undefined' && !canvas) return { available: false, renderer: 'server', maxTextureSize: 0, extensions: [] };
  const target = canvas ?? document.createElement('canvas');
  const gl = getWebGL2Context(target);
  if (!gl) return { available: false, renderer: 'unavailable', maxTextureSize: 0, extensions: [] };
  const debug = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = debug ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER));
  return {
    available: true,
    renderer,
    maxTextureSize: Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)),
    extensions: gl.getSupportedExtensions() ?? [],
  };
}

export function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Unable to allocate WebGL shader.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? 'unknown shader error';
    gl.deleteShader(shader);
    throw new Error(log);
  }
  return shader;
}

export function createProgram(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error('Unable to allocate WebGL program.');
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? 'unknown link error';
    gl.deleteProgram(program);
    throw new Error(log);
  }
  return program;
}

export function uploadImageDataTexture(gl: WebGL2RenderingContext, image: ImageData): WebGLTexture {
  const texture = gl.createTexture();
  if (!texture) throw new Error('Unable to allocate WebGL texture.');
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, image.width, image.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, image.data);
  return texture;
}

export const WEBGL_STATUS = 'ready-capability-layer';
