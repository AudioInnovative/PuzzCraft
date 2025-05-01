import React, { useCallback, useEffect, useRef } from 'react';
import { usePuzznic } from '../../lib/stores/usePuzznic';
import { useAudio } from '../../lib/stores/useAudio';
import { BlockType } from '../../lib/stores/usePuzznic';

// Define block colors based on type (using NES Puzznic color palette)
const blockColors = [
  "#FF0000", // Red
  "#00FF00", // Green
  "#0000FF", // Blue
  "#FFFF00", // Yellow
  "#FF00FF", // Magenta
  "#00FFFF", // Cyan
  "#FF8800", // Orange
  "#8800FF", // Purple
  "#FF00AA", // Pink
  "#00AAFF", // Light Blue
];

// Define block symbols based on original Puzznic
const blockSymbols = ["✚", "■", "●", "×", "★", "◆", "▲", "♦", "◇", "○"];

// Render a single block in NES Puzznic style
function renderBlock(
  ctx: CanvasRenderingContext2D,
  block: BlockType,
  x: number,
  y: number,
  size: number,
  isSelected: boolean,
  animationProgress: number = 0 // Animation progress from 0 to 1 for falling
) {
  // Apply selection effect
  const blockSize = isSelected ? size * 1.1 : size * 0.95;
  
  // Calculate position with animation if block is falling
  let blockX = x + (size - blockSize) / 2;
  let blockY = y + (size - blockSize) / 2;
  
  // If block is falling, animate its position
  if (block.falling && animationProgress > 0) {
    // Animate from the position above to current position
    blockY = (y - size) + (size * animationProgress) + (size - blockSize) / 2;
  }
  
  // Set opacity for matched blocks
  ctx.globalAlpha = block.matched ? 0.5 : 1.0;
  
  // Draw block shadow if selected
  if (isSelected) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(blockX - 2, blockY - 2, blockSize + 4, blockSize + 4);
  }
  
  // Check if this is a floor block
  if (block.isFloor) {
    // Draw floor block with a gray color (like NES Puzznic)
    ctx.fillStyle = '#BBBBBB'; // Light gray
    ctx.fillRect(blockX, blockY, blockSize, blockSize);
    
    // Add grid lines to match NES floor blocks
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = 1;
    
    // Draw grid pattern
    const gridSize = blockSize / 4;
    for (let i = 1; i < 4; i++) {
      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(blockX, blockY + i * gridSize);
      ctx.lineTo(blockX + blockSize, blockY + i * gridSize);
      ctx.stroke();
      
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(blockX + i * gridSize, blockY);
      ctx.lineTo(blockX + i * gridSize, blockY + blockSize);
      ctx.stroke();
    }
    
    // Border
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    ctx.strokeRect(blockX, blockY, blockSize, blockSize);
  } else if (block.isFixed && !block.isFloor) {
    // Wall blocks - blue/gray like in NES Puzznic
    ctx.fillStyle = '#6688AA'; // Blue-gray
    ctx.fillRect(blockX, blockY, blockSize, blockSize);
    
    // Add subtle texture to wall blocks
    const lineSize = blockSize / 4;
    ctx.strokeStyle = '#556677';
    ctx.lineWidth = 1;
    
    for (let i = 1; i < 4; i++) {
      // Horizontal lines only - like the original
      ctx.beginPath();
      ctx.moveTo(blockX, blockY + i * lineSize);
      ctx.lineTo(blockX + blockSize, blockY + i * lineSize);
      ctx.stroke();
    }
    
    // Border
    ctx.strokeStyle = '#445566';
    ctx.lineWidth = 2;
    ctx.strokeRect(blockX, blockY, blockSize, blockSize);
  } else {
    // Regular game blocks
    // Get color based on block type (1-indexed)
    const color = blockColors[(block.type - 1) % blockColors.length];
    const symbol = blockSymbols[(block.type - 1) % blockSymbols.length];
    
    // Draw block background (dark version for NES style)
    ctx.fillStyle = color;
    ctx.fillRect(blockX, blockY, blockSize, blockSize);
    
    // Draw highlight (for NES-style bevel effect)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.moveTo(blockX, blockY);
    ctx.lineTo(blockX + blockSize, blockY);
    ctx.lineTo(blockX + blockSize - blockSize/6, blockY + blockSize/6);
    ctx.lineTo(blockX + blockSize/6, blockY + blockSize/6);
    ctx.lineTo(blockX, blockY);
    ctx.fill();
    
    // Draw shadow (for NES-style bevel effect)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.moveTo(blockX, blockY + blockSize);
    ctx.lineTo(blockX + blockSize, blockY + blockSize);
    ctx.lineTo(blockX + blockSize, blockY);
    ctx.lineTo(blockX + blockSize - blockSize/6, blockY + blockSize/6);
    ctx.lineTo(blockX + blockSize - blockSize/6, blockY + blockSize - blockSize/6);
    ctx.lineTo(blockX + blockSize/6, blockY + blockSize - blockSize/6);
    ctx.lineTo(blockX, blockY + blockSize);
    ctx.fill();
    
    // Draw block border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.lineWidth = 2;
    ctx.strokeRect(blockX, blockY, blockSize, blockSize);
    
    // Draw block symbol (with slight shadow for readability)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.font = `bold ${blockSize * 0.5}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, blockX + blockSize / 2 + 2, blockY + blockSize / 2 + 2);
    
    ctx.fillStyle = 'white';
    ctx.fillText(symbol, blockX + blockSize / 2, blockY + blockSize / 2);
  }
  
  // Reset opacity
  ctx.globalAlpha = 1.0;
}

