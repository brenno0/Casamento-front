import { gsap } from 'gsap';
import { useEffect, useRef } from 'react';
import {
  Color,
  DoubleSide,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  Scene,
  Shape,
  ShapeGeometry,
  WebGLRenderer,
} from 'three';

const QUANTIDADE = 28;
const CORES = ['#e4b8bd', '#f1d3d6', '#f8ebec', '#fcebdf', '#eeeaf7', '#d9a3aa'];
const ALTURA = 6;
const LARGURA = 14;

interface Petala {
  x: number;
  y: number;
  z: number;
  queda: number;
  giro: number;
  fase: number;
  escala: number;
}

function formaDePetala(): ShapeGeometry {
  const s = new Shape();
  s.moveTo(0, -0.5);
  s.bezierCurveTo(0.45, -0.2, 0.4, 0.35, 0, 0.5);
  s.bezierCurveTo(-0.4, 0.35, -0.45, -0.2, 0, -0.5);
  return new ShapeGeometry(s, 8);
}

function novaPetala(y = (Math.random() - 0.5) * ALTURA): Petala {
  return {
    x: (Math.random() - 0.5) * LARGURA,
    y,
    z: (Math.random() - 0.5) * 3,
    queda: 0.18 + Math.random() * 0.22,
    giro: 0.3 + Math.random() * 0.6,
    fase: Math.random() * Math.PI * 2,
    escala: 0.16 + Math.random() * 0.14,
  };
}

function webglDisponivel(): boolean {
  try {
    return Boolean(document.createElement('canvas').getContext('webgl2'));
  } catch {
    return false;
  }
}

/** Pétalas caindo devagar atrás do título. Para quando sai da tela ou a aba fica oculta. */
export function CenaPetalas({ className = '' }: { className?: string }) {
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = caixa.current;
    if (!el || !webglDisponivel()) return;

    const renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    el.appendChild(renderer.domElement);

    const cena = new Scene();
    const camera = new PerspectiveCamera(35, 1, 0.1, 50);
    camera.position.z = 10;

    const geometria = formaDePetala();
    const material = new MeshBasicMaterial({ side: DoubleSide, transparent: true, opacity: 0.9 });
    const malha = new InstancedMesh(geometria, material, QUANTIDADE);
    const cor = new Color();
    for (let i = 0; i < QUANTIDADE; i++) malha.setColorAt(i, cor.set(CORES[i % CORES.length] ?? CORES[0]!));
    cena.add(malha);

    const petalas = Array.from({ length: QUANTIDADE }, () => novaPetala());
    const pivo = new Object3D();
    let tempo = 0;

    function quadro(_: number, deltaMs: number) {
      const dt = Math.min(deltaMs, 50) / 1000;
      tempo += dt;
      petalas.forEach((p, i) => {
        p.y -= p.queda * dt;
        if (p.y < -ALTURA / 2 - 0.5) Object.assign(p, novaPetala(ALTURA / 2 + 0.5));
        pivo.position.set(p.x + Math.sin(tempo * 0.6 + p.fase) * 0.4, p.y, p.z);
        pivo.rotation.set(tempo * p.giro + p.fase, Math.sin(tempo * 0.8 + p.fase) * 1.2, tempo * p.giro * 0.5);
        pivo.scale.setScalar(p.escala);
        pivo.updateMatrix();
        malha.setMatrixAt(i, pivo.matrix);
      });
      malha.instanceMatrix.needsUpdate = true;
      renderer.render(cena, camera);
    }

    function redimensionar() {
      const { clientWidth: w, clientHeight: h } = el!;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    let visivel = true;
    const atualizarLaco = () => {
      gsap.ticker.remove(quadro);
      if (visivel && !document.hidden) gsap.ticker.add(quadro);
    };
    const tamanho = new ResizeObserver(redimensionar);
    const vista = new IntersectionObserver(([e]) => {
      visivel = Boolean(e?.isIntersecting);
      atualizarLaco();
    });
    tamanho.observe(el);
    vista.observe(el);
    document.addEventListener('visibilitychange', atualizarLaco);
    redimensionar();
    atualizarLaco();
    gsap.fromTo(renderer.domElement, { opacity: 0 }, { opacity: 1, duration: 1.4, ease: 'power2.out' });

    return () => {
      gsap.ticker.remove(quadro);
      document.removeEventListener('visibilitychange', atualizarLaco);
      tamanho.disconnect();
      vista.disconnect();
      geometria.dispose();
      material.dispose();
      malha.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={caixa} aria-hidden="true" className={`[&>canvas]:block [&>canvas]:size-full ${className}`} />;
}
