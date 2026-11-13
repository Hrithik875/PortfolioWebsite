'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent
} from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons';

export interface FlowingMenuItem {
  text: string;
  link?: string;
  /** Single image (kept for backwards compatibility). Ignored when `images` is provided. */
  image?: string;
  /** Multiple images for the same category. They all appear in the marquee. */
  images?: string[];
  marquee?: string;
  meta?: string;
}

export interface FlowingMenuProps {
  items?: FlowingMenuItem[];
  speed?: number;
  direction?: 'left' | 'right' | 'alternate';
  followCursor?: number;
  duration?: number;
  stretch?: number;
  magnet?: number;
  bandInset?: number;
  bandRadius?: number;
  carryContent?: boolean;
  textColor?: string;
  bgColor?: string;
  marqueeBgColor?: string;
  marqueeTextColor?: string;
  borderColor?: string;
  dividers?: boolean;
  dimInactive?: boolean;
  align?: 'center' | 'left';
  showIndex?: boolean;
  showArrow?: boolean;
  imageShape?: 'pill' | 'rounded' | 'circle';
  /**
   * How multiple images are laid out inside one marquee loop:
   * - 'group'      : text, then all images side by side   ->  TEXT [img][img][img] TEXT [img][img][img]
   * - 'interleave' : text before every image               ->  TEXT [img] TEXT [img] TEXT [img]
   */
  imageLayout?: 'group' | 'interleave';
  intro?: boolean;
  activeIndex?: number;
  onItemClick?: (item: FlowingMenuItem, index: number, event: ReactMouseEvent<HTMLElement>) => void;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
}

interface Row {
  item?: HTMLLIElement | null;
  band?: HTMLDivElement | null;
  track?: HTMLDivElement | null;
}

interface Marquee {
  x: number;
  part: number;
  spin: number;
  covered: boolean;
}

interface Metric {
  top: number;
  height: number;
}

const DIRECTIONS = ['left', 'right', 'alternate'];
const SHAPES = ['pill', 'rounded', 'circle'];
const LAYOUTS = ['group', 'interleave'];
const EASE = 'cubic-bezier(0.2, 0.9, 0.2, 1)';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const prefersReduced = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

/** Normalises `images` / `image` into a single list. */
const imagesOf = (item: FlowingMenuItem): string[] =>
  item.images && item.images.length > 0 ? item.images : item.image ? [item.image] : [];

