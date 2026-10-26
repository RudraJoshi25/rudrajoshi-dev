import { useEffect, useRef } from "react";
import { Container, Row, Col } from "react-bootstrap";
import contactImg from "../assets/img/contact-img.svg";
import { gsap, ScrollTrigger } from "../lib/motion";
import { Tether } from "./Tether";
import { CONTACT_EMAIL } from "../siteConfig";

export const Contact = () => {
  const rootRef = useRef(null);
  const playedRef = useRef(false);

  useEffect(() => {
    const play = () => {
      if (playedRef.current) return;
      playedRef.current = true;
      gsap.fromTo(".pq-contact-img",
        { x: -60, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.7, ease: "power3.out" });
      gsap.fromTo(".pq-contact-form",
        { x: 60, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.7, ease: "power3.out" });
    };

    const onActive = (e) => {
      if (e?.detail?.id === "connect") play();
    };
    window.addEventListener("pq:deck-active", onActive);

    let st = null;
    if (window.innerWidth < 900) {
      st = ScrollTrigger.create({ trigger: rootRef.current, start: "top 70%", onEnter: play });
    }

    return () => {
      window.removeEventListener("pq:deck-active", onActive);
      st?.kill();
    };
  }, []);

  return (
    <section className="contact" id="connect" ref={rootRef}>
      {/* The astronaut's cable, arriving — closes the thread that starts
          in the hero and runs down through the deck. */}
      <Tether variant="arrive" />
      <Container>
        <Row className="align-items-center">
          <Col size={12} md={6}>
            <img className="pq-contact-img" src={contactImg} alt="" aria-hidden="true"/>
          </Col>
          <Col size={12} md={6}>
            <div className="pq-contact-form">
              <h2>Get In Touch</h2>
              <p>The fastest way to reach me is email: {CONTACT_EMAIL}</p>
              <a className="pq-email-btn" href={`mailto:${CONTACT_EMAIL}`} data-cursor="link">
                <span>Email me</span>
              </a>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  )
}
