"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useMotionValue, useMotionValueEvent, type MotionValue } from "framer-motion";

export default function CapeViewer({ scrollProgress }: { scrollProgress?: number | MotionValue<number> }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(0);
  const fallback = useMotionValue(0);
  const source = typeof scrollProgress === "object" && scrollProgress ? scrollProgress : fallback;

  useMotionValueEvent(source, "change", (v) => { scrollRef.current = v; });
  useEffect(() => {
    if (typeof scrollProgress === "number") {
      scrollRef.current = scrollProgress;
      fallback.set(scrollProgress);
    }
  }, [typeof scrollProgress === "number" ? scrollProgress : null]);

  const stateRef = useRef<{
    cape: THREE.Mesh | null;
    frame: number;
    rot: number;
    mounted: boolean;
    cleanup: (() => void) | null;
  }>({
    cape: null,
    frame: 0,
    rot: 0.35,
    mounted: true,
    cleanup: null,
  });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    stateRef.current.mounted = true;

    const timeout = setTimeout(() => {
      if (!stateRef.current.mounted) return;

      const width = mount.clientWidth || 400;
      const height = mount.clientHeight || 500;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
      camera.position.set(0, 0.3, 5.2);
      camera.lookAt(0, -0.1, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.4;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      mount.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 1.6));

      const hemi = new THREE.HemisphereLight(0xffffff, 0xeeeeee, 1.4);
      scene.add(hemi);

      const soft = new THREE.DirectionalLight(0xffffff, 0.3);
      soft.position.set(2, 3, 5);
      scene.add(soft);

      // Cape: 10×16×1 box. Texture coords 1-based (top-left = 1,1)
      // Front: (2,2) to (11,17) | Left: (1,2) to (1,17) | Back: (13,2) to (22,17)
      // Right edge: (12,2) to (12,17) | Top: (1,2) to (1,11) | Bottom: (1,12) to (1,21)
      const geo = new THREE.BoxGeometry(1.4, 2.24, 0.14);
      const uv = geo.attributes.uv.array as unknown as number[];
      const W = 64, H = 32;
      const u = (x: number) => (x - 1) / W;
      const v = (y: number) => 1 - (y - 1) / H;  // y=1 top -> v=1
      const setFace = (offset: number, x1: number, y1: number, x2: number, y2: number) => {
        const u1 = u(x1), u2 = u(Math.max(x1, x2) + 1), vT = v(y1), vB = v(Math.max(y1, y2) + 1);
        uv[offset + 0] = u1; uv[offset + 1] = vT;   // tl
        uv[offset + 2] = u2; uv[offset + 3] = vT;   // tr
        uv[offset + 4] = u1; uv[offset + 5] = vB;   // bl
        uv[offset + 6] = u2; uv[offset + 7] = vB;   // br
      };
      setFace(0, 12, 2, 12, 17);   // face 0 (+x): right edge
      setFace(8, 1, 2, 1, 17);    // face 1 (-x): left
      setFace(16, 1, 2, 1, 11);   // face 2 (+y): top
      setFace(24, 1, 12, 1, 21);  // face 3 (-y): bottom
      setFace(32, 2, 2, 11, 17);   // face 4 (+z): front (faces camera at start)
      setFace(40, 13, 2, 22, 17); // face 5 (-z): back
      geo.attributes.uv.needsUpdate = true;

      new THREE.TextureLoader().load("/experience_cape_texture.png", (tex) => {
        if (!stateRef.current.mounted) return;
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.colorSpace = THREE.SRGBColorSpace;
        const mat = new THREE.MeshPhysicalMaterial({
          map: tex,
          roughness: 0.15,
          metalness: 0.05,
          clearcoat: 0.95,
          clearcoatRoughness: 0.05,
        });
        const cape = new THREE.Mesh(geo, mat);
        cape.rotation.x = -0.05;
        cape.rotation.y = 0.35;
        scene.add(cape);
        stateRef.current.cape = cape;
      });

      const onResize = () => {
        const w = mount.clientWidth || 400;
        const h = mount.clientHeight || 500;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", onResize);

      const targetRotationFromScroll = (p: number) => {
        const base = 0.35;
        if (p <= 0) return base;

        const fullTurn = Math.PI * 2;

        if (p <= 0.15) {
          const x = p / 0.15;
          const eased =
            x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
          return base + fullTurn * eased;
        }

        return base + fullTurn + ((p - 0.15) / 0.85) * 1.2;
      };

      let rafId = 0;
      const tick = () => {
        if (!stateRef.current.mounted) return;

        rafId = requestAnimationFrame(tick);
        stateRef.current.frame += 1;

        const cape = stateRef.current.cape;
        const frame = stateRef.current.frame;

        if (cape) {
          const target = targetRotationFromScroll(scrollRef.current);
          stateRef.current.rot += (target - stateRef.current.rot) * 0.08;

          cape.rotation.y = stateRef.current.rot;
          cape.position.y = 0.035 * Math.sin(0.008 * frame * 0.6);
        }

        renderer.render(scene, camera);
      };

      rafId = requestAnimationFrame(tick);

      stateRef.current.cleanup = () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener("resize", onResize);
        if (mount.contains(renderer.domElement))
          mount.removeChild(renderer.domElement);
        renderer.dispose();
      };
    }, 60);

    return () => {
      stateRef.current.mounted = false;
      clearTimeout(timeout);
      stateRef.current.cleanup?.();
    };
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 400,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 220,
          height: 340,
          background:
            "radial-gradient(ellipse, rgba(51,191,255,0.08) 0%, transparent 70%)",
          filter: "blur(5px)",
          pointerEvents: "none",
        }}
      />
      <div
        ref={mountRef}
        className="cape-canvas"
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          minWidth: 280,
          minHeight: 400,
        }}
      />
    </div>
  );
}
