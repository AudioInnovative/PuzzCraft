import { useEffect, useState } from 'react';
import { Board2D } from './Board';
import GameUI2D from './GameUI';
import { KeyboardController } from './KeyboardController';
import { TouchController } from './TouchController';
import SoundManager2D from './SoundManager';
import SimpleLevelEditor from './SimpleLevelEditor';
import { useAudio } from '../../lib/stores/useAudio';
import { usePuzznic } from '../../lib/stores/usePuzznic';

export default function Game2D() {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const { setBackgroundMusic, setHitSound, setSuccessSound } = useAudio();
  const { initGame } = usePuzznic();

  // Initialize sounds and game
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
    
    return () => {
      backgroundMusic.pause();
      hitSound.pause();
      successSound.pause();
    };
  }, [setBackgroundMusic, setHitSound, setSuccessSound, initGame]);

  // Update dimensions on window resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    // Set initial dimensions
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const { gamePhase } = usePuzznic();
  
  // Calculate game area width, accounting for the score panel on the left
  // We'll reserve about 100px for the score panel
  const SCORE_PANEL_WIDTH = 100;

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {gamePhase !== "editing" && (
        <>
          {/* Position the game board with a left margin to account for the score panel */}
          <div className="ml-[100px]">
            <Board2D 
              width={dimensions.width - SCORE_PANEL_WIDTH} 
              height={dimensions.height} 
            />
          </div>
          <KeyboardController />
          <TouchController />
          <GameUI2D />
          <SoundManager2D />
        </>
      )}
      <SimpleLevelEditor />
    </div>
  );
}