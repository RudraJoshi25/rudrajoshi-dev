import { useEffect, useRef } from "react";
import colorSharp from "../assets/img/color-sharp.png";
import { gsap, ScrollTrigger } from "../lib/motion";
import { openAskAI } from "./AskAI";
import { Tether } from "./Tether";

const SKILLS = [
  { name: "Machine Learning", level: 90, note: "RAG pipelines, RL (PPO/SAC/TD3), model evaluation" },
  { name: "Web Development", level: 85, note: "React, Next.js, FastAPI, Node" },
  { name: "Data Analysis", level: 82, note: "Python, pandas, dashboards, signal processing" },
  { name: "Android Development", level: 70, note: "Native apps, sensor integration" },
];

export const Skills = () => {
  const rootRef = useRef(null);
  const playedRef = useRef(false);

  useEffect(() => {
    /* The fill sequence runs once, the moment this section takes the
       stage (deck event on desktop, viewport entry on mobile). */
    const play = () => {
      if (playedRef.current) return;
      playedRef.current = true;

      const bars = rootRef.current.querySelectorAll(".pq-skill-fill");
      const rows = rootRef.current.querySelectorAll(".pq-skill-row");
      const counts = rootRef.current.querySelectorAll(".pq-skill-pct");

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(rootRef.current.querySelector(".pq-skills-head"), { y: 30, opacity: 0, duration: 0.5 });

      rows.forEach((row, i) => {
        const at = 0.25 + i * 0.14;
        /* Reveal on Y, not X — the list is a scroll container, so anything
           translated sideways gets clipped at its edge. */
        tl.from(row, { y: 26, opacity: 0, duration: 0.45 }, at);
        tl.to(bars[i], { scaleX: SKILLS[i].level / 100, duration: 0.8, ease: "power2.inOut" }, at + 0.15);
        tl.to(
          counts[i],
          { textContent: SKILLS[i].level, duration: 0.8, snap: { textContent: 1 } },
          at + 0.15
        );
      });
    };

    const onActive = (e) => {
      if (e?.detail?.id === "skills") play();
    };
    window.addEventListener("pq:deck-active", onActive);

    let st = null;
    if (window.innerWidth < 900) {
      st = ScrollTrigger.create({
        trigger: rootRef.current,
        start: "top 70%",
        onEnter: play,
      });
    }

    return () => {
      window.removeEventListener("pq:deck-active", onActive);
      st?.kill();
    };
  }, []);

  return (
    <section className="skill" id="skills" ref={rootRef}>
      <div className="container">
        <div className="pq-skills-inner">
          <div className="pq-skills-head">
            <span className="pq-kicker">01 &mdash; Capabilities</span>
            <h2>Skills</h2>
            <p>Each bar is a domain I ship in &mdash; tap one to ask the AI about it.</p>
          </div>

          <div className="pq-skill-list pq-deck-scroll">
            {SKILLS.map((s) => (
              <button
                type="button"
                className="pq-skill-row"
                key={s.name}
                data-cursor="ask"
                onClick={() => openAskAI(`How deep is Rudra's ${s.name} experience?`)}
              >
                <div className="pq-skill-top">
                  <h3>{s.name}</h3>
                  <span className="pq-skill-num"><span className="pq-skill-pct">0</span>%</span>
                </div>
                <div className="pq-skill-track">
                  <div className="pq-skill-fill" />
                </div>
                <p className="pq-skill-note">{s.note}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
      <img className="background-image-left" src={colorSharp} alt="" aria-hidden="true" />
      <Tether variant="descend" to="projects" label="Projects" />
    </section>
  );
};
