import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./AskAI.css";
import {
  MAX_MESSAGES_PER_SESSION,
  MAX_QUESTION_CHARS,
  askPersonaQuery,
  clearMessages,
  loadMessages,
  markTipSeen,
  revealSection,
  saveMessages,
  sectionForSource,
  tipAlreadySeen,
  warmUp,
} from "../lib/personaQuery";

/* Prompts change with whatever section the visitor is looking at, so the bot
   feels attached to the page rather than floating above it. */
const PROMPTS_BY_SECTION = {
  home: [
    "Who is Rudra, in one paragraph?",
    "What roles is he the best fit for?",
    "What is he working on right now?",
  ],
  skills: [
    "How deep is his ML experience, really?",
    "Which stack is he strongest in?",
    "Has he shipped anything to production?",
  ],
  projects: [
    "Which project was the hardest, and why?",
    "Explain the patent in plain English.",
    "Walk me through the research paper.",
  ],
  connect: [
    "Why should I hire Rudra?",
    "Summarise his experience for a recruiter.",
    "What are his standout achievements?",
  ],
};

const SECTION_IDS = ["home", "skills", "projects", "connect"];

const CITE_RE = /\[\[cite:([0-9,\s]+)\]\]/g;

/* After this long with no answer, assume Render is cold-starting. */
const SLOW_AFTER_MS = 8000;

/* [banner text, assistant bubble text] per askPersonaQuery error code. */
const ERROR_COPY = {
  rate_limited: [
    "Slow down a touch — too many questions at once.",
    "You're asking faster than I can think. Give it a few seconds and try again.",
  ],
  too_long: [
    `Questions are capped at ${MAX_QUESTION_CHARS} characters.`,
    "That one was a bit long for me. Try a shorter version of the question.",
  ],
  timeout: [
    "The assistant took too long to answer.",
    "The server didn't wake up in time. Try again in a moment, or email Rudra directly.",
  ],
  server: [
    "The assistant hit an error.",
    "Something went wrong on my side. Try again, or email Rudra directly (link at the bottom of the page).",
  ],
  network: [
    "Couldn't reach the assistant just now.",
    "I'm having trouble reaching my backend right now. You can always email Rudra directly (link at the bottom of the page).",
  ],
};

