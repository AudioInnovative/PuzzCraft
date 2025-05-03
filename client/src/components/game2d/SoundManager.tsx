import { useEffect } from "react";
import { useAudio } from "../../lib/stores/useAudio";
import { usePuzznic } from "../../lib/stores/usePuzznic";

export default function SoundManager2D() {
  const { 
    backgroundMusic, 
    playSuccess,
    playMove,
    playMatch,
    playFall
  } = useAudio();
  
  const { 
    gamePhase,
    board,
    moveCount
  } = usePuzznic();
  
  // Play background music when game starts
  useEffect(() => {
    if (backgroundMusic) {
      if (gamePhase === "playing") {
        backgroundMusic.play().catch(err => {
          console.log("Failed to play background music:", err);
        });
      } else {
        backgroundMusic.pause();
      }
    }
    
    return () => {
      if (backgroundMusic) {
        backgroundMusic.pause();
      }
    };
  }, [backgroundMusic, gamePhase]);
  
  // Play success sound on level complete
  useEffect(() => {
    if (gamePhase === "level_complete" || gamePhase === "game_won") {
      playSuccess();
    }
  }, [gamePhase, playSuccess]);
  
  // Monitor move count to play move sound
  useEffect(() => {
    // Only play if not the initial state and game is active
    if (moveCount > 0 && gamePhase === "playing") {
      playMove();
    }
  }, [moveCount, gamePhase, playMove]);
  
  // Monitor board for matching and falling
  useEffect(() => {
    // Check if any blocks are matched
    let hasMatch = false;
    let hasFalling = false;
    
    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board[0].length; x++) {
        if (board[y][x] !== null) {
          if (board[y][x]!.matched) {
            hasMatch = true;
            break;
          }
          if (board[y][x]!.falling) {
            hasFalling = true;
            break;
          }
        }
      }
      if (hasMatch || hasFalling) break;
    }
    
    if (hasMatch && gamePhase === "playing") {
      playMatch();
    }
    
    // Falling sound disabled per user request
    // if (hasFalling && gamePhase === "playing") {
    //   playFall();
    // }
  }, [board, gamePhase, playMatch, playFall]);
  
  return (
    <div />
  );
}