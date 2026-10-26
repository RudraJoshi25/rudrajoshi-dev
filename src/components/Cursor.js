import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import "./Cursor.css";

/**
 * Custom cursor: a small dot that follows instantly plus a lagging ring.
 * Over anything tagged data-cursor="view|ask|drag|link" the ring inflates
 * into a labelled chip, so banners that are clickable *announce* it.
 *
 * Uses event delegation on document — works for elements mounted later
 * (project panels, drawer) without re-wiring. Skips itself entirely on
 * touch devices and for prefers-reduced-motion.
 */
const LABELS = {
  view: "View",
  ask: "Ask AI",
  drag: "Scroll",
  link: "Open",
};

export const Cursor = () => {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [label, setLabel] = useState(null);
  const [hidden, setHidden] = useState(true);

  const enabled =
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: fine)").matches;

  useEffect(() => {
    if (!enabled) return;

    document.body.classList.add("pq-cursor-on");

    const xDot = gsap.quickTo(dotRef.current, "x", { duration: 0.08, ease: "power2.out" });
    const yDot = gsap.quickTo(dotRef.current, "y", { duration: 0.08, ease: "power2.out" });
    const xRing = gsap.quickTo(ringRef.current, "x", { duration: 0.35, ease: "power3.out" });
    const yRing = gsap.quickTo(ringRef.current, "y", { duration: 0.35, ease: "power3.out" });

    const onMove = (e) => {
      setHidden(false);
      xDot(e.clientX);
      yDot(e.clientY);
      xRing(e.clientX);
      yRing(e.clientY);
    };

    const onOver = (e) => {
      const target = e.target.closest("[data-cursor]");
      if (target) {
        setLabel(target.getAttribute("data-cursor"));
      } else if (e.target.closest("a, button, [role='button'], input, textarea, summary")) {
        setLabel("hover");
      } else {
        setLabel(null);
      }
    };

    const onLeave = () => setHidden(true);
    const onEnter = () => setHidden(false);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);

    return () => {
      document.body.classList.remove("pq-cursor-on");
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
    };
  }, [enabled]);

  if (!enabled) return null;

  const chip = label && label !== "hover";

  return (
    <>
      <div
        ref={dotRef}
        className={`pq-cursor-dot${hidden ? " pq-cursor-hidden" : ""}${chip ? " pq-cursor-dot-off" : ""}`}
        aria-hidden="true"
      />
      <div
        ref={ringRef}
        className={[
          "pq-cursor-ring",
          hidden ? "pq-cursor-hidden" : "",
          label === "hover" ? "pq-cursor-ring-hover" : "",
          chip ? "pq-cursor-ring-chip" : "",
        ].join(" ")}
        aria-hidden="true"
      >
        <span className="pq-cursor-label">{chip ? LABELS[label] || label : ""}</span>
      </div>
    </>
  );
};
