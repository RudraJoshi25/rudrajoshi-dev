import { useEffect, useRef, useState } from "react";
import healthechoImg from "../assets/img/healthecho-hero.jpg";
import personaqueryImg from "../assets/img/personaquery.png";
import drlImg from "../assets/img/Deep_Reinforcement_Learning.jpg";
import chairImg from "../assets/img/CognitiveChair.jpg";
import { openAskAI } from "./AskAI";
import { registerNested } from "./Deck";
import { gsap } from "../lib/motion";
import "./Projects.css";

const PANELS = {
  projects: [
    {
      title: "HealthEcho",
      tag: "ML + Real-time",
      description:
        "Real-time dashboard for wearable health monitoring. FastAPI backend with ML models doing data filtering, anomaly detection and alert generation for wellness tracking.",
      stack: ["FastAPI", "ML models", "Anomaly detection", "Dashboards"],
      imgUrl: healthechoImg,
      url: "https://healthecho.vercel.app/",
      cta: "Visit site",
      askPrompt: "Tell me about HealthEcho — what was the hardest part to build?",
    },
    {
      title: "PersonaQuery",
      tag: "RAG + LLM",
      description:
        "A RAG-grounded AI twin that answers questions about me with citations from my resume, paper and patent. Qwen3.8-27B on Groq with hybrid BM25 + vector retrieval; scores 94.4% (17/18) on my golden-set eval. You're on the site it lives in — the PQ orb in the corner is this project.",
      stack: ["Qwen3.8-27B on Groq", "Hybrid BM25 + vector", "Cited answers", "FastAPI"],
      imgUrl: personaqueryImg,
      url: null,
      cta: "Try it right here",
      onCta: () => openAskAI("What makes PersonaQuery's retrieval pipeline interesting?"),
      askPrompt: "How does PersonaQuery's RAG pipeline work under the hood?",
    },
    {
      title: "Deep Reinforcement Learning",
      tag: "Research",
      description:
        "Benchmarked PPO, SAC and TD3 across OpenAI Gym and MuJoCo environments — reward convergence, stability and sample efficiency across seeds.",
      stack: ["PPO / SAC / TD3", "OpenAI Gym", "MuJoCo", "PyTorch"],
      imgUrl: drlImg,
      url: "https://github.com/RudraJoshi25/Deep-Reinforcement-Learning",
      cta: "View on GitHub",
      askPrompt: "What did the PPO vs SAC vs TD3 comparison actually find?",
    },
    {
      title: "Cognitive Chair",
      tag: "BCI Hardware",
      description:
        "Brain-controlled wheelchair for paraplegic and quadriplegic users, driven by EEG and EOG signals. Published at IEEE.",
      stack: ["EEG / EOG", "Signal processing", "Embedded", "Assistive tech"],
      imgUrl: chairImg,
      url: "https://ieeexplore.ieee.org/document/10065338",
      cta: "Read the paper",
      askPrompt: "Explain the Cognitive Chair project and how the EEG/EOG control works.",
    },
  ],
  publications: [
    {
      title: "Cognitive Chair — IEEE Research Paper",
      tag: "Publication",
      description:
        "Peer-reviewed paper on the brain-controlled wheelchair: signal acquisition, EEG/EOG classification approach, and real-world trial results. Published in IEEE Xplore.",
      stack: ["IEEE", "EEG / EOG", "Classification", "Trials"],
      imgUrl: chairImg,
      url: "https://ieeexplore.ieee.org/document/10065338",
      cta: "Read on IEEE Xplore",
      askPrompt: "Summarise the Cognitive Chair research paper — methodology and results.",
    },
    {
      title: "Patent Application",
      tag: "Intellectual Property",
      description:
        "Indian patent application 202211058943 A, building on the assistive-mobility work. Filed 15 Oct 2022 and published in Patent Office Journal 42/2022 on 21 Oct 2022. The AI has read the full document, so ask it for the plain-English version of what it claims.",
      stack: ["Assistive tech", "Published application", "IN 202211058943 A"],
      imgUrl: chairImg,
      url: null,
      cta: null,
      askPrompt: "Explain the patent application in plain English — what does it claim?",
    },
  ],
};

const TABS = [
  { key: "projects", label: "Projects" },
  { key: "publications", label: "Publications" },
];

