"use client";

import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";

type ProductCapeViewerProps = {
  texturePath: string;
  compact?: boolean;
  variant?: "shop-card" | "pdp";
  reducedMotion?: boolean;
  isHovered?: boolean;
};

export default function ProductCapeViewer({
  texturePath,
  compact = false,
  variant = "pdp",
  reducedMotion,
  isHovered = false,
}: ProductCapeViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const isHoveredRef = useRef(isHovered);

  useEffect(() => {
    isHoveredRef.current = isHovered;
  }, [isHovered]);

  const shouldReduce = useMemo(() => {
    if (typeof reducedMotion === "boolean") return reducedMotion;
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, [reducedMotion]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 240;
    const height = mount.clientHeight || 240;
    const isMobile = window.innerWidth <= 768;
    const lowPower = shouldReduce || isMobile;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, variant === "shop-card" ? 0.1 : 0.15, variant === "shop-card" ? 3.25 : 3.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: !lowPower,
      alpha: true,
      powerPreference: lowPower ? "low-power" : "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1 : 1.8));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = variant === "shop-card" ? 1.5 : 1.6;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    RectAreaLightUniformsLib.init();
    scene.add(new THREE.AmbientLight(0xffffff, lowPower ? 0.9 : 1.05));
    scene.add(new THREE.HemisphereLight(0xf0fff8, 0xd8e8e0, 1.1));

    const areaLight = new THREE.RectAreaLight(0xf8fffc, 0.9, 5, 5);
    areaLight.position.set(-2.2, 1.8, 2.8);
    areaLight.lookAt(0, 0, 0);
    scene.add(areaLight);

    const fill = new THREE.DirectionalLight(0xe8f5f0, 0.15);
    fill.position.set(-1.5, 1.2, 2.2);
    scene.add(fill);

    const geo = new THREE.BoxGeometry(1.4, 2.24, 0.14);
    const uv = geo.attributes.uv.array as number[];
    const W = 64;
    const H = 32;
    const u = (x: number) => (x - 1) / W;
    const v = (y: number) => 1 - (y - 1) / H;
    const setFace = (offset: number, x1: number, y1: number, x2: number, y2: number) => {
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
    let mounted = true;
    let capeMat: THREE.Material | null = null;
    let capeTex: THREE.Texture | null = null;

    new THREE.TextureLoader().load(texturePath, (tex) => {
      if (!mounted) return;
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.MeshPhysicalMaterial({
        map: tex,
        roughness: 0.12,
        metalness: 0.04,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
      });
      cape = new THREE.Mesh(geo, mat);
      cape.rotation.x = 0.01;
      scene.add(cape);
      capeMat = mat;
      capeTex = tex;
    });

    const onResize = () => {
      const w = mount.clientWidth || 240;
      const h = mount.clientHeight || 240;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    const allowDragRotate = variant === "pdp";
    const allowAutoSpin = !allowDragRotate;
    const enableMobileScrollSpin = allowAutoSpin && isMobile;
    let dragYaw = (30 * Math.PI) / 180;
    let dragStartX = 0;
    let dragStartYaw = dragYaw;
    let dragging = false;
    let scrollSpinRequested = false;
    let centerSpinArmed = true;
    let lastScrollY = window.scrollY;
    let prevCenterOffset: number | null = null;

    const onPointerDown = (event: PointerEvent) => {
      if (!allowDragRotate) return;
      dragging = true;
      dragStartX = event.clientX;
      dragStartYaw = dragYaw;
      mount.setPointerCapture(event.pointerId);
      mount.style.cursor = "grabbing";
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!allowDragRotate || !dragging) return;
      const dx = event.clientX - dragStartX;
      dragYaw = dragStartYaw + dx * 0.01;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!allowDragRotate || !dragging) return;
      dragging = false;
      if (mount.hasPointerCapture(event.pointerId)) {
        mount.releasePointerCapture(event.pointerId);
      }
      mount.style.cursor = "grab";
    };

    if (allowDragRotate) {
      mount.style.cursor = "grab";
      mount.style.touchAction = "none";
      mount.addEventListener("pointerdown", onPointerDown);
      mount.addEventListener("pointermove", onPointerMove);
      mount.addEventListener("pointerup", onPointerUp);
      mount.addEventListener("pointercancel", onPointerUp);
      mount.addEventListener("pointerleave", onPointerUp);
    }

    const maybeTriggerCenterSpin = () => {
      if (!enableMobileScrollSpin || shouldReduce) return;
      const rect = mount.getBoundingClientRect();
      if (rect.height <= 0) return;
      const viewportCenter = window.innerHeight * 0.5;
      const elementCenter = rect.top + rect.height * 0.5;
      const currentCenterOffset = elementCenter - viewportCenter;
      if (prevCenterOffset === null) {
        prevCenterOffset = currentCenterOffset;
      }
      const scrollingDown = window.scrollY > lastScrollY;

      const crossedCenterDown =
        scrollingDown &&
        centerSpinArmed &&
        prevCenterOffset > 0 &&
        currentCenterOffset <= 0;
      if (crossedCenterDown) {
        scrollSpinRequested = true;
        centerSpinArmed = false;
      }

      const crossedCenterUp =
        !scrollingDown &&
        !centerSpinArmed &&
        prevCenterOffset < 0 &&
        currentCenterOffset >= 0;
      if (crossedCenterUp) {
        centerSpinArmed = true;
      }

      prevCenterOffset = currentCenterOffset;
      lastScrollY = window.scrollY;
    };

    const onScroll = () => {
      if (!enableMobileScrollSpin || shouldReduce) return;
      maybeTriggerCenterSpin();
    };
    if (enableMobileScrollSpin) {
      window.addEventListener("scroll", onScroll, { passive: true });
      maybeTriggerCenterSpin();
    }

    let rafId = 0;
    let wasHovered = false;
    let spinProgress = 0;
    let spinCycleActive = false;
    let spinCycleStartAt = 0;
    const baseRotY = (30 * Math.PI) / 180;
    const spinDuration = 700;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const beginSpinCycle = (now: number) => {
      spinCycleActive = true;
      spinCycleStartAt = now;
      scrollSpinRequested = false;
    };

    const tick = () => {
      if (!mounted) return;
      rafId = requestAnimationFrame(tick);
      const hovered = isHoveredRef.current && !shouldReduce;
      const now = performance.now();

      if (allowAutoSpin) {
        if (hovered && !wasHovered && !spinCycleActive) {
          beginSpinCycle(now);
        }
        if (!spinCycleActive && scrollSpinRequested) {
          beginSpinCycle(now);
        }

        if (spinCycleActive) {
          const elapsed = now - spinCycleStartAt;
          const rawProgress = Math.min(1, elapsed / spinDuration);
          spinProgress = easeOutCubic(rawProgress);
          if (rawProgress >= 1) {
            spinCycleActive = false;
            spinProgress = 0;
          }
        } else {
          spinProgress = 0;
        }
        wasHovered = hovered;
      } else {
        spinProgress = 0;
      }

      if (cape) {
        cape.rotation.y = allowDragRotate ? dragYaw : baseRotY + spinProgress * 2 * Math.PI;
        cape.rotation.x = 0.01;
      }

      renderer.render(scene, camera);
    };

    tick();

    return () => {
      mounted = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      mount.removeEventListener("pointerdown", onPointerDown);
      mount.removeEventListener("pointermove", onPointerMove);
      mount.removeEventListener("pointerup", onPointerUp);
      mount.removeEventListener("pointercancel", onPointerUp);
      mount.removeEventListener("pointerleave", onPointerUp);
      mount.style.cursor = "";
      mount.style.touchAction = "";
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
      geo.dispose();
      capeMat?.dispose();
      capeTex?.dispose();
    };
  }, [shouldReduce, texturePath, variant]);

  return (
    <div
      ref={mountRef}
      className={`h-full w-full ${compact ? "min-h-0" : "min-h-[240px]"}`}
      style={{
        background: "transparent",
        filter: "drop-shadow(8px 8px 28px rgba(255,255,255,0.45))",
      }}
    />
  );
}
