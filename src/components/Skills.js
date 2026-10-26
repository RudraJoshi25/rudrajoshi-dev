import { useEffect, useRef } from "react";
import colorSharp from "../assets/img/color-sharp.png";
import { gsap, ScrollTrigger } from "../lib/motion";
import { openAskAI } from "./AskAI";
import { Tether } from "./Tether";

const SKILLS = [
  { name: "Machine Learning", tags: ["RAG pipelines", "RL (PPO/SAC/TD3)", "Model evaluation"] },
  { name: "Web Development", tags: ["React", "Next.js", "FastAPI", "Node"] },
  { name: "Data Analysis", tags: ["Python", "pandas", "Dashboards", "Signal processing"] },
  { name: "Android Development", tags: ["Native apps", "Sensor integration"] },
];

export const Skills = () => {
  const rootRef = useRef(null);
  const playedRef = useRef(false);

  useEffect(() => {
    /* The reveal runs once, the moment this section takes the stage
       (deck event on desktop, viewport entry on mobile). */
    const play = () => {
      if (playedRef.current) return;
      playedRef.current = true;

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(rootRef.current.querySelector(".pq-skills-head"), { y: 30, opacity: 0, duration: 0.5 });
      /* Reveal on Y, not X — the list is a scroll container, so anything
         translated sideways gets clipped at its edge. */
      tl.from(rootRef.current.querySelectorAll(".pq-skill-row"), { y: 26, opacity: 0, duration: 0.45, stagger: 0.14 }, 0.25);
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
            <p>Each card is a domain I work in &mdash; tap one to ask the AI about it.</p>
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
                <h3>{s.name}</h3>
                <span className="pq-show-stack">
                  {s.tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </span>
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