// Render the game board (background and border) in NES Puzznic style
function renderGameBoard(
  ctx: CanvasRenderingContext2D,
  blockSize: number,
  rows: number,
  cols: number
) {
  // Draw blue background (like the original NES Puzznic)
  ctx.fillStyle = '#5588AA'; // Blue background color similar to NES Puzznic
  ctx.fillRect(0, 0, cols * blockSize, rows * blockSize);
  
  // Draw subtle brick pattern in background
  const brickSize = blockSize / 3;
  ctx.strokeStyle = '#4477AA';
  ctx.lineWidth = 1;
  
  // Horizontal brick pattern lines
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // Only draw pattern where there's no block (for a subtle effect)
      const patternX = x * blockSize;
      const patternY = y * blockSize;
      
      // Draw horizontal lines of the brick pattern
      for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(patternX, patternY + i * brickSize);
        ctx.lineTo(patternX + blockSize, patternY + i * brickSize);
        ctx.stroke();
      }
      
      // Draw vertical lines (with offset for brick pattern)
      for (let i = 0; i < 4; i++) {
        // Offset every other row to create brick effect
        const offsetX = (y % 2 === 0) ? 0 : brickSize / 2;
        ctx.beginPath();
        ctx.moveTo(patternX + i * brickSize + offsetX, patternY);
        ctx.lineTo(patternX + i * brickSize + offsetX, patternY + blockSize);
        ctx.stroke();
      }
    }
  }
  
  // Draw board border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, cols * blockSize, rows * blockSize);
}

const BLOCK_SIZE = 60; // Size of each block in pixels
const BOARD_PADDING = 20; // Padding around the board

interface BoardProps {
  width: number;
  height: number;
}

