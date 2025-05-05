import { useEffect, useState, useRef } from 'react';
import { Board2D } from './Board';
import GameUI2D from './GameUI';
import { KeyboardController } from './KeyboardController';
import { TouchController } from './TouchController';
import SoundManager2D from './SoundManager';
import SimpleLevelEditor from './SimpleLevelEditor';
import SoundControlMenu from './SoundControlMenu';
import { useAudio } from '../../lib/stores/useAudio';
import { usePuzznic } from '../../lib/stores/usePuzznic';

export default function Game2D() {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [showSoundMenu, setShowSoundMenu] = useState(false);
  const { 
    setBackgroundMusic, 
    setHitSound, 
    setSuccessSound,
    setMoveSound,
    setMatchSound,
    setFallSound
  } = useAudio();
  const { initGame, gamePhase, board, updateMovingGroundBlocks } = usePuzznic();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize sounds and game
  useEffect(() => {
    // --- BACKGROUND MUSIC CYCLING ---
    // List of background music files
    const backgroundTracks = [
      "/sounds/Background/Echoes of the Heroic Heart.mp3",
      "/sounds/Background/Eternal Drift.mp3",
      "/sounds/Background/PuzzCraft bg.mp3"
    ];
    let currentTrackIndex = 0;
    let backgroundMusic = new Audio(backgroundTracks[currentTrackIndex]);
    backgroundMusic.volume = 0.075; // 50% lower than before
    backgroundMusic.loop = false;

    // Function to play next track
    const playNextTrack = () => {
      currentTrackIndex = (currentTrackIndex + 1) % backgroundTracks.length;
      backgroundMusic.src = backgroundTracks[currentTrackIndex];
      backgroundMusic.currentTime = 0;
      backgroundMusic.play();
    };

    // When a track ends, play the next one
    backgroundMusic.addEventListener('ended', playNextTrack);

    // --- END BACKGROUND MUSIC CYCLING ---

    // Load audio elements
    const hitSound = new Audio("/sounds/hit.mp3");
    hitSound.volume = 0.5;
    
    const successSound = new Audio("/sounds/success.mp3");
    successSound.volume = 0.15; // Significantly reduced volume for success sound
    
    // New sound effects with appropriate volumes
    const moveSound = new Audio("/sounds/move.mp3");
    moveSound.volume = 0.15; // Quieter click for moving blocks
    
    // We're creating a dummy audio element for TypeScript compatibility
    // But we'll use Web Audio API for the actual sound
    const dummyAudio = new Audio();
    const matchSound = dummyAudio;
    
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
      backgroundMusic.removeEventListener('ended', playNextTrack);
      hitSound.pause();
      successSound.pause();
      moveSound.pause();
      matchSound.pause();
      fallSound.pause();
    };
  }, [setBackgroundMusic, setHitSound, setSuccessSound, setMoveSound, setMatchSound, setFallSound, initGame]);

  useEffect(() => {
    if (gamePhase !== "playing") {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      // Only update if there are elevators present
      const hasElevator = board.some(row =>
        row.some(
          block => block && (block.type === 9 || block.isMovingGround)
        )
      );
      if (hasElevator) {
        // Use the new Zustand action for elevator movement
        usePuzznic.getState().moveElevatorsAndUpdateBoard();
      }
    }, 300); // Elevator movement interval (ms)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [gamePhase, board]);

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

  // Calculate game area width, accounting for the score panel on the left
  // We'll reserve about 100px for the score panel
  const SCORE_PANEL_WIDTH = 100;

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <button
        style={{
          position: 'absolute', bottom: 20, right: 20, zIndex: 1100, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#252542', color: '#fff', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px #0004'
        }}
        onClick={() => setShowSoundMenu((v) => !v)}
      >
        {showSoundMenu ? 'Close Sound Menu' : 'Sound Settings'}
      </button>
      {showSoundMenu && <SoundControlMenu />}
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