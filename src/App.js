import { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import './Redesign.css';
import { NavBar } from "./components/NavBar";
import { Banner } from "./components/Banner";
import { Skills } from "./components/Skills";
import { Projects } from "./components/Projects";
import { Contact } from "./components/Contact";
import { AskAI } from "./components/AskAI";
import { Loader } from "./components/Loader";
import { Cursor } from "./components/Cursor";
import { Deck } from "./components/Deck";

function App() {
  const [ready, setReady] = useState(false);

  return (
    <div className="App">
      <Loader onDone={() => setReady(true)} />
      <Cursor />
      <NavBar />
      <Deck
        sections={[
          { id: "home", node: <Banner ready={ready} /> },
          { id: "skills", node: <Skills /> },
          { id: "projects", node: <Projects /> },
          { id: "connect", node: <Contact /> },
        ]}
      />
      <AskAI />
    </div>
  );
}

export default App;