export const AskAI = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => loadMessages());
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState("home");
  const [showTip, setShowTip] = useState(false);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const userTurns = useMemo(
    () => messages.filter((m) => m.role === "user").length,
    [messages]
  );
  const capReached = userTurns >= MAX_MESSAGES_PER_SESSION;
  const tooLong = input.length > MAX_QUESTION_CHARS;
  const canSend = input.trim().length > 0 && !tooLong && !loading && !capReached;
  const isEmpty = messages.length === 0;

  /* ---------------------------------------------------------------- *
   * Warm the Render dyno on mount so the first question isn't a 30s wait
   * ---------------------------------------------------------------- */
  useEffect(() => {
    warmUp();
  }, []);

  /* ---------------------------------------------------------------- *
   * First-visit nudge — shown once per session, then never again
   * ---------------------------------------------------------------- */
  useEffect(() => {
    if (tipAlreadySeen()) return;
    const showTimer = window.setTimeout(() => setShowTip(true), 4000);
    const hideTimer = window.setTimeout(() => {
      setShowTip(false);
      markTipSeen();
    }, 12000);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  /* ---------------------------------------------------------------- *
   * Track the section on stage to pick relevant quick prompts.
   * Desktop: the deck announces it. Mobile: fall back to scroll math.
   * ---------------------------------------------------------------- */
  useEffect(() => {
    const onDeckActive = (e) => {
      if (e?.detail?.id) setActiveSection(e.detail.id);
    };
    window.addEventListener("pq:deck-active", onDeckActive);

    const onScroll = () => {
      const mid = window.innerHeight / 2;
      let current = "home";
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= mid) current = id;
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("pq:deck-active", onDeckActive);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  const openDrawer = useCallback((prefill) => {
    setShowTip(false);
    markTipSeen();
    setOpen(true);
    if (prefill) setInput(prefill);
    window.setTimeout(() => inputRef.current?.focus(), 260);
  }, []);

  /* ---------------------------------------------------------------- *
   * Other components open the drawer by firing a window event, which
   * avoids threading props through NavBar / Banner / every ProjectCard.
   * ---------------------------------------------------------------- */
  useEffect(() => {
    const onOpen = (e) => openDrawer(e?.detail?.prefill);
    window.addEventListener("pq:open", onOpen);
    return () => window.removeEventListener("pq:open", onOpen);
  }, [openDrawer]);

  /* "/" opens the drawer, Escape closes it. */
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      const typing = tag === "input" || tag === "textarea" || e.target?.isContentEditable;

      if (e.key === "/" && !typing && !open) {
        e.preventDefault();
        openDrawer();
      }
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, openDrawer]);

  /* ---------------------------------------------------------------- *
   * Rendering: turn [[cite:1,2]] markers into clickable chips
   * ---------------------------------------------------------------- */
  const renderAnswer = (content, sources) => {
    if (!content) return null;

    const byId = new Map();
    (sources || []).forEach((s) => {
      if (typeof s.id === "number") byId.set(s.id, s);
    });

    const parts = [];
    let last = 0;
    let match;
    CITE_RE.lastIndex = 0;

    while ((match = CITE_RE.exec(content)) !== null) {
      if (match.index > last) parts.push(content.slice(last, match.index));
      const ids = match[1]
        .split(",")
        .map((p) => Number(p.trim()))
        .filter((n) => Number.isFinite(n));
      parts.push({ ids, key: `${match.index}` });
      last = match.index + match[0].length;
    }
    if (last < content.length) parts.push(content.slice(last));

    return parts.map((part, i) => {
      if (typeof part === "string") {
        return <span key={`t-${i}`}>{part}</span>;
      }

      const cited = part.ids.map((id) => byId.get(id)).filter(Boolean);
      const rule = cited.length ? sectionForSource(cited[0]) : null;

      return (
        <button
          key={`c-${part.key}-${i}`}
          type="button"
          className={`pq-cite${rule ? " pq-cite-link" : ""}`}
          title={
            rule
              ? `Jump to ${rule.label}`
              : cited.map((s) => s.file_name).filter(Boolean).join(", ") || "Source"
          }
          onClick={() => {
            if (!rule) return;
            setOpen(false);
            window.setTimeout(() => revealSection(rule), 260);
          }}
        >
          {rule ? rule.label : `source ${part.ids.join(",")}`}
        </button>
      );
    });
  };

  /* ---------------------------------------------------------------- *
   * Sending
   * ---------------------------------------------------------------- */
  const send = async (override) => {
    const question = (override ?? input).trim();
    if (!question || loading) return;

    if (question.length > MAX_QUESTION_CHARS) {
      setError(ERROR_COPY.too_long[0]);
      return;
    }

    if (capReached) {
      setError(
        "That's the question limit for this session — email is the fastest way to reach Rudra directly."
      );
      return;
    }

    setError(null);
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    const slowTimer = window.setTimeout(() => setSlow(true), SLOW_AFTER_MS);

    try {
      const { answer, sources } = await askPersonaQuery(question);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            answer ||
            "I couldn't find anything in Rudra's documents that answers that. Try rephrasing, or email him directly.",
          sources,
        },
      ]);
    } catch (err) {
      const [banner, bubble] = ERROR_COPY[err?.code] || ERROR_COPY.server;
      setError(banner);
      setMessages((prev) => [...prev, { role: "assistant", content: bubble, failed: true }]);
    } finally {
      window.clearTimeout(slowTimer);
      setSlow(false);
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const prompts = PROMPTS_BY_SECTION[activeSection] || PROMPTS_BY_SECTION.home;

  const handoff = () => {
    setOpen(false);
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("pq:deck-goto", { detail: { id: "connect" } }));
    }, 260);
  };

  return (
    <>
      {/* Launcher — bounces on the same updown rhythm as the banner
          astronaut (see .pq-launcher-wrap in AskAI.css). Pauses while
          open so the drawer isn't fighting a moving anchor. */}
      <div className={`pq-launcher-wrap${open ? " pq-launcher-wrap-open" : ""}`}>
        {showTip && !open && (
          <div className="pq-tip" role="status">
            Ask me anything about Rudra
          </div>
        )}
        <button
          type="button"
          className={`pq-launcher${open ? " pq-launcher-open" : ""}`}
          aria-label={open ? "Close AI assistant" : "Open AI assistant"}
          aria-expanded={open}
          onClick={() => (open ? setOpen(false) : openDrawer())}
        >
          <span className="pq-launcher-spark" aria-hidden="true" />
          <span className="pq-launcher-spark pq-spark-2" aria-hidden="true" />
          <span className="pq-launcher-ring" aria-hidden="true" />
          <span className="pq-launcher-orbit" aria-hidden="true" />
          <span className="pq-launcher-core" aria-hidden="true">
            <span className="pq-launcher-mark">{open ? "×" : "PQ"}</span>
          </span>
        </button>
      </div>

      {/* Scrim */}
      <div
        className={`pq-scrim${open ? " pq-scrim-on" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`pq-drawer${open ? " pq-drawer-open" : ""}`}
        aria-hidden={!open}
        aria-label="PersonaQuery AI assistant"
      >
        <header className="pq-head">
          <div className="pq-head-id">
            <span className="pq-head-mark">PQ</span>
            <div>
              <div className="pq-head-title">
                Persona<span>Query</span>
              </div>
              <div className="pq-head-sub">Rudra's digital twin &middot; RAG-grounded</div>
            </div>
          </div>
          <div className="pq-head-actions">
            {!isEmpty && (
              <button
                type="button"
                className="pq-ghost-btn"
                onClick={() => {
                  setMessages([]);
                  clearMessages();
                  setError(null);
                }}
              >
                Clear
              </button>
            )}
            <button
              type="button"
              className="pq-ghost-btn"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </header>

        <div className="pq-body" ref={scrollRef}>
          {isEmpty && (
            <div className="pq-welcome">
              <p>
                I'm PersonaQuery &mdash; an AI that has read Rudra's resume, research paper and
                patent. Ask me anything, and I'll answer only from those documents, with the
                receipts.
              </p>
              <div className="pq-welcome-note">
                Answers are grounded in real sources. Tap a source chip to jump to that part of
                the page.
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`pq-msg pq-msg-${m.role}`}>
              <div className={`pq-bubble${m.failed ? " pq-bubble-failed" : ""}`}>
                <div className="pq-bubble-text">
                  {m.role === "assistant" ? renderAnswer(m.content, m.sources) : m.content}
                </div>

                {m.role === "assistant" && Array.isArray(m.sources) && m.sources.length > 0 && (
                  <details className="pq-sources">
                    <summary>{m.sources.length} source{m.sources.length > 1 ? "s" : ""}</summary>
                    <ul>
                      {m.sources.slice(0, 6).map((s, si) => {
                        const rule = sectionForSource(s);
                        return (
                          <li key={s.id ?? si}>
                            <div className="pq-source-head">
                              <span className="pq-source-id">[{s.id ?? si + 1}]</span>
                              <span className="pq-source-name">{s.file_name || "Document"}</span>
                              {s.page_label && s.page_label !== "n/a" && (
                                <span className="pq-source-meta">p.{s.page_label}</span>
                              )}
                              {rule && (
                                <button
                                  type="button"
                                  className="pq-source-jump"
                                  onClick={() => {
                                    setOpen(false);
                                    window.setTimeout(() => revealSection(rule), 260);
                                  }}
                                >
                                  See {rule.label} &rarr;
                                </button>
                              )}
                            </div>
                            {s.snippet && <div className="pq-source-snip">{s.snippet}</div>}
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="pq-msg pq-msg-assistant" role="status">
              <div className="pq-bubble pq-typing" aria-label="Thinking">
                <span />
                <span />
                <span />
              </div>
              {slow && (
                <div className="pq-bubble">
                  Waking up the server &mdash; the first question can take up to a minute.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pq-foot">
          {error && <div className="pq-error">{error}</div>}

          {!capReached && (
            <div className="pq-prompts">
              {prompts.map((p) => (
                <button key={p} type="button" className="pq-prompt" onClick={() => send(p)}>
                  {p}
                </button>
              ))}
            </div>
          )}

          {capReached ? (
            <button type="button" className="pq-handoff" onClick={handoff}>
              Ask Rudra directly &rarr;
            </button>
          ) : (
            <div className="pq-inputbar">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask about skills, projects, the patent&hellip;"
                aria-label="Ask a question"
                aria-describedby="pq-char-count"
                maxLength={MAX_QUESTION_CHARS}
              />
              <span
                id="pq-char-count"
                className={`pq-char-count${input.length >= MAX_QUESTION_CHARS - 20 ? " pq-char-count-warn" : ""}`}
              >
                {input.length}/{MAX_QUESTION_CHARS}
              </span>
              <button
                type="button"
                className="pq-send"
                onClick={() => send()}
                disabled={!canSend}
                aria-label="Send"
              >
                &#10148;
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

/** Helper so any component can open the assistant. */
export function openAskAI(prefill) {
  window.dispatchEvent(new CustomEvent("pq:open", { detail: { prefill } }));
}
