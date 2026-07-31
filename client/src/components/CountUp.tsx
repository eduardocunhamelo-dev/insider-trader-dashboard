import { useEffect, useRef, useState } from "react";
import { useInView } from "../hooks/useInView";

interface CountUpProps {
  end: number;
  duration?: number;   // ms
  decimals?: number;
  prefix?: string;
  suffix?: string;
  separator?: string;  // milhar (pt-BR: ".")
  className?: string;
}

export function CountUp({
  end,
  duration = 1800,
  decimals = 0,
  prefix = "",
  suffix = "",
  separator = ".",
  className,
}: CountUpProps) {
  const { ref, inView } = useInView<HTMLSpanElement>();
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!inView || startedRef.current) return;
    startedRef.current = true;

    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setValue(end * eased);
      if (progress < 1) requestAnimationFrame(tick);
      else setValue(end);
    };
    requestAnimationFrame(tick);
  }, [inView, end, duration]);

  const format = (n: number) => {
    const [int, dec] = n.toFixed(decimals).split(".");
    const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    return dec ? `${withSep},${dec}` : withSep;
  };

  return (
    <span ref={ref} className={className}>
      {prefix}{format(value)}{suffix}
    </span>
  );
}
