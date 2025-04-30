import { useState } from "react";
import "@fontsource/inter";
import Game2D from "./components/game2d/Game2D";

// Main App component
function App() {
  const [showGame, setShowGame] = useState(true);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {showGame && <Game2D />}
    </div>
  );
}

export default App;
