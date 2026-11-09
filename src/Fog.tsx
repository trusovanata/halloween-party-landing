// Туман на WebGL: fbm-шум с domain warping. Два шлейфа из пасти тыквы
// (в стороны от ди-джеев) + низкий туман над толпой. Без зависимостей и
// чужих ассетов. Если WebGL недоступен — onReady(false), остаётся CSS-дым.
import { useEffect, useRef } from "react"

const VERT = `attribute vec2 a;varying vec2 uv;void main(){uv=a*.5+.5;uv.y=1.-uv.y;gl_Position=vec4(a,0.,1.);}`

const FRAG = `
precision mediump float;
varying vec2 uv;
uniform float t;
uniform float asp;

float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n(vec2 p){
  vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);
}
float fbm(vec2 p){
  float v=0.,a=.5;
  for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}
  return v;
}
// клубы: шум, которым искажают сам же шум
float cloud(vec2 p,float tt){
  vec2 q=vec2(fbm(p+vec2(tt*.05,0.)),fbm(p+vec2(5.2,1.3)-vec2(0.,tt*.04)));
  return fbm(p+2.2*q+vec2(tt*.03,-tt*.02));
}

void main(){
  vec2 p=vec2(uv.x*asp,uv.y);
  vec2 mouth=vec2(.513*asp,.41);
  float dens=0.;

  // два шлейфа из пасти: влево и вправо, расширяются и тают
  for(int k=0;k<2;k++){
    float s=k==0?-1.:1.;
    vec2 d=p-mouth;
    float along=s*d.x;
    float across=d.y-.16*along;
    float w=.05+.3*along;
    float body=smoothstep(.0,.05,along)*(1.-smoothstep(.28,.78,along));
    float core=exp(-pow(across/max(w,.001),2.));
    vec2 q=vec2(s*along*3.2-t*.3*s,across*4.5); // дрейф ОТ пасти к краям
    float c=cloud(q+vec2(float(k)*7.3,0.),t);
    dens+=body*core*smoothstep(.15,.65,c)*2.4;
  }

  // низкий туман над толпой, дрейфует вбок
  float ground=smoothstep(.5,.95,uv.y)*.95;
  float gc=cloud(vec2(abs(p.x-mouth.x)*1.7-t*.06,p.y*3.6),t*.8);
  dens+=ground*smoothstep(.3,.8,gc)*.9;

  // лёгкая дымка по всему кадру
  dens+=.07*cloud(p*1.4+vec2(0.,t*.02),t);

  float md=distance(p,mouth);
  vec3 col=mix(vec3(.5,.76,1.),vec3(1.,.78,.55),.6*exp(-md*5.5));
  float a=clamp(dens*.4,0.,.55);
  gl_FragColor=vec4(col*a,a); // premultiplied
}
`

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)
  if (!s) return null
  gl.shaderSource(s, src)
  gl.compileShader(s)
  return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null
}

export function Fog({
  onReady,
  paused,
}: {
  onReady: (ok: boolean) => void
  paused?: boolean
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
    })
    const vs = gl && compile(gl, gl.VERTEX_SHADER, VERT)
    const fs = gl && compile(gl, gl.FRAGMENT_SHADER, FRAG)
    const prog = gl && vs && fs ? gl.createProgram() : null
    if (!gl || !vs || !fs || !prog) {
      onReady(false)
      return
    }
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      onReady(false)
      return
    }
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    )
    const loc = gl.getAttribLocation(prog, "a")
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const uT = gl.getUniformLocation(prog, "t")
    const uAsp = gl.getUniformLocation(prog, "asp")
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

    // рисуем в низком разрешении (туман мягкий) — дёшево для GPU
    const W = 640
    const H = Math.round((W * 768) / 1344)
    canvas.width = W
    canvas.height = H
    gl.viewport(0, 0, W, H)
    gl.uniform1f(uAsp, 1344 / 768)

    let visible = false
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting
      },
      { rootMargin: "100px" },
    )
    io.observe(canvas)

    let raf = 0
    let last = 0
    const t0 = performance.now()
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (!visible || document.hidden || pausedRef.current) return
      if (now - last < 33) return // ~30 fps
      last = now
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform1f(uT, (now - t0) / 1000 + 20)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }
    raf = requestAnimationFrame(frame)
    onReady(true)

    const lost = (e: Event) => {
      e.preventDefault()
      onReady(false)
    }
    canvas.addEventListener("webglcontextlost", lost)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      canvas.removeEventListener("webglcontextlost", lost)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <canvas aria-hidden="true" className="dance__fog" ref={ref} />
}
