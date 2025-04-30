import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { KeyboardControls } from "@react-three/drei";
import { useAudio } from "./lib/stores/useAudio";
import "@fontsource/inter";
import { Controls } from "./lib/controls";
import { Board } from "./components/game/Board";
import GameUI from "./components/game/GameUI";
import SoundManager from "./components/game/SoundManager";
import { usePuzznic } from "./lib/stores/usePuzznic";

// Define control keys for the game
const keyMap = [
  { name: Controls.left, keys: ["KeyA", "ArrowLeft"] },
  { name: Controls.right, keys: ["KeyD", "ArrowRight"] },
  { name: Controls.select, keys: ["Space", "Enter"] },
  { name: Controls.restart, keys: ["KeyR"] },
  { name: Controls.nextLevel, keys: ["KeyN"] },
];

// Main App component
function App() {
  const { gamePhase, initGame } = usePuzznic();
  const [showCanvas, setShowCanvas] = useState(false);
  const { setBackgroundMusic, setHitSound, setSuccessSound } = useAudio();

  // Initialize sounds
  useEffect(() => {
    // Load audio elements
    const backgroundMusic = new Audio("/sounds/background.mp3");
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.4;
    
    const hitSound = new Audio("/sounds/hit.mp3");
    hitSound.volume = 0.5;
    
    const successSound = new Audio("/sounds/success.mp3");
    successSound.volume = 0.6;
    
    // Set the audio in the store
    setBackgroundMusic(backgroundMusic);
    setHitSound(hitSound);
    setSuccessSound(successSound);
    
    // Initialize game
    initGame();
    
    // Show the canvas once everything is loaded
    setShowCanvas(true);
    
    return () => {
      backgroundMusic.pause();
      hitSound.pause();
      successSound.pause();
    };
  }, [setBackgroundMusic, setHitSound, setSuccessSound, initGame]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {showCanvas && (
        <KeyboardControls map={keyMap}>
          <Canvas
            shadows
            camera={{
              position: [0, 5, 10],
              fov: 60,
              near: 0.1,
              far: 1000
            }}
            gl={{
              antialias: true,
              powerPreference: "default"
            }}
          >
            <color attach="background" args={["#87CEEB"]} />
            
            {/* Lighting */}
            <ambientLight intensity={0.6} />
            <directionalLight 
              position={[10, 10, 5]} 
              intensity={0.8} 
              castShadow 
              shadow-mapSize={[1024, 1024]} 
            />
            
            <Suspense fallback={null}>
              <Board />
            </Suspense>
          </Canvas>
          
          <GameUI />
          <SoundManager />
        </KeyboardControls>
      )}
    </div>
  );
}

export default App;
