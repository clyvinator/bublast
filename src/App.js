import React from "react";
import "./App.css";

import Landing from "./Components/Landing/Landing";

function App() {
  // window.onbeforeunload = s => (true ? "Close Page?" : null);
  return (
    <div className="App" id="App">
      <div className="BodyInnerDiv" id="BodyInnerDiv">
        <Landing />
      </div>
    </div>
  );
}

export default App;
