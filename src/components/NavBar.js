import { useState, useEffect } from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import { Logo } from "./Logo";
import navIcon1 from '../assets/img/nav-icon1.svg';
import navIconGithub from '../assets/img/nav-icon-github.svg';
import navIconMail from '../assets/img/nav-icon-mail.svg';
import { openAskAI } from "./AskAI";
import { goToSection } from "./Deck";
import { CONTACT_EMAIL } from "../siteConfig";

const LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
];

export const NavBar = () => {

  const [activeLink, setActiveLink] = useState('home');
  const [scrolled, setScrolled] = useState(false);

  /* The deck announces which section is on stage — nav highlights follow
     it (and it doubles as the "scrolled" compact style everywhere but home). */
  useEffect(() => {
    const onActive = (e) => {
      const id = e?.detail?.id;
      if (!id) return;
      setActiveLink(id);
      setScrolled(id !== 'home');
    };
    window.addEventListener("pq:deck-active", onActive);

    const onScroll = () => setScrolled(window.scrollY > 50 || activeLink !== 'home');
    window.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("pq:deck-active", onActive);
      window.removeEventListener("scroll", onScroll);
    };
  }, [activeLink]);

  const jump = (id) => {
    setActiveLink(id);
    goToSection(id);
  };

  return (
    <Navbar expand="md" className={scrolled ? "scrolled" : ""}>
      <Container>
        <Navbar.Brand as="button" onClick={() => jump('home')} aria-label="Rudra Joshi — home">
          <Logo />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav">
          <span className="navbar-toggler-icon"></span>
        </Navbar.Toggle>
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            {LINKS.map((l) => (
              <Nav.Link
                key={l.id}
                as="button"
                className={activeLink === l.id ? 'active navbar-link navbar-btn-link' : 'navbar-link navbar-btn-link'}
                onClick={() => jump(l.id)}
              >
                {l.label}
              </Nav.Link>
            ))}
            <Nav.Link
              as="button"
              className="navbar-link navbar-btn-link"
              onClick={() => openAskAI()}
            >
              Ask AI
            </Nav.Link>
          </Nav>
          <span className="navbar-text">
            <div className="social-icon">
              <a href="https://linkedin.com/in/rudrajoshi25" target="_blank" rel="noreferrer"><img src={navIcon1} alt="LinkedIn" /></a>
              <a href="https://github.com/RudraJoshi25" target="_blank" rel="noreferrer"><img src={navIconGithub} alt="GitHub" /></a>
              <a href={`mailto:${CONTACT_EMAIL}`}><img src={navIconMail} alt="Email" /></a>
            </div>
            <button className="vvd" onClick={() => jump('connect')}><span>Let's Connect</span></button>
          </span>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}
