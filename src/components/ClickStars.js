import { useEffect, useRef } from "react";
import gsap from "gsap";
import "./ClickStars.css";

const COLORS = ["#ffffff", "#c4b5fd", "#f472b6", "#38bdf8"];

/**
 * Drop this inside any section: clicking that section's background spawns a
 * sparkle that pops, twinkles and fades. The layer itself is
 * pointer-events:none and listens on its parent, so it never intercepts
 * clicks meant for buttons or links.
 */
export const ClickStars = () => {
  const layerRef = useRef(null);

  useEffect(() => {
    const layer = layerRef.current;
    const host = layer?.parentElement;
    if (!host) return;

    const spawn = (e) => {
      /* Ignore clicks on anything interactive — those have their own job. */
      if (e.target.closest("a, button, input, textarea, select, [role='button'], [role='link'], .pq-drawer")) {
        return;
      }

      const box = layer.getBoundingClientRect();
      const x = e.clientX - box.left;
      const y = e.clientY - box.top;

      /* One bright sparkle plus a few small motes drifting off it. */
      makeSparkle(x, y);
      const motes = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < motes; i++) makeMote(x, y);
    };

    const makeSparkle = (x, y) => {
      const el = document.createElement("div");
      el.className = "pq-star";
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 0 C12.9 7.2 16.8 11.1 24 12 C16.8 12.9 12.9 16.8 12 24 C11.1 16.8 7.2 12.9 0 12 C7.2 11.1 11.1 7.2 12 0 Z"/>
      </svg>`;
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      el.style.color = color;
      layer.appendChild(el);

      const size = 18 + Math.random() * 16;
      gsap
        .timeline({ onComplete: () => el.remove() })
        .fromTo(
          el,
          { width: 0, height: 0, opacity: 0, rotate: -60, xPercent: -50, yPercent: -50 },
          { width: size, height: size, opacity: 1, rotate: 0, duration: 0.32, ease: "back.out(2.2)" }
        )
        /* the twinkle: a quick shrink-and-swell before it goes */
        .to(el, { scale: 0.72, duration: 0.16, ease: "power1.inOut" })
        .to(el, { scale: 1.08, duration: 0.16, ease: "power1.inOut" })
        .to(el, { scale: 0, opacity: 0, rotate: 70, duration: 0.42, ease: "power2.in" });
    };

    const makeMote = (x, y) => {
      const el = document.createElement("div");
      el.className = "pq-star-mote";
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
      layer.appendChild(el);

      const angle = Math.random() * Math.PI * 2;
      const dist = 24 + Math.random() * 46;

      gsap
        .timeline({ onComplete: () => el.remove() })
        .fromTo(
          el,
          { x: 0, y: 0, opacity: 1, scale: 1 },
          {
            x: Math.cos(angle) * dist,
            y: Math.sin(angle) * dist,
            opacity: 0,
            scale: 0.2,
            duration: 0.7 + Math.random() * 0.4,
            ease: "power2.out",
          }
        );
    };

    host.addEventListener("click", spawn);
    return () => host.removeEventListener("click", spawn);
  }, []);

  return <div className="pq-stars-layer" ref={layerRef} aria-hidden="true" />;
};
