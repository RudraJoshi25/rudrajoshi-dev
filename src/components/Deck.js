import { useCallback, useEffect, useRef } from "react";
import { gsap } from "../lib/motion";
import "./Deck.css";

/**
 * Full-page section deck (alethia.earth model): the page never scrolls —
 * wheel / arrow keys / nav clicks CHANGE the active section with a slide
 * transition. One section on stage at a time.
 *
 * A section can claim the wheel first by registering a nested handler
 * (Projects uses this to step horizontally through panels before the deck
 * is allowed to move on).
 *
 * Below 900px the deck steps aside entirely: sections render in normal
 * flow with native scrolling, because scroll-hijacking on touch is misery.
 */

const nestedHandlers = {};

/**
 * Projects (or any section) registers:
 *   (dir: 1|-1, ctx: { x, y }) => boolean(consumed)
 * where x/y is the pointer position at the moment of the wheel event, so a
 * section can decline when the visitor is deliberately scrolling elsewhere.
 */
export function registerNested(id, fn) {
  nestedHandlers[id] = fn;
  return () => {
    if (nestedHandlers[id] === fn) delete nestedHandlers[id];
  };
}

/** Anyone can jump the deck: openDeckSection('connect'). */
export function goToSection(id) {
  window.dispatchEvent(new CustomEvent("pq:deck-goto", { detail: { id } }));
}

const WHEEL_THRESHOLD = 45;

export const Deck = ({ sections }) => {
  const rootRef = useRef(null);
  const indexRef = useRef(0);
  const lockRef = useRef(false);
  const accRef = useRef(0);
  const deckMode = useRef(
    typeof window !== "undefined" && window.innerWidth >= 900
  ).current;

  const announce = useCallback(
    (i) =>
      window.dispatchEvent(
        new CustomEvent("pq:deck-active", {
          detail: { id: sections[i].id, index: i },
        })
      ),
    [sections]
  );

  const goTo = useCallback(
    (next) => {
      const cur = indexRef.current;
      if (next === cur || next < 0 || next >= sections.length || lockRef.current) return;
      lockRef.current = true;

      const els = rootRef.current.querySelectorAll(":scope > .pq-deck-sec");
      const curEl = els[cur];
      const nextEl = els[next];
      const dir = next > cur ? 1 : -1;

      indexRef.current = next;
      announce(next);

      gsap.set(nextEl, { visibility: "visible", zIndex: 2, yPercent: dir * 100 });
      gsap.set(curEl, { zIndex: 1 });

      /* Both move on one clock and land together — any timing mismatch
         here is what reads to the eye as the sections overlapping. */
      const tl = gsap.timeline({
        defaults: { duration: 0.7, ease: "power3.inOut" },
        onComplete: () => {
          gsap.set(curEl, { visibility: "hidden", yPercent: 0 });
          lockRef.current = false;
        },
      });
      tl.to(nextEl, { yPercent: 0 }, 0);
      tl.to(curEl, { yPercent: -dir * 15 }, 0);
    },
    [sections, announce]
  );

  /* Wheel + keyboard drive the deck (desktop only). */
  useEffect(() => {
    if (!deckMode) return;

    const step = (dir, ctx) => {
      const id = sections[indexRef.current].id;
      if (nestedHandlers[id]?.(dir, ctx)) {
        /* section consumed it (e.g. Projects advanced a panel) */
        lockRef.current = true;
        window.setTimeout(() => {
          lockRef.current = false;
        }, 800);
        return;
      }
      goTo(indexRef.current + dir);
    };

    const onWheel = (e) => {
      /* Never hijack scrolling inside the AI drawer. */
      if (e.target.closest?.(".pq-drawer")) return;
      /* Nor inside a section's own scrollable box (e.g. a long skill list)
         until it has hit its own end. */
      const scroller = e.target.closest?.(".pq-deck-scroll");
      if (scroller) {
        const atTop = scroller.scrollTop <= 0;
        const atEnd = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1;
        const overflows = scroller.scrollHeight > scroller.clientHeight + 1;
        if (overflows && ((e.deltaY > 0 && !atEnd) || (e.deltaY < 0 && !atTop))) return;
      }

      e.preventDefault();
      if (lockRef.current) return;
      accRef.current += e.deltaY;
      if (Math.abs(accRef.current) < WHEEL_THRESHOLD) return;
      const dir = accRef.current > 0 ? 1 : -1;
      accRef.current = 0;
      step(dir, { x: e.clientX, y: e.clientY });
    };

    const onKey = (e) => {
      if (e.target.closest?.(".pq-drawer") || e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (["ArrowDown", "PageDown"].includes(e.key)) {
        e.preventDefault();
        if (!lockRef.current) step(1, null);
      } else if (["ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        if (!lockRef.current) step(-1, null);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, [deckMode, sections, goTo]);

  /* Jump requests from nav / AI drawer / banner CTAs. */
  useEffect(() => {
    const onGoto = (e) => {
      const id = e?.detail?.id;
      const i = sections.findIndex((s) => s.id === id);
      if (i < 0) return;
      if (!deckMode) {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      goTo(i);
    };
    window.addEventListener("pq:deck-goto", onGoto);
    return () => window.removeEventListener("pq:deck-goto", onGoto);
  }, [deckMode, sections, goTo]);

  /* Tell everyone who's on stage at mount. */
  useEffect(() => {
    announce(0);
  }, [announce]);

  return (
    <div className={deckMode ? "pq-deck" : "pq-deck-flow"} ref={rootRef}>
      {sections.map((s, i) => (
        <div
          className="pq-deck-sec"
          key={s.id}
          style={deckMode && i !== 0 ? { visibility: "hidden" } : undefined}
        >
          {s.node}
        </div>
      ))}
    </div>
  );
};