export function Board2D({ width, height }: BoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const animationProgressRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number | null>(null);
  const anyBlocksFallingRef = useRef<boolean>(false);
  
  const { 
    board, 
    currentLevelData,
    gamePhase,
    selectBlock,
    selectedBlockPos,
    currentEditingBlockType,
    placeEditorBlock,
    removeEditorBlock
  } = usePuzznic();
  const { playHit: playHitSound } = useAudio();
  
  // Game board dimensions
  const rows = board.length;
  const cols = board[0]?.length || 0;
  
  // Calculate board dimensions
  const boardWidth = cols * BLOCK_SIZE;
  const boardHeight = rows * BLOCK_SIZE;
  
  // Calculate scaling and offset to center the board in the canvas
  const scale = Math.min(
    (width - BOARD_PADDING * 2) / boardWidth,
    (height - BOARD_PADDING * 2) / boardHeight
  );
  
  const offsetX = (width - boardWidth * scale) / 2;
  const offsetY = (height - boardHeight * scale) / 2;
  
  // Function to get grid coordinates from client coordinates
  const getGridCoordinates = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    // Get position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) / scale - offsetX / scale;
    const y = (clientY - rect.top) / scale - offsetY / scale;
    
    // Convert to grid coordinates
    const gridX = Math.floor(x / BLOCK_SIZE);
    const gridY = Math.floor(y / BLOCK_SIZE);
    
    // Check if valid grid position
    if (gridX >= 0 && gridX < cols && gridY >= 0 && gridY < rows) {
      // Convert from UI y-coordinate (top-down) to game y-coordinate (bottom-up)
      const gameY = rows - gridY - 1;
      return { gridX, gameY };
    }
    
    return null;
  };
  
  // For tracking mouse drag operations
  const dragStartRef = useRef<{ x: number, y: number, gridX: number, gameY: number } | null>(null);
  const mouseMoveThresholdRef = useRef<number>(40); // Increased threshold to prevent accidental/rapid movements
  const lastMoveTimeRef = useRef<number>(0); // To limit how frequently moves can happen
  
  // Function to handle pointer (mouse or touch) events for selection
  const handlePointerSelect = (clientX: number, clientY: number) => {
    const coords = getGridCoordinates(clientX, clientY);
    if (!coords) return;
    
    const { gridX, gameY } = coords;
    
    if (gamePhase === "editing") {
      // In editor mode, clicking places or removes blocks
      const blockExists = board[gameY] && board[gameY][gridX] !== null;
      
      if (blockExists && !board[gameY][gridX]?.isFloor) {
        // Remove existing block if it's not a floor block
        removeEditorBlock(gridX, gameY);
      } else if (!blockExists) {
        // Place new block if position is empty
        placeEditorBlock(gridX, gameY, currentEditingBlockType);
      }
    } else {
      // In regular game mode, select blocks
      selectBlock(gridX, gameY);
      
      // Store drag start position for mouse movement
      dragStartRef.current = {
        x: clientX,
        y: clientY,
        gridX,
        gameY
      };
    }
    
    // Play sound for feedback
    playHitSound();
  };
  
  // Mouse move handler for dragging blocks
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    try {
      // Only handle mouse move if we're in game mode and have a dragging operation
      if (gamePhase !== "playing" || !dragStartRef.current || !selectedBlockPos) return;
      
      // Check if we've moved recently (enforcing a cooldown period)
      const currentTime = Date.now();
      const timeSinceLastMove = currentTime - lastMoveTimeRef.current;
      
      // Don't allow moves more frequently than every 300ms
      if (timeSinceLastMove < 300) return;
      
      const { x: startX } = dragStartRef.current;
      const diffX = e.clientX - startX;
      
      // Check if we've moved enough to trigger a direction
      if (Math.abs(diffX) > mouseMoveThresholdRef.current) {
        // Get current game state safely
        const puzznicState = usePuzznic.getState();
        if (!puzznicState) return;
        
        const { moveSelectedBlock, board } = puzznicState;
        
        // Safety check for selectedBlockPos
        if (!selectedBlockPos) return;
        
        const { x, y } = selectedBlockPos;
        
        // Safety check for board dimensions
        if (!board || !board[y] || y < 0 || y >= board.length) {
          console.warn("Board or row is undefined, or y is out of bounds", y, board?.length);
          return;
        }
        
        try {
          // Safely check if move is valid before attempting it
          if (diffX < 0 && x > 0) {
            // Check if there's space to move left
            if (x-1 >= 0 && board[y][x-1] === null) {
              moveSelectedBlock('left');
              playHitSound();
              lastMoveTimeRef.current = currentTime;
            }
          } else if (diffX > 0 && x < cols - 1) {
            // Check if there's space to move right
            if (x+1 < board[y].length && board[y][x+1] === null) {
              moveSelectedBlock('right');
              playHitSound();
              lastMoveTimeRef.current = currentTime;
            }
          }
        } catch (error) {
          console.error("Error checking move validity:", error);
          // Reset drag operation on error
          dragStartRef.current = null;
          return;
        }
        
        // Reset drag start to current position to allow continuous dragging
        dragStartRef.current = {
          ...dragStartRef.current,
          x: e.clientX
        };
      }
    } catch (error) {
      console.error("Error in handleMouseMove:", error);
      // Reset drag operation on any error
      dragStartRef.current = null;
    }
  };
  
  // Handle mouse up to reset drag operation
  const handleMouseUp = () => {
    dragStartRef.current = null;
  };
  
  // Handle mouse leaving canvas to reset drag operation
  const handleMouseLeave = () => {
    dragStartRef.current = null;
  };
  
  // Handle mouse click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handlePointerSelect(e.clientX, e.clientY);
  };
  
  // For long press detection (to restart level on mobile)
  const touchTimeout = useRef<NodeJS.Timeout | null>(null);
  const LONG_PRESS_DURATION = 800; // milliseconds
  
  // Handle touch start event
  const handleCanvasTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      // Prevent scrolling when touching the canvas
      e.preventDefault();
      
      // Handle block selection
      handlePointerSelect(e.touches[0].clientX, e.touches[0].clientY);
      
      // Set up long press detection
      if (touchTimeout.current) {
        clearTimeout(touchTimeout.current);
      }
      
      touchTimeout.current = setTimeout(() => {
        // Long press detected - restart level
        const { restartLevel } = usePuzznic.getState();
        restartLevel();
        // Provide visual/audio feedback that restart occurred
        playHitSound();
      }, LONG_PRESS_DURATION);
    }
  };
  
  // Handle touch end/cancel to clear the timeout
  const handleTouchEnd = () => {
    if (touchTimeout.current) {
      clearTimeout(touchTimeout.current);
      touchTimeout.current = null;
    }
  };
  
  // Function to render the current game state with animations
  const renderGameState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Apply scaling and translation to center the board
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    
    // Render game board background and border only
    renderGameBoard(ctx, BLOCK_SIZE, rows, cols);
    
    // Render blocks
    board.forEach((row, y) => {
      row.forEach((block, x) => {
        if (block) {
          // Convert from game y-coordinate (bottom-up) to UI y-coordinate (top-down)
          const uiY = rows - y - 1;
          renderBlock(
            ctx, 
            block, 
            x * BLOCK_SIZE, 
            uiY * BLOCK_SIZE, 
            BLOCK_SIZE,
            selectedBlockPos?.x === x && selectedBlockPos?.y === y,
            animationProgressRef.current // Pass animation progress
          );
        }
      });
    });
    
    ctx.restore();
  }, [board, width, height, offsetX, offsetY, scale, rows, cols, selectedBlockPos]);

  // Animation loop for smooth falling blocks
  const animateBlocks = useCallback((timestamp: number) => {
    if (!lastFrameTimeRef.current) {
      lastFrameTimeRef.current = timestamp;
    }
    
    const elapsed = timestamp - lastFrameTimeRef.current;
    const ANIMATION_DURATION = 200; // 200ms for the falling animation
    
    // Update animation progress
    animationProgressRef.current += elapsed / ANIMATION_DURATION;
    
    // Check if any blocks are falling
    anyBlocksFallingRef.current = board.some(row => 
      row.some(block => block?.falling)
    );
    
    // If animation is complete or no blocks are falling, reset
    if (animationProgressRef.current >= 1 || !anyBlocksFallingRef.current) {
      animationProgressRef.current = 0;
      lastFrameTimeRef.current = null;
      
      // If no blocks are falling, stop the animation loop
      if (!anyBlocksFallingRef.current) {
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }
    } else {
      // Otherwise update last frame time
      lastFrameTimeRef.current = timestamp;
    }
    
    // Render the current state
    renderGameState();
    
    // Continue the animation loop
    animationFrameRef.current = requestAnimationFrame(animateBlocks);
  }, [board, renderGameState]);
  
  // Start animation when blocks start falling
  useEffect(() => {
    // Check if any blocks are falling
    const blocksFalling = board.some(row => 
      row.some(block => block?.falling)
    );
    
    // Start animation if blocks are falling and animation isn't already running
    if (blocksFalling && animationFrameRef.current === null) {
      animationProgressRef.current = 0;
      lastFrameTimeRef.current = null;
      animationFrameRef.current = requestAnimationFrame(animateBlocks);
    } 
    
    // Initial render if no animation
    if (!blocksFalling) {
      renderGameState();
    }
    
    // Cleanup animation on unmount
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [board, animateBlocks, renderGameState]);
  
  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleCanvasTouch}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{ 
        width: '100%', 
        height: '100%',
        background: '#000000', // Black background like NES games
        touchAction: 'none', // Prevent browser handling of touch gestures (like scrolling)
        cursor: selectedBlockPos ? 'move' : 'pointer' // Show move cursor when a block is selected
      }}
    />
  );
}