function FlowingMenu({
  items = [],
  speed = 60,
  direction = 'left',
  followCursor = 0.4,
  duration = 0.5,
  stretch = 0.6,
  magnet = 0.25,
  bandInset = 0,
  bandRadius = 0,
  carryContent = false,
  textColor = '#ffffff',
  bgColor = '#120F17',
  marqueeBgColor = '#ffffff',
  marqueeTextColor = '#120F17',
  borderColor = 'rgba(255, 255, 255, 0.14)',
  dividers = true,
  dimInactive = false,
  align = 'center',
  showIndex = false,
  showArrow = false,
  imageShape = 'pill',
  imageLayout = 'group',
  intro = true,
  activeIndex,
  onItemClick,
  ariaLabel = 'Menu',
  className = '',
  style
}: FlowingMenuProps) {
  const rootRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const rows = useRef<Row[]>([]);
  const marquees = useRef<Marquee[]>([]);
  const metrics = useRef<(Metric | null)[]>([]);
  const band = useRef({
    top: 0,
    bottom: 0,
    vTop: 0,
    vBottom: 0,
    toTop: 0,
    toBottom: 0,
    lead: 1,
    shown: false,
    index: -1,
    rest: 0
  });
  const cursor = useRef<{ x: number; y: number | null; t: number; vx: number }>({ x: 0, y: null, t: 0, vx: 0 });
  const engine = useRef<{ raf: number; last: number; timers: ReturnType<typeof setTimeout>[]; touched: boolean }>({
    raf: 0,
    last: 0,
    timers: [],
    touched: false
  });
  const [copies, setCopies] = useState<number[]>([]);
  const floatRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const layerTracks = useRef<(HTMLDivElement | null)[]>([]);
  const roll = useRef({ current: 0, p: 1, dir: 1, slots: [-1, -1], fromOpacity: 0, fromOffset: 0 });
  const [slots, setSlots] = useState([-1, -1]);

  const settings = {
    speed: Math.max(0, speed),
    direction: DIRECTIONS.includes(direction) ? direction : 'left',
    followCursor: clamp(followCursor, 0, 1),
    duration: Math.max(0.1, duration),
    stretch: clamp(stretch, 0, 1),
    magnet: clamp(magnet, 0, 1),
    bandInset: Math.max(0, bandInset),
    bandRadius: Math.max(0, bandRadius),
    carryContent,
    dimInactive,
    onItemClick
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const marqueeAt = (index: number) => {
    if (!marquees.current[index]) marquees.current[index] = { x: 0, part: 0, spin: 0, covered: false };
    return marquees.current[index];
  };

  const insetFor = (height: number) => Math.min(settingsRef.current.bandInset, Math.max(0, height / 2 - 2));

  const markRows = () => {
    const b = band.current;
    const dim = settingsRef.current.dimInactive && b.index >= 0;
    rows.current.forEach((row, index) => {
      if (!row?.item) return;
      if (index === b.index) row.item.setAttribute('data-current', '');
      else row.item.removeAttribute('data-current');
      if (dim && index !== b.index) row.item.setAttribute('data-dimmed', '');
      else row.item.removeAttribute('data-dimmed');
      // Apply dim via inline style to avoid Tailwind v4 group-data issues
      if (row.item.querySelector<HTMLElement>('[data-link]')) {
        const link = row.item.querySelector<HTMLElement>('[data-link]');
        if (link) {
          link.style.opacity = (dim && index !== b.index) ? '0.32' : '';
        }
      }
    });
  };

  const rowHeight = () => metrics.current.find(Boolean)?.height ?? 0;

  const paintFloat = () => {
    const b = band.current;
    const s = settingsRef.current;
    const r = roll.current;
    const el = floatRef.current;
    const list = listRef.current;
    if (!el || !list) return;
    if (!b.shown || b.bottom - b.top < 0.25) {
      el.style.visibility = 'hidden';
      return;
    }
    const height = rowHeight();
    const side = Math.min(s.bandInset, Math.max(0, height / 2 - 2));
    const radius = Math.min(s.bandRadius, (b.bottom - b.top) / 2, Math.max(0, list.clientWidth / 2 - side));
    el.style.visibility = 'visible';
    el.style.clipPath = `inset(${b.top.toFixed(2)}px ${side}px ${(list.clientHeight - b.bottom).toFixed(2)}px ${side}px round ${radius.toFixed(2)}px)`;
    const center = (b.top + b.bottom) / 2;
    const eased = 1 - Math.pow(1 - r.p, 3);
    const travel = height * 0.8 * r.dir;
    [0, 1].forEach(slot => {
      const layer = layerRefs.current[slot];
      const index = r.slots[slot];
      if (!layer) return;
      const current = slot === r.current;
      const visible = index >= 0 && (current || r.p < 1);
      layer.style.visibility = visible ? 'visible' : 'hidden';
      if (!visible) return;
      const offset = current ? (1 - eased) * travel : r.fromOffset - eased * travel;
      const opacity = current ? eased : r.fromOpacity * (1 - eased);
      layer.style.height = `${height}px`;
      layer.style.opacity = opacity.toFixed(3);
      layer.style.transform = `translate3d(0, ${(center - height / 2 + offset).toFixed(2)}px, 0)`;
      const state = marqueeAt(index);
      state.covered = true;
      const track = layerTracks.current[slot];
      if (track) track.style.transform = `translate3d(${state.x.toFixed(2)}px, 0, 0)`;
    });
  };

  const paint = () => {
    const b = band.current;
    const s = settingsRef.current;
    const height = Math.max(0, b.bottom - b.top);
    rows.current.forEach((row, index) => {
      const m = metrics.current[index];
      if (!row?.band || !m) return;
      const state = marqueeAt(index);
      state.covered = false;
      const from = Math.max(b.top, m.top);
      const to = Math.min(b.bottom, m.top + m.height);
      if (s.carryContent || !b.shown || to - from < 0.25) {
        row.band.style.visibility = 'hidden';
      } else {
        const side = Math.min(s.bandInset, Math.max(0, m.height / 2 - 2));
        const radius = Math.min(s.bandRadius, height / 2, Math.max(0, (row.item?.clientWidth ?? 0) / 2 - side));
        row.band.style.visibility = 'visible';
        row.band.style.clipPath = `inset(${(b.top - m.top).toFixed(2)}px ${side}px ${(m.top + m.height - b.bottom).toFixed(2)}px ${side}px round ${radius.toFixed(2)}px)`;
        state.covered = (to - from) / m.height > 0.04;
      }
      if (row.track) row.track.style.transform = `translate3d(${state.x.toFixed(2)}px, 0, 0)`;
    });
    if (s.carryContent) paintFloat();
    else if (floatRef.current) floatRef.current.style.visibility = 'hidden';
  };

  const frame = (now: number) => {
    const loop = engine.current;
    loop.raf = 0;
    const s = settingsRef.current;
    const b = band.current;
    const c = cursor.current;
    const reduced = prefersReduced();
    const elapsed = clamp((now - loop.last) / 1000, 0, 1 / 20);
    loop.last = now;
    let busy = false;

    if (b.shown) {
      const current = b.index >= 0 ? metrics.current[b.index] : null;
      if (current) {
        const inset = insetFor(current.height);
        const lean =
          c.y === null || reduced
            ? 0
            : clamp((c.y - (current.top + current.height / 2)) * s.magnet, -current.height * 0.3, current.height * 0.3);
        b.toTop = current.top + inset + lean;
        b.toBottom = current.top + current.height - inset + lean;
      } else if (b.index < 0) {
        b.toTop = b.toBottom = b.rest;
      }
      const gap = (b.toTop + b.toBottom) / 2 - (b.top + b.bottom) / 2;
      if (Math.abs(gap) > 2) b.lead = gap > 0 ? 1 : -1;
      if (reduced) {
        b.top = b.toTop;
        b.bottom = b.toBottom;
        b.vTop = b.vBottom = 0;
      } else {
        const omega = (Math.PI * 2) / s.duration;
        const fast = omega * (1 + 1.1 * s.stretch);
        const slow = omega * (1 - 0.4 * s.stretch);
        const zeta = 1 - 0.3 * s.stretch;
        const wTop = b.lead > 0 ? slow : fast;
        const wBottom = b.lead > 0 ? fast : slow;
        const steps = Math.max(1, Math.ceil(elapsed / (1 / 240)));
        const dt = elapsed / steps;
        for (let i = 0; i < steps; i++) {
          b.vTop += (-wTop * wTop * (b.top - b.toTop) - 2 * zeta * wTop * b.vTop) * dt;
          b.vBottom += (-wBottom * wBottom * (b.bottom - b.toBottom) - 2 * zeta * wBottom * b.vBottom) * dt;
          b.top += b.vTop * dt;
          b.bottom += b.vBottom * dt;
          if (b.bottom < b.top) {
            const mid = (b.top + b.bottom) / 2;
            const v = (b.vTop + b.vBottom) / 2;
            b.top = b.bottom = mid;
            b.vTop = b.vBottom = v;
          }
        }
      }
      const resting =
        Math.abs(b.top - b.toTop) < 0.1 &&
        Math.abs(b.bottom - b.toBottom) < 0.1 &&
        Math.abs(b.vTop) < 2 &&
        Math.abs(b.vBottom) < 2;
      if (resting) {
        b.top = b.toTop;
        b.bottom = b.toBottom;
        b.vTop = b.vBottom = 0;
        if (b.index < 0 && b.bottom - b.top < 0.5) b.shown = false;
      } else busy = true;
    }

    const r = roll.current;
    if (r.p < 1) {
      r.p = reduced ? 1 : Math.min(1, r.p + elapsed / (s.duration * 0.8));
      busy = true;
    }

    c.vx *= Math.exp(-elapsed / 0.3);
    const push = clamp(c.vx * s.followCursor * 0.55, -1600, 1600);

    marquees.current.forEach((state, index) => {
      if (!state) return;
      const goal = state.covered ? 1 : 0;
      state.spin += (goal - state.spin) * (1 - Math.exp(-elapsed / 0.35));
      if (Math.abs(goal - state.spin) < 0.002) state.spin = goal;
      if (!state.covered && state.spin === 0) return;
      busy = true;
      if (state.part <= 0 || reduced) return;
      const flow = s.direction === 'alternate' ? (index % 2 ? 1 : -1) : s.direction === 'right' ? 1 : -1;
      state.x += (flow * s.speed + push) * state.spin * elapsed;
      state.x = (((state.x % state.part) + state.part) % state.part) - state.part;
    });

    paint();
    if (busy) loop.raf = requestAnimationFrame(frame);
  };

  const kick = () => {
    const loop = engine.current;
    if (loop.raf || typeof window === 'undefined') return;
    loop.last = performance.now();
    loop.raf = requestAnimationFrame(frame);
  };

  const goTo = (index: number, from: 'top' | 'bottom' | 'center') => {
    const m = metrics.current[index];
    if (!m) return;
    const b = band.current;
    const inset = insetFor(m.height);
    const top = m.top + inset;
    const bottom = m.top + m.height - inset;
    const r = roll.current;
    const showing = r.slots[r.current];
    if (settingsRef.current.carryContent && showing !== index) {
      if (!b.shown || showing < 0) {
        r.slots[r.current] = index;
        r.p = 1;
      } else {
        const eased = 1 - Math.pow(1 - r.p, 3);
        r.fromOpacity = eased;
        r.fromOffset = (1 - eased) * m.height * 0.8 * r.dir;
        r.dir = index > showing ? 1 : -1;
        r.current = 1 - r.current;
        r.slots[r.current] = index;
        r.p = 0;
      }
      setSlots([...r.slots]);
    }
    if (!b.shown) {
      const start = from === 'bottom' ? bottom : from === 'center' ? (top + bottom) / 2 : top;
      b.top = b.bottom = start;
      b.vTop = b.vBottom = 0;
      b.shown = true;
    }
    const shift = (top + bottom) / 2 - (b.top + b.bottom) / 2;
    if (Math.abs(shift) > 0.5) b.lead = shift > 0 ? 1 : -1;
    else b.lead = from === 'bottom' ? -1 : 1;
    b.toTop = top;
    b.toBottom = bottom;
    b.index = index;
    markRows();
    kick();
  };

  const release = (toward: 'top' | 'bottom' | 'center') => {
    const b = band.current;
    if (!b.shown) return;
    const point = toward === 'top' ? b.toTop : toward === 'bottom' ? b.toBottom : (b.toTop + b.toBottom) / 2;
    b.lead = toward === 'top' ? -1 : 1;
    b.rest = point;
    b.toTop = b.toBottom = point;
    b.index = -1;
    cursor.current.y = null;
    markRows();
    kick();
  };

  const rowAt = (clientY: number) => {
    const list = listRef.current;
    if (!list) return -1;
    const y = clientY - list.getBoundingClientRect().top;
    return metrics.current.findIndex(m => m && y >= m.top && y < m.top + m.height);
  };

  const halfOf = (clientY: number, index: number): 'top' | 'bottom' => {
    const list = listRef.current;
    const m = metrics.current[index];
    if (!list || !m) return 'top';
    return clientY - list.getBoundingClientRect().top - m.top < m.height / 2 ? 'top' : 'bottom';
  };

  const stopIntro = () => {
    const loop = engine.current;
    loop.touched = true;
    loop.timers.forEach(clearTimeout);
    loop.timers = [];
  };

  const measure = () => {
    const list = listRef.current;
    metrics.current = rows.current.map(row =>
      row?.item ? { top: row.item.offsetTop, height: row.item.offsetHeight } : null
    );
    if (list && metrics.current[0]) {
      const height = metrics.current[0].height;
      const inset = insetFor(height);
      rootRef.current?.style.setProperty('--flowing-menu-band', String(height ? (height - inset * 2) / height : 1));
    }
    const next = rows.current.map((row, index) => {
      const state = marqueeAt(index);
      const part = row?.track?.firstElementChild;
      const width = part?.getBoundingClientRect().width ?? 0;
      const total = row?.item?.getBoundingClientRect().width ?? 0;
      if (width > 0) {
        state.part = width;
        state.x = (((state.x % width) + width) % width) - width;
      }
      return width > 0 ? Math.max(2, Math.ceil(total / width) + 1) : 3;
    });
    setCopies(current =>
      current.length === next.length && current.every((value, index) => value === next[index]) ? current : next
    );
    const b = band.current;
    if (b.shown && b.index >= 0) {
      const m = metrics.current[b.index];
      if (m) {
        const inset = insetFor(m.height);
        b.toTop = m.top + inset;
        b.toBottom = m.top + m.height - inset;
      }
    }
    paint();
    kick();
  };
  const measureRef = useRef(measure);
  measureRef.current = measure;

  useIsoLayoutEffect(() => {
    measureRef.current();
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => measureRef.current());
    observer.observe(root);
    rows.current.forEach(row => {
      const part = row?.track?.firstElementChild;
      if (part) observer.observe(part);
    });
    return () => observer.disconnect();
  }, [items, bandInset, imageLayout]);

  useIsoLayoutEffect(() => {
    rows.current.length = items.length;
    marquees.current.length = items.length;
    paint();
  });

  const goToRef = useRef(goTo);
  goToRef.current = goTo;
  const releaseRef = useRef(release);
  releaseRef.current = release;
  const introPlayedRef = useRef(false);

  useIsoLayoutEffect(() => {
    if (!intro || prefersReduced()) return undefined;
    const root = rootRef.current;
    if (!root) return undefined;

    // Initially prepare elements hidden under mask so they don't pop before entering viewport
    const lines = root.querySelectorAll<HTMLElement>('[data-intro-line]');
    const fades = root.querySelectorAll<HTMLElement>('[data-intro-fade]');
    const rules = root.querySelectorAll<HTMLElement>('[data-intro-rule]');

    lines.forEach(node => {
      node.style.transform = 'translateY(110%)';
    });
    fades.forEach(node => {
      node.style.opacity = '0';
    });
    rules.forEach(node => {
      node.style.transform = 'scaleX(0)';
      node.style.transformOrigin = 'left';
    });

    const playIntro = () => {
      if (introPlayedRef.current) return;
      introPlayedRef.current = true;

      measureRef.current();

      lines.forEach((node, index) => {
        const anim = node.animate(
          [{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }],
          {
            duration: 850,
            delay: index * 75,
            easing: EASE,
            fill: 'forwards'
          }
        );
        anim.onfinish = () => {
          node.style.transform = 'none';
        };
      });

      fades.forEach((node, index) => {
        const anim = node.animate(
          [{ opacity: 0 }, { opacity: 1 }],
          {
            duration: 700,
            delay: 200 + index * 40,
            easing: 'ease',
            fill: 'forwards'
          }
        );
        anim.onfinish = () => {
          node.style.opacity = '1';
        };
      });

      rules.forEach((node, index) => {
        const anim = node.animate(
          [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
          {
            duration: 900,
            delay: index * 60,
            easing: EASE,
            fill: 'forwards'
          }
        );
        anim.onfinish = () => {
          node.style.transform = 'none';
        };
      });

      const loop = engine.current;
      const count = rows.current.filter(Boolean).length;
      const start = 700 + count * 50;
      const step = 260;

      for (let index = 0; index < count; index++) {
        loop.timers.push(
          setTimeout(
            () => {
              if (!loop.touched) goToRef.current(index, 'top');
            },
            start + index * step
          )
        );
      }

      loop.timers.push(
        setTimeout(
          () => {
            if (!loop.touched) releaseRef.current('bottom');
          },
          start + count * step + 120
        )
      );
    };

    if (typeof IntersectionObserver === 'undefined') {
      playIntro();
      return undefined;
    }

    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        if (entry && entry.isIntersecting) {
          observer.disconnect();
          playIntro();
        }
      },
      {
        threshold: 0.15
      }
    );

    observer.observe(root);

    return () => {
      observer.disconnect();
      const loop = engine.current;
      loop.timers.forEach(clearTimeout);
      loop.timers = [];
    };
  }, []);

  useEffect(() => {
    const loop = engine.current;
    return () => cancelAnimationFrame(loop.raf);
  }, []);

  const onPointerMove = (event: ReactPointerEvent<HTMLUListElement>) => {
    if (event.pointerType === 'touch') return;
    stopIntro();
    const c = cursor.current;
    const now = performance.now();
    const gap = (now - c.t) / 1000;
    if (gap > 0 && gap < 0.1) {
      const instant = (event.clientX - c.x) / gap;
      c.vx += (instant - c.vx) * (1 - Math.exp(-gap / 0.08));
    }
    c.x = event.clientX;
    c.t = now;
    const list = listRef.current;
    if (list) c.y = event.clientY - list.getBoundingClientRect().top;
    const index = rowAt(event.clientY);
    if (index >= 0 && index !== band.current.index) goTo(index, halfOf(event.clientY, index));
    else kick();
  };

  const onPointerLeave = (event: ReactPointerEvent<HTMLUListElement>) => {
    if (event.pointerType === 'touch') return;
    const list = listRef.current;
    const b = band.current;
    if (!list || b.index < 0) return;
    const rect = list.getBoundingClientRect();
    if (event.clientY <= rect.top) release('top');
    else if (event.clientY >= rect.bottom) release('bottom');
    else release(halfOf(event.clientY, b.index));
  };

  const linkHandlers = (item: FlowingMenuItem, index: number) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType !== 'touch') return;
      stopIntro();
      goTo(index, halfOf(event.clientY, index));
    },
    onFocus: (event: ReactFocusEvent<HTMLElement>) => {
      if (!event.currentTarget.matches(':focus-visible')) return;
      stopIntro();
      goTo(index, 'top');
    },
    onBlur: (event: ReactFocusEvent<HTMLElement>) => {
      const next = event.relatedTarget as Node | null;
      if (next && listRef.current?.contains(next)) return;
      release('bottom');
    },
    onClick: (event: ReactMouseEvent<HTMLElement>) => settingsRef.current.onItemClick?.(item, index, event)
  });

  const shape = SHAPES.includes(imageShape) ? imageShape : 'pill';
  const layout = LAYOUTS.includes(imageLayout) ? imageLayout : 'group';

  // Compute image aspect ratio based on shape
  const imgStyle = (src: string): CSSProperties => {
    const bandVal = 'var(--flowing-menu-band, 1)';
    const base: CSSProperties = {
      display: 'block',
      flexShrink: 0,
      backgroundImage: `url("${src}")`,
      backgroundSize: 'contain',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      margin: `0 clamp(16px, 14cqh, 36px)`,
      height: `calc(56cqh * ${bandVal})`,
      aspectRatio: '1 / 1',
    };
    if (shape === 'circle') {
      return { ...base, borderRadius: '50%' };
    } else if (shape === 'rounded') {
      return { ...base, borderRadius: `calc(10cqh * ${bandVal})` };
    }
    // Default / natural logo shape: no clipping boundary so triangles, silhouettes and icons retain their authentic geometry
    return base;
  };

  const isMonoLogo = (src: string) =>
    /(?:^|[/\-_])(nextjs|vercel|github|flask|apachekafka|openai|groq|ollama|framer)(?:\.|\-)/i.test(src);

  /** One loop of the marquee for an item: text + its image(s). */
  const renderPart = (item: FlowingMenuItem, key: number) => {
    const label = item.marquee ?? item.text;
    const imgs = imagesOf(item);

    const textSpan = (
      <span
        key="text"
        style={{
          padding: '0.25em 0.5em 0.35em 0.5em',
          marginLeft: 'clamp(24px, 16cqh, 48px)',
          marginRight: 'clamp(20px, 14cqh, 40px)',
          fontSize: 'clamp(14px, calc(38cqh * var(--flowing-menu-band, 1)), 130px)',
          lineHeight: 1.25,
          fontWeight: 400,
          letterSpacing: '-0.025em',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    );

    if (layout === 'interleave' && imgs.length > 1) {
      return (
        <div key={key} style={{ display: 'flex', height: '100%', flexShrink: 0, alignItems: 'center' }}>
          {imgs.map((src, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center' }}>
              {textSpan}
              <span className={isMonoLogo(src) ? 'fm-mono-logo' : undefined} style={imgStyle(src)} />
            </span>
          ))}
        </div>
      );
    }

    return (
      <div key={key} style={{ display: 'flex', height: '100%', flexShrink: 0, alignItems: 'center' }}>
        {textSpan}
        {imgs.map((src, i) => (
          <span key={i} className={isMonoLogo(src) ? 'fm-mono-logo' : undefined} style={imgStyle(src)} />
        ))}
      </div>
    );
  };

  // Inline styles replacing Tailwind classes that don't work reliably in Tailwind v4
  const rootStyle: CSSProperties = {
    position: 'relative',
    boxSizing: 'border-box',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    backgroundColor: bgColor,
    color: textColor,
    ['--flowing-menu-border' as string]: borderColor,
    ...style,
  };

  const listStyle: CSSProperties = {
    position: 'relative',
    margin: 0,
    display: 'flex',
    height: '100%',
    listStyle: 'none',
    flexDirection: 'column',
    padding: 0,
  };

  const itemStyle: CSSProperties = {
    position: 'relative',
    minHeight: '3.5rem',
    flex: '1 1 0',
    overflow: 'hidden',
    containerType: 'size' as CSSProperties['containerType'],
  };

  const dividerStyle: CSSProperties = {
    pointerEvents: 'none',
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    height: '1px',
    transformOrigin: 'left',
    backgroundColor: borderColor,
  };

  const linkStyle: CSSProperties = {
    position: 'relative',
    boxSizing: 'border-box',
    display: 'grid',
    height: '100%',
    width: '100%',
    cursor: 'pointer',
    gridTemplateColumns: align === 'left' ? 'auto 1fr auto' : '1fr auto 1fr',
    alignItems: 'center',
    gap: '1rem',
    border: 0,
    background: 'transparent',
    padding: '0 clamp(16px, 4cqw, 40px)',
    textAlign: 'left',
    color: 'inherit',
    textDecoration: 'none',
    outline: 'none',
    transition: 'opacity 450ms ease',
    WebkitTapHighlightColor: 'transparent',
    font: 'inherit',
  };

  const indexStyle: CSSProperties = {
    minWidth: '1.6em',
    justifySelf: 'start',
    fontSize: 'clamp(11px, 12cqh, 15px)',
    fontVariantNumeric: 'tabular-nums',
    opacity: 0.5,
  };

  const labelStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.28em',
    justifySelf: align === 'left' ? 'start' : 'center',
    overflow: 'hidden',
    padding: '0.25em 0 0.35em 0',
    fontSize: 'clamp(16px, 40cqh, 140px)',
    lineHeight: 1.25,
    fontWeight: 500,
    letterSpacing: '-0.035em',
    whiteSpace: 'nowrap',
  };

  const dotStyle: CSSProperties = {
    display: 'block',
    height: '0.2em',
    width: '0.2em',
    flexShrink: 0,
    borderRadius: '9999px',
    backgroundColor: 'currentColor',
  };

  const endStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.875rem',
    justifySelf: 'end',
  };

  const metaStyle: CSSProperties = {
    fontSize: 'clamp(11px, 12cqh, 15px)',
    fontVariantNumeric: 'tabular-nums',
    opacity: 0.5,
  };

  const arrowStyle: CSSProperties = {
    display: 'grid',
    placeItems: 'center',
    opacity: 0.55,
  };

  const bandStyle: CSSProperties = {
    pointerEvents: 'none',
    visibility: 'hidden',
    position: 'absolute',
    inset: 0,
    zIndex: 1,
    overflow: 'hidden',
    clipPath: 'inset(50% 0 50% 0)',
  };

  const trackStyle: CSSProperties = {
    display: 'flex',
    height: '100%',
    width: 'max-content',
    alignItems: 'center',
    willChange: 'transform',
  };

  const floatStyle: CSSProperties = {
    pointerEvents: 'none',
    visibility: 'hidden',
    position: 'absolute',
    inset: 0,
    zIndex: 1,
    overflow: 'hidden',
    clipPath: 'inset(50% 0 50% 0)',
    backgroundColor: marqueeBgColor,
    color: marqueeTextColor,
  };

  const floatLayerStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '25%',
    width: '100%',
    containerType: 'size' as CSSProperties['containerType'],
    willChange: 'transform, opacity',
  };

  return (
    <nav
      ref={rootRef}
      className={className}
      style={rootStyle}
      aria-label={ariaLabel}
    >
      <ul ref={listRef} style={listStyle} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
        {items.map((item, index) => {
          const active = index === activeIndex;
          const handlers = linkHandlers(item, index);
          const content = (
            <>
              <span style={indexStyle} data-intro-fade="" aria-hidden="true">
                {showIndex ? String(index + 1).padStart(2, '0') : null}
              </span>
              <span style={labelStyle}>
                <span style={{ display: 'block', overflow: 'hidden', paddingBottom: '0.25em', marginBottom: '-0.25em' }}>
                  <span data-intro-line="" style={{ display: 'block' }}>
                    {item.text}
                  </span>
                </span>
                {active && <span style={dotStyle} aria-hidden="true" />}
              </span>
              <span style={endStyle} data-intro-fade="" aria-hidden="true">
                {item.meta ? <span style={metaStyle}>{item.meta}</span> : null}
                {showArrow ? (
                  <span style={arrowStyle}>
                    <HugeiconsIcon icon={ArrowUpRight01Icon} size={22} strokeWidth={1.75} />
                  </span>
                ) : null}
              </span>
            </>
          );
          return (
            <li
              key={`${item.text}-${index}`}
              ref={node => {
                rows.current[index] = { ...rows.current[index], item: node };
              }}
              style={itemStyle}
            >
              {dividers && index > 0 && (
                <span style={dividerStyle} data-intro-rule="" aria-hidden="true" />
              )}
              {item.link ? (
                <a
                  style={linkStyle}
                  data-link=""
                  href={item.link}
                  aria-current={active ? 'page' : undefined}
                  {...handlers}
                >
                  {content}
                </a>
              ) : (
                <button
                  type="button"
                  style={linkStyle}
                  data-link=""
                  aria-current={active ? 'page' : undefined}
                  {...handlers}
                >
                  {content}
                </button>
              )}
              <div
                className="fm-band"
                style={{ ...bandStyle, backgroundColor: marqueeBgColor, color: marqueeTextColor }}
                aria-hidden="true"
                ref={node => {
                  rows.current[index] = { ...rows.current[index], band: node };
                }}
              >
                <div
                  style={trackStyle}
                  ref={node => {
                    rows.current[index] = { ...rows.current[index], track: node };
                  }}
                >
                  {Array.from({ length: copies[index] ?? 3 }, (_, copy) => renderPart(item, copy))}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {carryContent && (
        <div
          className="fm-band"
          style={floatStyle}
          aria-hidden="true"
          ref={floatRef}
        >
          {[0, 1].map(slot => {
            const item = slots[slot] >= 0 ? items[slots[slot]] : null;
            return (
              <div
                key={slot}
                style={floatLayerStyle}
                ref={node => {
                  layerRefs.current[slot] = node;
                }}
              >
                <div
                  style={trackStyle}
                  ref={node => {
                    layerTracks.current[slot] = node;
                  }}
                >
                  {item &&
                    Array.from({ length: copies[slots[slot]] ?? 3 }, (_, copy) => renderPart(item, copy))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </nav>
  );
}

export default FlowingMenu;
