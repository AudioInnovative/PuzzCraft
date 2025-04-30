import { useFrame } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import { Controls } from "../../lib/controls";
import { usePuzznic } from "../../lib/stores/usePuzznic";
import { Block } from "./Block";
import { Level } from "./Level";
import { useEffect, useRef } from "react";
import { useAudio } from "../../lib/stores/useAudio";
import * as THREE from "three";

export function Board() {
  const { 
    board, 
    gamePhase, 
    selectedBlockPos,
    selectBlock,
    moveSelectedBlock,
    startGame,
    restartLevel,
    nextLevel
  } = usePuzznic();
  
  const leftPressed = useKeyboardControls<Controls>(state => state.left);
  const rightPressed = useKeyboardControls<Controls>(state => state.right);
  const selectPressed = useKeyboardControls<Controls>(state => state.select);
  const restartPressed = useKeyboardControls<Controls>(state => state.restart);
  const nextLevelPressed = useKeyboardControls<Controls>(state => state.nextLevel);
  
  const { playHit } = useAudio();
  
  // Refs for control handling
  const leftPressedRef = useRef(false);
  const rightPressedRef = useRef(false);
  const selectPressedRef = useRef(false);
  const restartPressedRef = useRef(false);
  const nextLevelPressedRef = useRef(false);
  
  // Start the game when ready
  useEffect(() => {
    if (gamePhase === "ready") {
      startGame();
    }
  }, [gamePhase, startGame]);
  
  // Handle keyboard inputs with debouncing
  useFrame(() => {
    // Handle restart level
    if (restartPressed && !restartPressedRef.current) {
      restartPressedRef.current = true;
      restartLevel();
      playHit();
    } else if (!restartPressed && restartPressedRef.current) {
      restartPressedRef.current = false;
    }
    
    // Handle next level in level complete or game won states
    if ((gamePhase === "level_complete" || gamePhase === "game_over" || gamePhase === "game_won") && 
        nextLevelPressed && !nextLevelPressedRef.current) {
      nextLevelPressedRef.current = true;
      nextLevel();
      playHit();
    } else if (!nextLevelPressed && nextLevelPressedRef.current) {
      nextLevelPressedRef.current = false;
    }
    
    // Only handle other controls during gameplay
    if (gamePhase !== "playing") return;
    
    // Handle left movement
    if (leftPressed && !leftPressedRef.current && selectedBlockPos) {
      leftPressedRef.current = true;
      moveSelectedBlock('left');
      playHit();
    } else if (!leftPressed && leftPressedRef.current) {
      leftPressedRef.current = false;
    }
    
    // Handle right movement
    if (rightPressed && !rightPressedRef.current && selectedBlockPos) {
      rightPressedRef.current = true;
      moveSelectedBlock('right');
      playHit();
    } else if (!rightPressed && rightPressedRef.current) {
      rightPressedRef.current = false;
    }
    
    // Handle block selection
    if (selectPressed && !selectPressedRef.current) {
      selectPressedRef.current = true;
      
      if (selectedBlockPos) {
        // Deselect if already selected
        selectBlock(-1, -1); // Invalid position to clear selection
      } else {
        // Select the first movable block if none selected
        for (let y = 0; y < board.length; y++) {
          for (let x = 0; x < board[0].length; x++) {
            if (board[y][x] !== null && !board[y][x]!.matched && !board[y][x]!.falling) {
              selectBlock(x, y);
              playHit();
              break;
            }
          }
        }
      }
    } else if (!selectPressed && selectPressedRef.current) {
      selectPressedRef.current = false;
    }
  });
  
  return (
    <group>
      {/* Level background and walls */}
      <Level />
      
      {/* Render blocks */}
      {board.map((row, y) => 
        row.map((block, x) => 
          block !== null ? (
            <Block 
              key={`${block.id}`}
              block={block}
              position={[x - 3.5, board.length - y - 1, 0]}
              onClick={() => {
                selectBlock(x, y);
                playHit();
              }}
            />
          ) : null
        )
      )}
    </group>
  );
}
