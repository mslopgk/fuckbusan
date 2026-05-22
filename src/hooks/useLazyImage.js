import { useEffect, useRef, useState } from 'react';

/**
 * Returns a ref and backgroundImage style that activates only when
 * the element enters the viewport (± 300px margin).
 *
 * Usage:
 *   const { ref, bgStyle } = useLazyImage(imageUrl);
 *   <div ref={ref} className="card-img" style={bgStyle} />
 */
export function useLazyImage(src) {
  const ref = useRef(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!src) return;
    const el = ref.current;
    if (!el) return;

    if (!('IntersectionObserver' in window)) {
      setActive(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [src]);

  return {
    ref,
    bgStyle: active && src ? { backgroundImage: `url(${src})` } : {},
  };
}
