import { useEffect, useRef } from "react";
import gsap from "gsap";
import { goToSection } from "./Deck";
import "./Tether.css";

/**
 * The astronaut's tether, extended past the illustration and down off the
 * bottom of the stage. It's the site's "there is more below" affordance —
 * necessary because the deck removes the browser scrollbar, so nothing
 * else tells the visitor the page continues.
 *
 * variant "descend"  — trails downward, pulses, and advances the deck when
 *                      clicked (hero + middle sections).
 * variant "arrive"   — the same cable coming in from the top of the final
 *                      section, closing the loop at the Contact figure.
 */
export const Tether = ({ variant = "descend", to, label = "Scroll" }) => {
  const rootRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      /* A dash travelling along the cable — reads as "this way". */
      gsap.fromTo(
        ".pq-tether-flow",
        { strokeDashoffset: 260 },
        { strokeDashoffset: 0, duration: 2.4, ease: "none", repeat: -1 }
      );

      if (variant === "descend") {
        gsap.to(".pq-tether-chev", {
          y: 7,
          duration: 0.9,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
        gsap.fromTo(
          ".pq-tether-label",
          { opacity: 0.45 },
          { opacity: 1, duration: 1.4, ease: "sine.inOut", repeat: -1, yoyo: true }
        );
      }
    }, rootRef);
    return () => ctx.revert();
  }, [variant]);

  const clickable = variant === "descend" && to;

  const body = (
    <svg
      className="pq-tether-svg"
      viewBox="0 0 120 260"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`pqTetherGrad-${variant}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.05" />
          <stop offset="45%" stopColor="#c4b5fd" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#f472b6" stopOpacity="0.75" />
        </linearGradient>
      </defs>

      {variant === "descend" ? (
        <>
          <path
            className="pq-tether-line"
            d="M96 0 C96 60, 20 92, 34 148 C44 190, 60 206, 60 260"
            stroke={`url(#pqTetherGrad-${variant})`}
          />
          <path
            className="pq-tether-flow"
            d="M96 0 C96 60, 20 92, 34 148 C44 190, 60 206, 60 260"
          />
        </>
      ) : (
        <>
          <path
            className="pq-tether-line"
            d="M60 0 C60 54, 44 96, 54 140 C64 184, 96 206, 108 244"
            stroke={`url(#pqTetherGrad-${variant})`}
          />
          <path
            className="pq-tether-flow"
            d="M60 0 C60 54, 44 96, 54 140 C64 184, 96 206, 108 244"
          />
          <circle className="pq-tether-end" cx="108" cy="244" r="4" />
        </>
      )}
    </svg>
  );

  if (!clickable) {
    return (
      <div className={`pq-tether pq-tether-${variant}`} ref={rootRef}>
        {body}
      </div>
    );
  }

  return (
    <div className={`pq-tether pq-tether-${variant}`} ref={rootRef}>
      {body}
      <button
        type="button"
        className="pq-tether-cue"
        data-cursor="link"
        onClick={() => goToSection(to)}
        aria-label={`Go to ${to}`}
      >
        <span className="pq-tether-label">{label}</span>
        <svg className="pq-tether-chev" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 9l7 7 7-7" fill="none" stroke="currentColor" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
};
