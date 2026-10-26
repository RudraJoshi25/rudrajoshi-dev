import { useEffect } from "react";
import gsap from "gsap";

const LOADER_KEY = "pq:loaderSeen";
const MAX_MS = 4200;

/**
 * The visible loader is the STATIC #pq-static-loader in public/index.html —
 * it shows instantly, before the React bundle even arrives, so there's no
 * black screen. This component only adopts that element: waits for the
 * video to finish (or the hard cap), wipes it away, and tells App the
 * stage is clear.
 */
export const Loader = ({ onDone }) => {
  useEffect(() => {
    const el = document.getElementById("pq-static-loader");

    const alreadySeen = (() => {
      try {
        return window.sessionStorage.getItem(LOADER_KEY) === "1";
      } catch (e) {
        return false;
      }
    })();

    if (!el || alreadySeen || el.style.display === "none") {
      el?.remove();
      onDone?.();
      return;
    }

    document.body.style.overflow = "hidden";
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      try {
        window.sessionStorage.setItem(LOADER_KEY, "1");
      } catch (e) {
        /* non-fatal */
      }
      gsap.to(el, {
        yPercent: -100,
        duration: 0.7,
        ease: "power3.inOut",
        onComplete: () => {
          document.body.style.overflow = "";
          el.remove();
          onDone?.();
        },
      });
    };

    const video = el.querySelector("video");
    const cap = window.setTimeout(finish, MAX_MS);
    video?.addEventListener("ended", finish);
    if (video && video.ended) finish();

    return () => {
      window.clearTimeout(cap);
      video?.removeEventListener("ended", finish);
      document.body.style.overflow = "";
    };
  }, [onDone]);

  return null;
};