export const Projects = () => {
  const [activeTab, setActiveTab] = useState("projects");
  const [panelIndex, setPanelIndex] = useState(0);
  const rootRef = useRef(null);
  const trackRef = useRef(null);
  const viewportRef = useRef(null);
  const tabRef = useRef(activeTab);
  const indexRef = useRef(0);
  tabRef.current = activeTab;

  const deckMode = useRef(
    typeof window !== "undefined" && window.innerWidth >= 900
  ).current;

  const slideTo = (i, instant = false) => {
    indexRef.current = i;
    setPanelIndex(i);
    const x = -i * (viewportRef.current?.clientWidth || 0);
    if (instant) {
      gsap.set(trackRef.current, { x });
    } else {
      gsap.to(trackRef.current, { x, duration: 0.8, ease: "power3.inOut" });
      const panel = trackRef.current?.children[i];
      if (panel) {
        gsap.fromTo(
          panel.querySelectorAll(".pq-show-info > *"),
          { y: 22, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, delay: 0.35, ease: "power2.out" }
        );
      }
    }
    gsap.to(".pq-show-progress-fill", {
      scaleX: (i + 1) / PANELS[tabRef.current].length,
      duration: instant ? 0 : 0.8,
      ease: "power3.inOut",
    });
  };

  /* The deck offers us every wheel step while this section is on stage.
     We consume it — sliding one panel sideways — only when the pointer is
     over the panel area. Scrolling with the cursor in the margins above or
     below is an explicit "skip the carousel", so we decline and let the
     deck move to the next section. */
  useEffect(() => {
    if (!deckMode) return;
    return registerNested("projects", (dir, ctx) => {
      if (ctx) {
        const box = viewportRef.current?.getBoundingClientRect();
        const inPanel = box && ctx.y >= box.top && ctx.y <= box.bottom;
        if (!inPanel) return false;
      }
      const next = indexRef.current + dir;
      if (next < 0 || next >= PANELS[tabRef.current].length) return false;
      slideTo(next);
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckMode]);

  /* AI citation chips flip tabs from outside. */
  useEffect(() => {
    const onSelectTab = (e) => {
      const tab = e?.detail?.tab;
      if (tab && PANELS[tab]) switchTab(tab);
    };
    window.addEventListener("pq:select-project-tab", onSelectTab);
    return () => window.removeEventListener("pq:select-project-tab", onSelectTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Keep alignment honest on resize; seed the progress bar on mount. */
  useEffect(() => {
    if (!deckMode) return;
    slideTo(0, true);
    const onResize = () => slideTo(indexRef.current, true);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckMode]);

  const switchTab = (key) => {
    if (key === tabRef.current) return;
    setActiveTab(key);
    tabRef.current = key;
    slideTo(0, true);
  };

  const panels = PANELS[activeTab];

  return (
    <section className="pq-show" id="projects" ref={rootRef}>
      <div className="pq-show-head">
        <div className="pq-show-head-left">
          <span className="pq-kicker">02 &mdash; Work</span>
          <h2>{activeTab === "projects" ? "Projects" : "Publications"}</h2>
        </div>
        <div className="pq-show-tabs" role="tablist" aria-label="Work categories">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={activeTab === t.key}
              className={`pq-show-tab${activeTab === t.key ? " pq-show-tab-active" : ""}`}
              data-cursor="link"
              onClick={() => switchTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pq-show-viewport" ref={viewportRef}>
        <div className="pq-show-track" ref={trackRef}>
          {panels.map((p, i) => {
            const mediaClickable = Boolean(p.url || p.onCta);
            const mediaAction = () => {
              if (p.onCta) return p.onCta();
              if (p.url) window.open(p.url, "_blank", "noopener,noreferrer");
            };

            return (
              <article className="pq-show-panel" key={p.title}>
                <div
                  className={`pq-show-media${mediaClickable ? " pq-show-media-clickable" : ""}`}
                  data-cursor={mediaClickable ? "view" : "ask"}
                  onClick={mediaClickable ? mediaAction : () => openAskAI(p.askPrompt)}
                  role={mediaClickable ? "link" : "button"}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (mediaClickable ? mediaAction : () => openAskAI(p.askPrompt))();
                  }}
                  aria-label={p.url ? `Open ${p.title}` : p.title}
                >
                  <img src={p.imgUrl} alt={p.title} loading="lazy" />
                  <span className="pq-show-tag">{p.tag}</span>
                </div>

                <div className="pq-show-info">
                  <span className="pq-show-index">
                    {String(i + 1).padStart(2, "0")} / {String(panels.length).padStart(2, "0")}
                  </span>
                  <h3>{p.title}</h3>
                  <p>{p.description}</p>
                  <ul className="pq-show-stack">
                    {p.stack.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                  <div className="pq-show-actions">
                    {p.cta && p.url && (
                      <a
                        className="pq-show-cta"
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        data-cursor="link"
                      >
                        {p.cta} &rarr;
                      </a>
                    )}
                    {p.cta && !p.url && p.onCta && (
                      <button type="button" className="pq-show-cta" data-cursor="ask" onClick={p.onCta}>
                        {p.cta} &rarr;
                      </button>
                    )}
                    <button
                      type="button"
                      className="pq-show-ask"
                      data-cursor="ask"
                      onClick={() => openAskAI(p.askPrompt)}
                    >
                      Ask about this
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="pq-show-footer">
        <div className="pq-show-progress" aria-hidden="true">
          <div className="pq-show-progress-fill" />
        </div>
        <div className="pq-show-dots" role="group" aria-label="Panels">
          {panels.map((p, i) => (
            <button
              key={p.title}
              type="button"
              aria-label={`Go to ${p.title}`}
              aria-current={i === panelIndex ? "true" : undefined}
              className={`pq-show-dot${i === panelIndex ? " pq-show-dot-active" : ""}`}
              data-cursor="link"
              onClick={() => slideTo(i)}
            />
          ))}
        </div>
        <span className="pq-show-hint">
          Scroll over a panel to browse &mdash; scroll outside it to skip ahead
        </span>
      </div>
    </section>
  );
};
