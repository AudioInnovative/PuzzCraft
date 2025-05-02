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
  const { 
    setBackgroundMusic, 
    setHitSound, 
    setSuccessSound,
    setMoveSound,
    setMatchSound,
    setFallSound
  } = useAudio();
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
    
    // New sound effects with appropriate volumes
    const moveSound = new Audio("/sounds/move.mp3");
    moveSound.volume = 0.15; // Quieter click for moving blocks
    
    const matchSound = new Audio("/sounds/match.mp3");
    matchSound.volume = 0.3; // Medium volume for matching blocks
    
    const fallSound = new Audio("/sounds/fall.mp3");
    fallSound.volume = 0.2; // Lower volume for falling blocks
    
    // Set the audio in the store
    setBackgroundMusic(backgroundMusic);
    setHitSound(hitSound);
    setSuccessSound(successSound);
    setMoveSound(moveSound);
    setMatchSound(matchSound);
    setFallSound(fallSound);
    
    // Initialize game
    initGame();
    
    return () => {
      backgroundMusic.pause();
      hitSound.pause();
      successSound.pause();
      moveSound.pause();
      matchSound.pause();
      fallSound.pause();
    };
  }, [setBackgroundMusic, setHitSound, setSuccessSound, setMoveSound, setMatchSound, setFallSound, initGame]);

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