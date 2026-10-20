"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useTheme } from "./ThemeProvider";

/**
 * Codrops Decorative WebGL Backgrounds - Demo 2 "Spacetime Warp Drive"
 * Re-engineered for modern Three.js with hardware-accelerated GPU vertex shaders.
 */
const vertexShader = /* glsl */ `
  #define PI 3.1415926535897932384626433832795

  attribute vec3 origPosition;
  attribute float delay;
  uniform float u_time;
  uniform float u_pointSize;

  // Exact Back.easeOut easing formula: p = t - 1.0; f(t) = p*p*((s+1.0)*p + s) + 1.0
  float easeBackOut(float t) {
    float s = 1.70158;
    float p = t - 1.0;
    return p * p * ((s + 1.0) * p + s) + 1.0;
  }

  void main() {
    float duration = 4.0;
    float cycle = 8.0;

    // Time offset by pole-to-equator delay (abs(y / radius) * 2.0)
    float factor = 1.0;
    if (u_time > delay) {
      float localTime = mod(u_time - delay, cycle);
      if (localTime < duration) {
        // Forward phase: points collapse toward central axis (x=0, z=0)
        float p = clamp(localTime / duration, 0.0, 1.0);
        factor = 1.0 - easeBackOut(p);
      } else {
        // Yoyo reverse phase: points bounce back out to sphere surface with overshoot
        float p = clamp((localTime - duration) / duration, 0.0, 1.0);
        factor = easeBackOut(p);
      }
    }

    vec3 animatedPos = vec3(origPosition.x * factor, origPosition.y, origPosition.z * factor);
    vec4 mvPosition = modelViewMatrix * vec4(animatedPos, 1.0);
    gl_PointSize = u_pointSize;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D u_texture;
  uniform vec4 u_dotColor;

  void main() {
    vec4 textureColor = texture2D(u_texture, gl_PointCoord);
    if (textureColor.a < 0.1) discard;
    gl_FragColor = vec4(u_dotColor.rgb, u_dotColor.a * textureColor.a);
  }
`;

/**
 * Procedural circular dot texture generator used as instant fallback
 * while dotTexture.png is loading.
 */
