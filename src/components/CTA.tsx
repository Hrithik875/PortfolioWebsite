'use client';

import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { m, MotionValue } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Mail, ArrowUpRight } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PROFILE } from '@/data/portfolio-data';

// --- Magnetic Component ---
const Magnetic = ({ children }: { children: React.ReactNode }) => {
    return <m.div whileHover={{ scale: 1.05 }}>{children}</m.div>;
};

// --- DottedSurface Component ---
type DottedSurfaceProps = {
    className?: string;
};

export function DottedSurface({ className }: DottedSurfaceProps) {
    const { resolvedTheme } = useTheme();
    const containerRef = useRef<HTMLDivElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rendererRef = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sceneRef = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cameraRef = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const geometryRef = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const threeRef = useRef<any>(null);

    // Synchronously update colors on theme change
    useLayoutEffect(() => {
        if (!rendererRef.current || !geometryRef.current || !threeRef.current) return;
        const isDark = (resolvedTheme || "dark") === "dark";
        const bgColor = isDark ? 0xffffff : 0x000000;
        rendererRef.current.setClearColor(bgColor, 1);
        const dotColor = isDark
            ? new threeRef.current.Color(0, 0, 0)
            : new threeRef.current.Color(1, 1, 1);
        const colors = geometryRef.current.attributes.color.array as Float32Array;
        for (let i = 0; i < colors.length; i += 3) {
            colors[i]     = dotColor.r;
            colors[i + 1] = dotColor.g;
            colors[i + 2] = dotColor.b;
        }
        geometryRef.current.attributes.color.needsUpdate = true;
        if (sceneRef.current && cameraRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
    }, [resolvedTheme]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let animationId = 0;
        let cancelled = false;

        const init = async () => {
            if (window.innerWidth < 768) return;
            const THREE = await import("three");
            if (cancelled || !container) return;
            threeRef.current = THREE;

            const SEPARATION = 140;
            const AMOUNTX = 50;
            const AMOUNTY = 50;

            const scene = new THREE.Scene();
            sceneRef.current = scene;
            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
            camera.position.set(0, 300, 1000);
            cameraRef.current = camera;

            const renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
            renderer.setSize(container.offsetWidth, container.offsetHeight);
            rendererRef.current = renderer;

            const isDark = (resolvedTheme || "dark") === "dark";
            const bgColor = isDark ? 0xffffff : 0x000000;
            renderer.setClearColor(bgColor, 1);
            container.appendChild(renderer.domElement);

            const numParticles = AMOUNTX * AMOUNTY;
            const positions = new Float32Array(numParticles * 3);
            const colors = new Float32Array(numParticles * 3);

            const dotColor = isDark
                ? new THREE.Color(0, 0, 0)
                : new THREE.Color(1, 1, 1);

            let i = 0;
            for (let ix = 0; ix < AMOUNTX; ix++) {
                for (let iy = 0; iy < AMOUNTY; iy++) {
                    positions[i * 3]     = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
                    positions[i * 3 + 1] = 0;
                    positions[i * 3 + 2] = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;
                    colors[i * 3]     = dotColor.r;
                    colors[i * 3 + 1] = dotColor.g;
                    colors[i * 3 + 2] = dotColor.b;
                    i++;
                }
            }

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
            geometryRef.current = geometry;

            const material = new THREE.PointsMaterial({
                size: 8,
                vertexColors: true,
                transparent: true,
                opacity: 0.8,
            });

            const particles = new THREE.Points(geometry, material);
            scene.add(particles);

            let count = 0;

            const animate = () => {
                if (cancelled) return;
                animationId = requestAnimationFrame(animate);
                const positionAttribute = geometry.attributes.position;
                const posArray = positionAttribute.array as Float32Array;

                let j = 0;
                for (let ix = 0; ix < AMOUNTX; ix++) {
                    for (let iy = 0; iy < AMOUNTY; iy++) {
                        posArray[j * 3 + 1] =
                            Math.sin((ix + count) * 0.3) * 60 +
                            Math.sin((iy + count) * 0.5) * 60;
                        j++;
                    }
                }
                positionAttribute.needsUpdate = true;
                renderer.render(scene, camera);
                count += 0.04;
            };

            const handleResize = () => {
                if (!container) return;
                const w = container.offsetWidth;
                const h = container.offsetHeight;
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
                renderer.setSize(w, h);
            };

            window.addEventListener('resize', handleResize);
            animate();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (renderer as any).__handleResize = handleResize;
        };

        init();

        return () => {
            cancelled = true;
            if (animationId) cancelAnimationFrame(animationId);
            if (rendererRef.current?.__handleResize) {
                window.removeEventListener('resize', rendererRef.current.__handleResize);
            }
            geometryRef.current?.dispose();
            geometryRef.current = null;
            if (rendererRef.current) {
                rendererRef.current.dispose();
                if (container.contains(rendererRef.current.domElement)) {
                    container.removeChild(rendererRef.current.domElement);
                }
                rendererRef.current = null;
            }
            sceneRef.current = null;
            cameraRef.current = null;
            threeRef.current = null;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div
            ref={containerRef}
            className={cn('absolute inset-0 pointer-events-none', className)}
        />
    );
}

// --- Main Portfolio CTA Component ---
interface ReadyToArchitectProps {
    ctaOpacity?: MotionValue<number> | number;
}

export function ReadyToArchitect({ ctaOpacity }: ReadyToArchitectProps) {
    return (
        <div className="w-full px-4 md:px-6 py-12 md:py-24">
            <m.section
                style={{ opacity: ctaOpacity }}
                className={cn(
                    "relative max-w-6xl mx-auto min-h-[550px] md:min-h-[500px] flex flex-col justify-center items-center text-center",
                    "rounded-[2.5rem] md:rounded-[5rem] overflow-hidden isolate shadow-2xl border",
                    "bg-white text-black border-black/5 [html[data-theme='light']_&]:bg-black [html[data-theme='light']_&]:text-white [html[data-theme='light']_&]:border-white/10"
                )}
            >
                <DottedSurface className="z-[-1]" />

                <div className="max-w-4xl mx-auto w-full px-6 md:px-8 py-16 md:py-20 flex flex-col items-center relative z-10">
                    <div className="mb-4 inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/10 [html[data-theme='light']_&]:bg-white/10">
                        <span>Open to AI/ML Opportunities</span>
                    </div>

                    <h2 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter mb-6 md:mb-8 leading-[1.1] flex flex-col">
                        <span className="block overflow-hidden py-1">
                            <m.span
                                className="block"
                                initial={{ y: "100%" }}
                                whileInView={{ y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                            >
                                Let&apos;s Build Systems
                            </m.span>
                        </span>

                        <span className="block overflow-hidden py-1">
                            <m.span
                                className="block opacity-40 text-[0.88em]"
                                initial={{ y: "100%" }}
                                whileInView={{ y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1.2, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                            >
                                You Can Inspect.
                            </m.span>
                        </span>
                    </h2>

                    <p className="text-base md:text-lg opacity-70 mb-10 max-w-xl mx-auto tracking-tight font-medium leading-relaxed">
                        If you are hiring for AI/ML engineering, or working on retrieval, evaluation or streaming systems, I would like to hear from you.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Magnetic>
                            <a
                                href={`mailto:${PROFILE.email}`}
                                className={cn(
                                    "px-8 py-4 text-sm md:text-base font-bold rounded-full flex items-center gap-2.5 shadow-xl active:scale-95",
                                    "bg-black text-white hover:bg-zinc-800 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-black [html[data-theme='light']_&]:hover:bg-zinc-200"
                                )}
                            >
                                <Mail size={18} />
                                <span>Get in Touch</span>
                            </a>
                        </Magnetic>

                        <Magnetic>
                            <Link
                                href="/resume"
                                className={cn(
                                    "px-8 py-4 text-sm md:text-base font-bold rounded-full border flex items-center gap-2 active:scale-95",
                                    "border-black/20 text-black hover:bg-black/5 [html[data-theme='light']_&]:border-white/20 [html[data-theme='light']_&]:text-white [html[data-theme='light']_&]:hover:bg-white/10"
                                )}
                            >
                                <span>View Resume</span>
                                <ArrowUpRight size={18} />
                            </Link>
                        </Magnetic>
                    </div>
                </div>
            </m.section>
        </div>
    );
}
