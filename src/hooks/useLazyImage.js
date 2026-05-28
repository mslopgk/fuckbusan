import { useEffect, useRef, useState } from 'react';

/**
 * Returns a ref and backgroundImage style that activates only when
 * the element enters the viewport (± 300px margin).
 *
 * If thumbSrc is provided it is tried first; falls back to src on error.
 *
 * Usage:
 *   const { ref, bgStyle } = useLazyImage(imageUrl, thumbUrl);
 *   <div ref={ref} className="card-img" style={bgStyle} />
 */
export function useLazyImage(src, thumbSrc) {
  const ref = useRef(null);
  const [resolvedSrc, setResolvedSrc] = useState(null);

  useEffect(() => {
    if (!src && !thumbSrc) return;

    const el = ref.current;
    const candidate = thumbSrc || src;

    const activate = () => {
      if (thumbSrc) {
        const probe = new Image();
        probe.onload = () => setResolvedSrc(thumbSrc);
        probe.onerror = () => setResolvedSrc(src);
        probe.src = thumbSrc;
      } else {
        setResolvedSrc(src);
      }
    };

    if (!el || !('IntersectionObserver' in window)) {
      activate();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          activate();
          observer.disconnect();
        }
      },
      { rootMargin: '300px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [src, thumbSrc]);

  return {
    ref,
    bgStyle: resolvedSrc ? { backgroundImage: `url(${resolvedSrc})` } : {},
  };
}
