/**
 * PersonaQuery API client.
 *
 * Talks directly to the FastAPI backend (Render). Note this is a DIFFERENT
 * service from REACT_APP_API_URL, which points at the Express/nodemailer
 * server used by the contact form.
 */

const DEFAULT_BASE = "http://127.0.0.1:8000";

export function apiBase() {
  const raw = process.env.REACT_APP_PERSONAQUERY_URL;
  const base = (raw && raw.trim()) || DEFAULT_BASE;
  return base.replace(/\/+$/, "");
}

function apiUrl(path) {
  return apiBase() + path;
}

/* ------------------------------------------------------------------ *
 * Abuse / cost guard
 * ------------------------------------------------------------------ */

export const MAX_MESSAGES_PER_SESSION = 25;

/* Mirrors the backend's 300-char validation (it answers 422 above this). */
export const MAX_QUESTION_CHARS = 300;

/* Render's free tier can take 30-60s to wake; give up well after that. */
const REQUEST_TIMEOUT_MS = 90000;

/* ------------------------------------------------------------------ *
 * Session persistence — keeps the drawer alive across section nav
 * ------------------------------------------------------------------ */

const STORE_KEY = "pq:messages";
const TIP_KEY = "pq:tipSeen";

export function loadMessages() {
  try {
    const raw = window.sessionStorage.getItem(STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export function saveMessages(messages) {
  try {
    window.sessionStorage.setItem(STORE_KEY, JSON.stringify(messages.slice(-40)));
  } catch (e) {
    /* quota or private mode — non-fatal */
  }
}

export function clearMessages() {
  try {
    window.sessionStorage.removeItem(STORE_KEY);
  } catch (e) {
    /* non-fatal */
  }
}

export function tipAlreadySeen() {
  try {
    return window.sessionStorage.getItem(TIP_KEY) === "1";
  } catch (e) {
    return true;
  }
}

export function markTipSeen() {
  try {
    window.sessionStorage.setItem(TIP_KEY, "1");
  } catch (e) {
    /* non-fatal */
  }
}

/* ------------------------------------------------------------------ *
 * Networking
 * ------------------------------------------------------------------ */

async function fetchWithRetry(url, init, retries = 2, backoffMs = 800) {
  let lastErr = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, init);

      // Render free tier returns these while a dyno is waking up.
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        lastErr = new Error(`Upstream error (${res.status})`);
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, backoffMs * (attempt + 1)));
          continue;
        }
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (err?.name === "AbortError") throw err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, backoffMs * (attempt + 1)));
        continue;
      }
    }
  }

  throw lastErr || new Error("Request failed");
}

/**
 * Fire-and-forget warm-up. The backend sleeps on Render's free tier, so the
 * first real question can otherwise take ~30s and feel broken. Called on
 * portfolio mount, long before anyone opens the drawer.
 */
let warmed = false;
export function warmUp() {
  if (warmed) return;
  warmed = true;
  try {
    fetch(apiUrl("/health"), { method: "GET", mode: "cors" }).catch(() => {});
  } catch (e) {
    /* non-fatal */
  }
}

function apiError(code) {
  const err = new Error(code);
  err.code = code;
  return err;
}

/**
 * Ask a question. Resolves to { answer, sources, traceId, cached }.
 * Rejects with err.code: rate_limited | too_long | server | timeout | network.
 */
export async function askPersonaQuery(question) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res;
  try {
    res = await fetchWithRetry(apiUrl("/chat"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
      signal: controller.signal,
    });
  } catch (err) {
    throw apiError(err?.name === "AbortError" ? "timeout" : "network");
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    if (res.status === 429) throw apiError("rate_limited");
    if (res.status === 422) throw apiError("too_long");
    throw apiError("server");
  }

  const data = await res.json();

  const answer =
    typeof data?.answer === "string"
      ? data.answer
      : typeof data?.response === "string"
      ? data.response
      : typeof data?.text === "string"
      ? data.text
      : "";

  return {
    answer,
    sources: Array.isArray(data?.sources) ? data.sources : [],
    traceId: data?.trace_id,
    cached: Boolean(data?.cached),
  };
}

/* ------------------------------------------------------------------ *
 * Citations -> portfolio sections
 * ------------------------------------------------------------------ */

/**
 * The RAG cites source documents (resume, patent, paper). The portfolio has
 * sections. This maps one to the other so a citation chip can scroll the page
 * to the relevant place instead of being a dead label.
 *
 * Matching is a case-insensitive substring test against file_name + section,
 * first rule that hits wins, so order matters (most specific first).
 */
const SECTION_RULES = [
  { match: ["patent"], target: "projects", tab: "publications", label: "Patent" },
  {
    match: ["ieee", "research", "paper", "cognitive chair", "publication"],
    target: "projects",
    tab: "publications",
    label: "Research Paper",
  },
  {
    match: ["project", "healthecho", "reinforcement"],
    target: "projects",
    tab: "projects",
    label: "Projects",
  },
  {
    match: ["skill", "tech", "stack", "tool"],
    target: "skills",
    tab: null,
    label: "Skills",
  },
  { match: ["resume", "cv", "experience"], target: "skills", tab: null, label: "Skills" },
];

export function sectionForSource(source) {
  if (!source) return null;
  const hay = `${source.file_name || ""} ${source.section || ""}`.toLowerCase();
  for (const rule of SECTION_RULES) {
    if (rule.match.some((needle) => hay.includes(needle))) return rule;
  }
  return null;
}

/**
 * Brings the cited portfolio section on stage and flashes it. The deck
 * handles the transition (or falls back to smooth scroll on mobile);
 * Projects listens for the tab event.
 */
export function revealSection(rule) {
  if (!rule) return;

  if (rule.tab) {
    window.dispatchEvent(
      new CustomEvent("pq:select-project-tab", { detail: { tab: rule.tab } })
    );
  }

  window.dispatchEvent(
    new CustomEvent("pq:deck-goto", { detail: { id: rule.target } })
  );

  // Flash once the deck transition has mostly landed.
  window.setTimeout(() => {
    const el = document.getElementById(rule.target);
    if (!el) return;
    el.classList.add("pq-flash");
    window.setTimeout(() => el.classList.remove("pq-flash"), 1800);
  }, 900);
}
