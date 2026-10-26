import "./Logo.css";

/**
 * RJ monogram + wordmark. Built with the same recipe as the PersonaQuery
 * launcher orb (conic-gradient ring + glass core + orbiting dots) so the
 * brand mark and the AI orb read as the same family.
 */
export const Logo = ({ compact = false }) => (
  <span className={`pq-logo${compact ? " pq-logo-compact" : ""}`}>
    <span className="pq-logo-mark" aria-hidden="true">
      <span className="pq-logo-ring" />
      <span className="pq-logo-core">
        <span className="pq-logo-initials">RJ</span>
      </span>
      <span className="pq-logo-orbit">
        <i className="pq-logo-dot pq-logo-dot-1" />
        <i className="pq-logo-dot pq-logo-dot-2" />
        <i className="pq-logo-dot pq-logo-dot-3" />
      </span>
    </span>

    {!compact && <span className="pq-logo-word">Rudra Joshi</span>}
  </span>
);
