"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type HeroCapeStageProps = {
  quality?: "auto" | "high" | "low";
  interactive?: boolean;
  className?: string;
  texturePath?: string;
};

const canUseWebGl = () => {
  if (typeof window === "undefined") return false;

  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl"),
    );
  } catch {
    return false;
  }
};

const HeroCapeStage = ({
  quality = "auto",
  interactive = true,
  className,
  texturePath = "/cape renders/experience-cape.png",
}: HeroCapeStageProps) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [webglAvailable] = useState(() => canUseWebGl());

  const reducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !webglAvailable) return;

    let mounted = true;

    const width = mount.clientWidth || 520;
    const height = mount.clientHeight || 520;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0, 3.95);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);

    const mobile = window.innerWidth <= 768;
    const lowPower = reducedMotion || mobile;
    const dprCap =
      quality === "high"
        ? 2
        : quality === "low" || lowPower
          ? 1
          : 1.7;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprCap));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.38;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));

    const hemi = new THREE.HemisphereLight(0xf6fffb, 0xd2e6db, 0.5);
    scene.add(hemi);

    const rim = new THREE.DirectionalLight(0xdafbef, 1.0);
    rim.position.set(3.8, 2.5, 2.1);
    scene.add(rim);

    const fill = new THREE.DirectionalLight(0xe7ffe9, 0.72);
    fill.position.set(-1.8, 1.6, 2.5);
    scene.add(fill);

    const back = new THREE.DirectionalLight(0xe7fff5, 0.45);
    back.position.set(-2, -1.2, -2.8);
    scene.add(back);

    const front = new THREE.DirectionalLight(0xffffff, 0.4);
    front.position.set(0, 0.3, 3.2);
    scene.add(front);

    const geo = new THREE.BoxGeometry(1.45, 2.3, 0.16);
    const uv = geo.attributes.uv.array as number[];
    const W = 64;
    const H = 32;
    const u = (x: number) => (x - 1) / W;
    const v = (y: number) => 1 - (y - 1) / H;
    const setFace = (
      offset: number,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
    ) => {
      const u1 = u(x1);
      const u2 = u(Math.max(x1, x2) + 1);
      const vTop = v(y1);
      const vBottom = v(Math.max(y1, y2) + 1);
      uv[offset + 0] = u1;
      uv[offset + 1] = vTop;
      uv[offset + 2] = u2;
      uv[offset + 3] = vTop;
      uv[offset + 4] = u1;
      uv[offset + 5] = vBottom;
      uv[offset + 6] = u2;
      uv[offset + 7] = vBottom;
    };

    setFace(0, 12, 2, 12, 17);
    setFace(8, 1, 2, 1, 17);
    setFace(16, 1, 2, 1, 11);
    setFace(24, 1, 12, 1, 21);
    setFace(32, 2, 2, 11, 17);
    setFace(40, 13, 2, 22, 17);
    geo.attributes.uv.needsUpdate = true;

    let cape: THREE.Mesh | null = null;

    new THREE.TextureLoader().load(texturePath, (tex) => {
      if (!mounted) return;
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.colorSpace = THREE.SRGBColorSpace;

      cape = new THREE.Mesh(
        geo,
        new THREE.MeshPhysicalMaterial({
          map: tex,
          roughness: 0.44,
          metalness: 0.02,
          clearcoat: 0.5,
          clearcoatRoughness: 0.35,
        }),
      );
      cape.rotation.x = -0.05;
      cape.rotation.y = 0.35;
      cape.position.set(0, 0, 0);
      scene.add(cape);
      setReady(true);
    });

    let pointerX = 0;
    let pointerY = 0;

    const onPointerMove = (event: MouseEvent) => {
      if (!interactive || lowPower) return;
      const rect = mount.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      pointerX = nx;
      pointerY = ny;
    };

    if (interactive) {
      mount.addEventListener("mousemove", onPointerMove);
    }

    const onResize = () => {
      const w = mount.clientWidth || 520;
      const h = mount.clientHeight || 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", onResize);

    let rafId = 0;

    const tick = () => {
      if (!mounted) return;
      rafId = requestAnimationFrame(tick);

      if (cape) {
        const targetRotY = 0.34 + pointerX * 0.15;
        const targetRotX = -0.035 + pointerY * 0.05;
        cape.rotation.y += (targetRotY - cape.rotation.y) * 0.08;
        cape.rotation.x += (targetRotX - cape.rotation.x) * 0.08;
        cape.position.y = 0;
      }

      renderer.render(scene, camera);
    };

    tick();

    return () => {
      mounted = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      mount.removeEventListener("mousemove", onPointerMove);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geo.dispose();
    };
  }, [interactive, quality, reducedMotion, texturePath, webglAvailable]);

  return (
    <div className={`relative h-full w-full ${className ?? ""}`}>
      <div
        ref={mountRef}
        className="relative h-full w-full"
      />
      {(!webglAvailable || !ready) && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-56 w-56 rounded-full border border-[color-mix(in_srgb,var(--primary),#fff_25%)] bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.26),transparent_58%)]" />
        </div>
      )}
    </div>
  );
};

export default HeroCapeStage;
