import { useState, useEffect, useRef } from "react";
import { Container, Row, Col } from "react-bootstrap";
import headerImg from "../assets/img/header-img.svg";
import { ArrowRightCircle } from 'react-bootstrap-icons';
import { openAskAI } from "./AskAI";
import { goToSection } from "./Deck";
import { ClickStars } from "./ClickStars";
import { Tether } from "./Tether";
import { gsap } from "../lib/motion";

export const Banner = ({ ready = true }) => {
  const [loopNum, setLoopNum] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [text, setText] = useState('');
  const [delta, setDelta] = useState(300 - Math.random() * 100);
  const toRotate = [ "Rudra Joshi", "an AI Engineer", "a Data Analyst" ];
  const period = 2000;
  const rootRef = useRef(null);

  useEffect(() => {
    let ticker = setInterval(() => {
      tick();
    }, delta);

    return () => { clearInterval(ticker) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  const tick = () => {
    let i = loopNum % toRotate.length;
    let fullText = toRotate[i];
    let updatedText = isDeleting ? fullText.substring(0, text.length - 1) : fullText.substring(0, text.length + 1);

    setText(updatedText);

    if (isDeleting) {
      setDelta(prevDelta => prevDelta / 2);
    }

    if (!isDeleting && updatedText === fullText) {
      setIsDeleting(true);
      setDelta(period);
    } else if (isDeleting && updatedText === '') {
      setIsDeleting(false);
      setLoopNum(loopNum + 1);
      setDelta(500);
    }
  }

  /* Entrance fires when the loader curtain lifts. */
  useEffect(() => {
    if (!ready) return;
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(".pq-hero-stagger > *", { y: 36, opacity: 0, duration: 0.7, stagger: 0.12 })
        .from(".pq-hero-visual", { scale: 0.88, opacity: 0, duration: 0.9 }, "-=0.5");
    }, rootRef);
    return () => ctx.revert();
  }, [ready]);

  return (
    <section className="banner" id="home" ref={rootRef}>
      <Container>
        <Row className="aligh-items-center">
          <Col xs={12} md={6} xl={7}>
            <div className="pq-hero-stagger">
              <span className="tagline">Welcome to my Portfolio</span>
              <h1>{`Hi! I'm `} <span className="txt-rotate"><span className="wrap">{text}</span></span></h1>
              <p>This is my digital frontier. I am a software developer exploring the vast landscape of Machine Learning and Big Data. Driven by curiosity and a passion for innovation, I build intelligent solutions that push the boundaries of what technology can achieve.</p>
              <button style={{ outline: 'none' }} data-cursor="link" onClick={() => goToSection('connect')}>
                Let's Connect <ArrowRightCircle size={25} />
              </button>
              <button type="button" className="pq-banner-cta" style={{ outline: 'none' }} data-cursor="ask" onClick={() => openAskAI()}>
                Or just ask my AI <ArrowRightCircle size={25} />
              </button>
            </div>
          </Col>
          <Col xs={12} md={6} xl={5}>
            <div className="pq-hero-visual">
              <img src={headerImg} alt="Astronaut illustration"/>
            </div>
          </Col>
        </Row>
      </Container>
      <ClickStars />
      <Tether variant="descend" to="skills" label="Scroll" />
    </section>
  )
}
