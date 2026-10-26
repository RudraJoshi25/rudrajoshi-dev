import { Col } from "react-bootstrap";
import { openAskAI } from "./AskAI";

export const ProjectCard = ({ title, description, imgUrl, url, askPrompt }) => {
  const hasLink = url && url !== "#";

  return (
    <Col size={12} sm={6} md={4}>
      {/* This is a <div>, not an <a>: the "Ask about this" button can't be
          nested inside a link. The thumbnail is the clickable link instead. */}
      <div className="proj-imgbx">
        <a
          className="proj-thumb"
          href={hasLink ? url : undefined}
          target={hasLink ? "_blank" : undefined}
          rel={hasLink ? "noreferrer" : undefined}
          aria-label={hasLink ? `Open ${title}` : title}
        >
          <img src={imgUrl} alt={title} />
        </a>
        <div className="proj-detail">
          <h4>
            {hasLink ? (
              <a href={url} target="_blank" rel="noreferrer">
                {title}
              </a>
            ) : (
              title
            )}
          </h4>
          <p>{description}</p>
          <button
            type="button"
            className="proj-ask"
            onClick={() => openAskAI(askPrompt || `Tell me about ${title}.`)}
          >
            Ask about this
          </button>
        </div>
      </div>
    </Col>
  );
};