function createFallbackDotTexture(): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1.0)");
    gradient.addColorStop(0.55, "rgba(255, 255, 255, 0.85)");
    gradient.addColorStop(0.8, "rgba(255, 255, 255, 0.3)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0.0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

export function GlobalBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shaderMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const isDark = (resolvedTheme || theme) === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Smoothly update dot color when theme changes without re-creating WebGL context
  useEffect(() => {
    if (!shaderMaterialRef.current) return;
    const dotColor = isDark
      ? new THREE.Vector4(1.0, 1.0, 1.0, 0.8)
      : new THREE.Vector4(0.06, 0.18, 0.36, 0.6);
    shaderMaterialRef.current.uniforms.u_dotColor.value = dotColor;
  }, [isDark]);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let animId: number;
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let dots: THREE.Points | null = null;
    let bufferGeom: THREE.BufferGeometry | null = null;
    let fallbackTex: THREE.Texture | null = null;
    let loadedTex: THREE.Texture | null = null;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0);

      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
      const isMobile = width < 768;
      camera.position.set(0, 0, isMobile ? 110 : 80);

      // Texture initialization
      fallbackTex = createFallbackDotTexture();
      const textureLoader = new THREE.TextureLoader();
      textureLoader.crossOrigin = "anonymous";
      loadedTex = textureLoader.load(
        "/img/dotTexture.png",
        (tex) => {
          if (shaderMaterialRef.current) {
            shaderMaterialRef.current.uniforms.u_texture.value = tex;
            shaderMaterialRef.current.needsUpdate = true;
          }
        },
        undefined,
        () => {
          // Keep fallback texture if file loading fails
        }
      );

      // Sphere geometry (Increased density: detail 13 on desktop ~1962 particles, detail 8 on mobile ~812 particles)
      const radius = 50;
      const detail = isMobile ? 8 : 13;
      const sphereGeom = new THREE.IcosahedronGeometry(radius, detail);
      const posAttr = sphereGeom.attributes.position;

      // Deduplicate vertices
      const uniquePositions: number[] = [];
      const delays: number[] = [];
      const seen = new Set<string>();

      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);
        const z = posAttr.getZ(i);
        const key = `${Math.round(x * 100)},${Math.round(y * 100)},${Math.round(z * 100)}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniquePositions.push(x, y, z);
          // Codrops formula: Math.abs(vector.y / radius) * 2.0
          delays.push(Math.abs(y / radius) * 2.0);
        }
      }
      sphereGeom.dispose();

      bufferGeom = new THREE.BufferGeometry();
      bufferGeom.setAttribute(
        "origPosition",
        new THREE.Float32BufferAttribute(uniquePositions, 3)
      );
      bufferGeom.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(uniquePositions, 3)
      );
      bufferGeom.setAttribute("delay", new THREE.Float32BufferAttribute(delays, 1));

      const dotColorVec = isDark
        ? new THREE.Vector4(1.0, 1.0, 1.0, 0.8)
        : new THREE.Vector4(0.06, 0.18, 0.36, 0.6);

      // Decreased dot size for refined, crisp starry particles
      const pointSize = Math.max(1.75 * pixelRatio, 2.0);

      const shaderMaterial = new THREE.ShaderMaterial({
        uniforms: {
          u_texture: { value: fallbackTex },
          u_dotColor: { value: dotColorVec },
          u_time: { value: 2.0 },
          u_pointSize: { value: pointSize },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
      });
      shaderMaterialRef.current = shaderMaterial;

      dots = new THREE.Points(bufferGeom, shaderMaterial);
      scene.add(dots);

      // Mouse tracking from Codrops Demo 2
      const mouse = { x: 0.8, y: 0.5 };
      const handleMouseMove = (e: MouseEvent) => {
        mouse.x = e.clientX / window.innerWidth - 0.5;
        mouse.y = e.clientY / window.innerHeight - 0.5;
      };
      window.addEventListener("mousemove", handleMouseMove, { passive: true });

      // Resize observer & handler
      let resizeTimer: ReturnType<typeof setTimeout> | null = null;
      const handleResize = () => {
        if (!container || !renderer || !camera || !shaderMaterialRef.current) return;
        width = container.clientWidth || window.innerWidth;
        height = container.clientHeight || window.innerHeight;
        camera.aspect = width / height;
        if (width < 768) {
          camera.position.z = 110;
        } else {
          camera.position.z = 80;
        }
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        const pRatio = Math.min(window.devicePixelRatio || 1, 2);
        renderer.setPixelRatio(pRatio);
        shaderMaterialRef.current.uniforms.u_pointSize.value = Math.max(1.75 * pRatio, 2.0);
      };

      const onResizeThrottled = () => {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(handleResize, 100);
      };
      window.addEventListener("resize", onResizeThrottled);

      // Scroll parallax
      let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0;
      let scrollTarget = 0;

      const handleScroll = () => {
        const currentY = window.scrollY || 0;
        scrollTarget = (currentY - lastScrollY) * 0.001;
        lastScrollY = currentY;
      };
      window.addEventListener("scroll", handleScroll, { passive: true });

      // Pause when tab is inactive to preserve CPU / battery
      let isPageVisible = true;
      const handleVisibilityChange = () => {
        isPageVisible = !document.hidden;
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);

      // Offset by 2 seconds so the warp drive is already active upon load
      const startTime = performance.now() - 2000;

      const render = (now: number) => {
        animId = requestAnimationFrame(render);
        if (!isPageVisible || !renderer || !scene || !camera || !dots || !shaderMaterialRef.current) {
          return;
        }

        const elapsed = (now - startTime) / 1000.0;
        shaderMaterialRef.current.uniforms.u_time.value = elapsed;

        // Smooth rotation damping matching Codrops TweenMax Power1.easeOut
        const targetRotX = mouse.y * Math.PI * 0.5;
        const targetRotZ = mouse.x * Math.PI * 0.2;

        dots.rotation.x += (targetRotX - dots.rotation.x) * 0.04;
        dots.rotation.z += (targetRotZ - dots.rotation.z) * 0.04;
        // Subtle organic cosmic revolution
        dots.rotation.y += 0.0015;

        // Subtle scroll parallax
        if (Math.abs(scrollTarget) > 0.0001) {
          dots.rotation.x += scrollTarget;
          scrollTarget *= 0.9;
        }

        renderer.render(scene, camera);
      };

      animId = requestAnimationFrame(render);

      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("resize", onResizeThrottled);
        window.removeEventListener("scroll", handleScroll);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        if (resizeTimer) clearTimeout(resizeTimer);

        if (dots && scene) {
          scene.remove(dots);
        }
        bufferGeom?.dispose();
        shaderMaterialRef.current?.dispose();
        shaderMaterialRef.current = null;
        fallbackTex?.dispose();
        loadedTex?.dispose();
        renderer?.dispose();
      };
    } catch (err) {
      console.error("WebGL Spacetime background initialization failed:", err);
    }
  }, [mounted]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[-1] w-full h-full overflow-hidden transition-colors duration-500"
      style={{
        backgroundColor: mounted
          ? isDark
            ? "#000000"
            : "#ffffff"
          : undefined,
      }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
