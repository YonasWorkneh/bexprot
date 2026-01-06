import { useEffect, useRef } from "react";

const SCRIPT_ID = "tubes1-cursor-script";
const TUBES_URL =
  "https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js";

type AnyTubes = any;

declare global {
  interface Window {
    Tubes?: AnyTubes;
  }
}

const TubesBackground = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<AnyTubes>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const container = containerRef.current;
    if (!container) return;

    let mounted = true;

    const loadScript = () =>
      new Promise<void>((resolve, reject) => {
        // If already loaded, resolve immediately
        if (window.Tubes) return resolve();

        const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
        if (existing) {
          existing.addEventListener("load", () => resolve(), { once: true });
          existing.addEventListener("error", () => reject(new Error("Failed to load tubes script")), {
            once: true,
          });
          return;
        }

        const s = document.createElement("script");
        s.id = SCRIPT_ID;
        s.src = TUBES_URL;
        s.async = true;
        // Helps avoid opaque "Script error." on some browsers/CDNs
        s.crossOrigin = "anonymous";
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Failed to load tubes script"));
        document.head.appendChild(s);
      });

    const init = async () => {
      try {
        // Requirement said "dynamically import"; this CDN build is not always ESM.
        // We still dynamically load it at runtime via a script tag (client-only).
        await loadScript();
        if (!mounted) return;

        const TubesCtor: any = window.Tubes;
        if (!TubesCtor) {
          console.error("TubesBackground: window.Tubes not found after script load.");
          return;
        }

        // Clear any previous canvases
        container.innerHTML = "";

        instanceRef.current = new TubesCtor(container, {
          // Main app base colors (deep navy/green-ish)
          colors: [0x0b1220, 0x0f1a2e, 0x12324f, 0x1b3a2e],
          lightIntensity: 200,
          lightColor1: 0x22c55e, // green
          lightColor2: 0x15803d, // dark green
          lightColor3: 0x6b7280, // gray-green
        });
      } catch (err) {
        console.error("TubesBackground: failed to load/init", err);
      }
    };

    void init();

    return () => {
      mounted = false;
      const inst: any = instanceRef.current;
      if (inst && typeof inst.dispose === "function") inst.dispose();
      instanceRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
      }}
    />
  );
};

export default TubesBackground;

