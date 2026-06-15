import { useEffect, useRef, useState } from 'react';

/**
 * Tracks the user's reduced-motion preference and keeps it in sync with the OS.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener('change', handler);
    return () => query.removeEventListener('change', handler);
  }, []);

  return reduced;
}

export interface AnimationClock {
  /** Animation phase in [0, 1). */
  phase: number;
  /** Smoothed UI render rate of the animation loop. */
  fps: number;
  /** Imperatively set the phase (used by the timeline scrubber). */
  setPhase: (phase: number) => void;
}

/**
 * A requestAnimationFrame-driven phase clock. When paused (or when the user
 * prefers reduced motion) the phase is held at a fixed value so the viewport
 * still renders a single, stable scientific frame.
 */
export function useAnimationClock(playing: boolean, speed: number, reducedMotion: boolean): AnimationClock {
  const [phase, setPhase] = useState(0);
  const [fps, setFps] = useState(0);
  const speedRef = useRef(speed);
  const playingRef = useRef(playing);

  speedRef.current = speed;
  playingRef.current = playing && !reducedMotion;

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let accum = 0;
    let frames = 0;

    const tick = (timestamp: number) => {
      const dt = Math.min(80, timestamp - last);
      last = timestamp;
      if (playingRef.current) {
        setPhase((p) => (p + (dt / 1000) * speedRef.current) % 1);
      }
      frames += 1;
      accum += dt;
      if (accum > 640) {
        setFps(Math.round((1000 * frames) / accum));
        accum = 0;
        frames = 0;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return { phase, fps, setPhase: (value: number) => setPhase(((value % 1) + 1) % 1) };
}
