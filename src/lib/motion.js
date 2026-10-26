import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** True when the visitor asked the OS for less motion — every scroll
 *  choreography in the site checks this and falls back to static layout. */
export const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Pinning is desktop-only; on small screens everything degrades to
 *  simple reveals so native scroll never fights the page. */
export const canPin = () =>
  typeof window !== "undefined" && window.innerWidth >= 900 && !reducedMotion();

export { gsap, ScrollTrigger };
