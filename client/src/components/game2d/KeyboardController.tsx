import { useEffect, useRef } from 'react';
import { usePuzznic } from '../../lib/stores/usePuzznic';
import { useAudio } from '../../lib/stores/useAudio';
import { Controls } from '../../lib/controls';

export function KeyboardController() {
  const {
    gamePhase,
    selectedBlockPos,
    selectBlock,
    moveSelectedBlock,
    restartLevel,
    nextLevel,
    board
  } = usePuzznic();
  
  const { playHit } = useAudio();

  // Track key states to prevent key repeat
  const keyStates = useRef<{ [key: string]: boolean }>({
    [Controls.left]: false,
    [Controls.right]: false,
    [Controls.select]: false,
    [Controls.restart]: false,
    [Controls.nextLevel]: false
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Map key codes to controls
      let control: Controls | null = null;
      
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        control = Controls.left;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        control = Controls.right;
      } else if (e.code === 'Space' || e.code === 'Enter') {
        control = Controls.select;
      } else if (e.code === 'KeyR') {
        control = Controls.restart;
      } else if (e.code === 'KeyN') {
        control = Controls.nextLevel;
      }
      
      // If key is already pressed, ignore
      if (!control || keyStates.current[control]) return;
      
      // Mark key as pressed
      keyStates.current[control] = true;
      
      // Handle control
      switch (control) {
        case Controls.restart:
          restartLevel();
          playHit();
          break;
          
        case Controls.nextLevel:
          if (gamePhase === 'level_complete' || gamePhase === 'game_over' || gamePhase === 'game_won') {
            nextLevel();
            playHit();
          }
          break;
          
        case Controls.left:
          if (gamePhase === 'playing' && selectedBlockPos) {
            moveSelectedBlock('left');
            playHit();
          }
          break;
          
        case Controls.right:
          if (gamePhase === 'playing' && selectedBlockPos) {
            moveSelectedBlock('right');
            playHit();
          }
          break;
          
        case Controls.select:
          if (gamePhase === 'playing') {
            if (selectedBlockPos) {
              // Deselect if already selected
              selectBlock(-1, -1);
            } else {
              // Select the first movable block if none selected
              for (let y = 0; y < board.length; y++) {
                for (let x = 0; x < board[0].length; x++) {
                  if (board[y][x] !== null && !board[y][x]!.matched && !board[y][x]!.falling) {
                    selectBlock(x, y);
                    playHit();
                    return;
                  }
                }
              }
            }
          }
          break;
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      // Map key codes to controls
      let control: Controls | null = null;
      
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        control = Controls.left;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        control = Controls.right;
      } else if (e.code === 'Space' || e.code === 'Enter') {
        control = Controls.select;
      } else if (e.code === 'KeyR') {
        control = Controls.restart;
      } else if (e.code === 'KeyN') {
        control = Controls.nextLevel;
      }
      
      // If valid control, mark as released
      if (control) {
        keyStates.current[control] = false;
      }
    };
    
    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    gamePhase, 
    selectedBlockPos, 
    selectBlock, 
    moveSelectedBlock, 
    restartLevel, 
    nextLevel, 
    board,
    playHit
  ]);
  
  // This component doesn't render anything
  return null;
}