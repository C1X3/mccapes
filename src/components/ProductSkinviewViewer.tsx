"use client";

import { useEffect, useRef, useState } from "react";

type ProductSkinviewViewerProps = {
  texturePath: string;
  mode: "player" | "elytra";
  skinPath?: string;
  pausedAnimation?: boolean;
  showPlayer?: boolean;
};

type Skinview3dLib = {
  SkinViewer: new (options: {
    canvas: HTMLCanvasElement;
    width: number;
    height: number;
    skin?: string;
  }) => {
    width: number;
    height: number;
    fov: number;
    zoom: number;
    autoRotate: boolean;
    animation: unknown;
    loadSkin: (skinUrl: string) => Promise<void> | void;
    loadCape: (
      capeUrl: string | null,
      options?: { backEquipment?: "cape" | "elytra" },
    ) => Promise<void> | void;
    render: () => void;
    dispose?: () => void;
    playerObject?: {
      position?: {
        x: number;
        y: number;
        z: number;
      };
      rotation: {
        x: number;
        y: number;
        z: number;
      };
    };
  };
  createOrbitControls?: (viewer: unknown) => {
    enableRotate: boolean;
    enableZoom: boolean;
    enablePan: boolean;
    minPolarAngle?: number;
    maxPolarAngle?: number;
    dispose?: () => void;
  };
  FlyingAnimation?: new () => {
    paused?: boolean;
    speed?: number;
  };
  WalkingAnimation?: new () => {
    paused?: boolean;
    speed?: number;
  };
};

declare global {
  interface Window {
    skinview3d?: Skinview3dLib;
  }
}

const SKINVIEW3D_CDN =
  "https://cdn.jsdelivr.net/npm/skinview3d@3.4.1/bundles/skinview3d.bundle.js";

const loadSkinview3d = async (): Promise<Skinview3dLib> => {
  if (window.skinview3d) return window.skinview3d;

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-skinview3d="1"]',
    );
    if (existing) {
      if (window.skinview3d) resolve();
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("skinview3d script failed to load")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = SKINVIEW3D_CDN;
    script.async = true;
    script.dataset.skinview3d = "1";
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Unable to load skinview3d CDN bundle"));
    document.head.appendChild(script);
  });

  if (!window.skinview3d) {
    throw new Error("skinview3d global not found after script load");
  }
  return window.skinview3d;
};

export default function ProductSkinviewViewer({
  texturePath,
  mode,
  skinPath = "/skin.png",
  pausedAnimation = false,
  showPlayer = true,
}: ProductSkinviewViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);

  const getTransparentSkinDataUrl = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, 64, 64);
    }
    return canvas.toDataURL("image/png");
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let viewer: InstanceType<Skinview3dLib["SkinViewer"]> | null = null;
    let controls:
      | ReturnType<NonNullable<Skinview3dLib["createOrbitControls"]>>
      | null = null;
    let dragging = false;
    let dragStartX = 0;
    let dragStartYaw = 0;

    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    mount.appendChild(canvas);

    const setup = async () => {
      try {
        const lib = await loadSkinview3d();
        if (disposed) return;

        const width = mount.clientWidth || 900;
        const height = mount.clientHeight || 630;

        viewer = new lib.SkinViewer({
          canvas,
          width,
          height,
          skin:
            mode === "elytra" && !showPlayer
              ? getTransparentSkinDataUrl()
              : skinPath,
        });

        viewer.fov = mode === "elytra" ? 39 : 40;
        viewer.zoom = mode === "elytra" ? 1.0 : 1.0;
        viewer.autoRotate = false;
        viewer.animation = null;

        const resolvedSkinPath =
          mode === "elytra" && !showPlayer
            ? getTransparentSkinDataUrl()
            : skinPath;

        await viewer.loadSkin(resolvedSkinPath);
        await viewer.loadCape(
          texturePath,
          mode === "elytra" ? { backEquipment: "elytra" } : undefined,
        );

        if (lib.createOrbitControls) {
          controls = lib.createOrbitControls(viewer);
          controls.enableRotate = false;
          controls.enableZoom = false;
          controls.enablePan = false;
        }

        if ((mode === "player" || mode === "elytra") && lib.WalkingAnimation) {
          const walking = new lib.WalkingAnimation();
          walking.speed = mode === "elytra" ? 0.65 : 0.7;
          walking.paused = pausedAnimation;
          viewer.animation = walking;
        }

        // Apply initial facing after controls/animation setup so back view sticks.
        if (viewer.playerObject) {
          if (mode === "elytra" && !showPlayer) {
            const playerObject = viewer.playerObject as {
              traverse?: (
                callback: (obj: { name?: string; visible?: boolean }) => void,
              ) => void;
            };
            playerObject.traverse?.((obj: { name?: string; visible?: boolean }) => {
              const name = (obj.name || "").toLowerCase();
              const isWing = name.includes("elytra") || name.includes("cape");
              if (!isWing && obj.visible !== undefined) {
                obj.visible = false;
              }
            });
          }

          viewer.playerObject.rotation.y = Math.PI + 0.55;
          viewer.playerObject.rotation.x = 0;
          viewer.playerObject.rotation.z = 0;
          // Slight downward shift to vertically center model in the preview.
          if (viewer.playerObject.position) {
            viewer.playerObject.position.y = mode === "elytra" ? -0.22 : -0.28;
          }
        }

        viewer.render();
        setHasError(false);
      } catch (error) {
        console.error("ProductSkinviewViewer failed to initialize", error);
        setHasError(true);
      }
    };

    setup();

    const onPointerDown = (event: PointerEvent) => {
      if (!viewer?.playerObject) return;
      dragging = true;
      dragStartX = event.clientX;
      dragStartYaw = viewer.playerObject.rotation.y;
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = "grabbing";
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging || !viewer?.playerObject) return;
      const dx = event.clientX - dragStartX;
      viewer.playerObject.rotation.y = dragStartYaw + dx * 0.01;
      viewer.render();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
      canvas.style.cursor = "grab";
    };

    canvas.style.cursor = "grab";
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerUp);

    const onResize = () => {
      if (!viewer) return;
      const width = mount.clientWidth || 900;
      const height = mount.clientHeight || 630;
      viewer.width = width;
      viewer.height = height;
      viewer.render();
    };

    window.addEventListener("resize", onResize);

    return () => {
      disposed = true;
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerUp);
      canvas.style.cursor = "";
      controls?.dispose?.();
      viewer?.dispose?.();
      if (mount.contains(canvas)) mount.removeChild(canvas);
    };
  }, [mode, pausedAnimation, showPlayer, skinPath, texturePath]);

  return (
    <div className="relative h-full w-full">
      <div ref={mountRef} className="h-full w-full" />
      {hasError && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-[var(--color-text-muted)]">
          Unable to load skin viewer. Please check network access for jsdelivr.
        </div>
      )}
    </div>
  );
}
