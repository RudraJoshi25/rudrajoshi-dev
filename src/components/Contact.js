import { useState, useEffect, useRef } from "react";
import { Container, Row, Col } from "react-bootstrap";
import contactImg from "../assets/img/contact-img.svg";
import { gsap, ScrollTrigger } from "../lib/motion";
import { Tether } from "./Tether";
import { CONTACT_EMAIL } from "../siteConfig";

const sendFailedMessage = `Couldn't send that just now. Email me directly at ${CONTACT_EMAIL}.`;

export const Contact = () => {
  const formInitialDetails = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: ''
  }
  const [formDetails, setFormDetails] = useState(formInitialDetails);
  const [buttonText, setButtonText] = useState('Send');
  const [status, setStatus] = useState({});
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

  const onFormUpdate = (category, value) => {
    setFormDetails({
      ...formDetails,
      [category]: value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setButtonText("Sending...");
    setStatus({});
    try {
      const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(`${baseUrl}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=utf-8",
        },
        body: JSON.stringify(formDetails),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      let result = null;
      try {
        result = await response.json();
      } catch (parseError) {
        result = null;
      }
      if (response.ok && result && result.code === 200) {
        setStatus({ success: true, message: 'Message sent successfully' });
        setFormDetails(formInitialDetails);
      } else {
        setStatus({ success: false, message: sendFailedMessage });
      }
    } catch (err) {
      setStatus({ success: false, message: sendFailedMessage });
    } finally {
      setButtonText("Send");
    }
  };

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
                <form onSubmit={handleSubmit}>
                  <Row>
                    <Col size={12} sm={6} className="px-1">
                      <input type="text" value={formDetails.firstName} placeholder="First Name" onChange={(e) => onFormUpdate('firstName', e.target.value)} />
                    </Col>
                    <Col size={12} sm={6} className="px-1">
                      <input type="text" value={formDetails.lastName} placeholder="Last Name" onChange={(e) => onFormUpdate('lastName', e.target.value)}/>
                    </Col>
                    <Col size={12} sm={6} className="px-1">
                      <input type="email" value={formDetails.email} placeholder="Email Address" onChange={(e) => onFormUpdate('email', e.target.value)} />
                    </Col>
                    <Col size={12} sm={6} className="px-1">
                      <input type="tel" value={formDetails.phone} placeholder="Phone No." onChange={(e) => onFormUpdate('phone', e.target.value)}/>
                    </Col>
                    <Col size={12} className="px-1">
                      <textarea rows="6" value={formDetails.message} placeholder="Message" onChange={(e) => onFormUpdate('message', e.target.value)}></textarea>
                      <button type="submit"><span>{buttonText}</span></button>
                    </Col>
                    {
                      status.message &&
                      <Col>
                        <p className={status.success === false ? "danger" : "success"}>{status.message}</p>
                      </Col>
                    }
                  </Row>
                </form>
              </div>
          </Col>
        </Row>
      </Container>
    </section>
  )
}
