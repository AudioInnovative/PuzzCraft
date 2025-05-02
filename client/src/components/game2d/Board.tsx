import React, { useCallback, useEffect, useRef } from 'react';
import { usePuzznic } from '../../lib/stores/usePuzznic';
import { useAudio } from '../../lib/stores/useAudio';
import { BlockType } from '../../lib/stores/usePuzznic';

// Define block colors based on type (using a modern gradient palette)
const blockColors = [
  "#FF5252", // Modern Red
  "#4CAF50", // Modern Green
  "#448AFF", // Modern Blue
  "#FFC107", // Modern Amber
  "#E040FB", // Modern Purple
  "#18FFFF", // Modern Cyan
  "#FF9800", // Modern Orange
  "#7C4DFF", // Modern Deep Purple
  "#F50057", // Modern Pink
  "#00B0FF", // Modern Light Blue
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
  
  // Reset shadow properties before drawing each block
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
  // Draw block shadow/glow if selected
  if (isSelected) {
    // Bright glow for selected blocks
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  } else {
    // Subtle shadow for regular blocks
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
  }
  
  // Simply check if this is a floor block (type 1)
  if (block.type === 1) {
    // Use modern version of floor blocks with rounded corners
    let radius = blockSize * 0.15; // Same radius as other blocks for consistency
    
    // Draw floor block with a gray color (modernized)
    ctx.fillStyle = '#BBBBBB'; // Light gray
    
    // Draw with rounded corners
    ctx.beginPath();
    ctx.moveTo(blockX + radius, blockY);
    ctx.lineTo(blockX + blockSize - radius, blockY);
    ctx.quadraticCurveTo(blockX + blockSize, blockY, blockX + blockSize, blockY + radius);
    ctx.lineTo(blockX + blockSize, blockY + blockSize - radius);
    ctx.quadraticCurveTo(blockX + blockSize, blockY + blockSize, blockX + blockSize - radius, blockY + blockSize);
    ctx.lineTo(blockX + radius, blockY + blockSize);
    ctx.quadraticCurveTo(blockX, blockY + blockSize, blockX, blockY + blockSize - radius);
    ctx.lineTo(blockX, blockY + radius);
    ctx.quadraticCurveTo(blockX, blockY, blockX + radius, blockY);
    ctx.closePath();
    ctx.fill();
    
    // Add subtle gradient
    const gradient = ctx.createLinearGradient(blockX, blockY, blockX, blockY + blockSize);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(blockX + radius, blockY);
    ctx.lineTo(blockX + blockSize - radius, blockY);
    ctx.quadraticCurveTo(blockX + blockSize, blockY, blockX + blockSize, blockY + radius);
    ctx.lineTo(blockX + blockSize, blockY + blockSize - radius);
    ctx.quadraticCurveTo(blockX + blockSize, blockY + blockSize, blockX + blockSize - radius, blockY + blockSize);
    ctx.lineTo(blockX + radius, blockY + blockSize);
    ctx.quadraticCurveTo(blockX, blockY + blockSize, blockX, blockY + blockSize - radius);
    ctx.lineTo(blockX, blockY + radius);
    ctx.quadraticCurveTo(blockX, blockY, blockX + radius, blockY);
    ctx.closePath();
    ctx.fill();
    
    // Add grid lines to match floor blocks (but more subtle)
    ctx.strokeStyle = 'rgba(153, 153, 153, 0.5)';
    ctx.lineWidth = 0.5;
    
    // Draw grid pattern
    const gridSize = blockSize / 4;
    
    // Use clipping to ensure grid lines don't extend beyond rounded corners
    ctx.save();
    ctx.clip();
    
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
    
    ctx.restore();
    
    // Border
    ctx.strokeStyle = 'rgba(102, 102, 102, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(blockX + radius, blockY);
    ctx.lineTo(blockX + blockSize - radius, blockY);
    ctx.quadraticCurveTo(blockX + blockSize, blockY, blockX + blockSize, blockY + radius);
    ctx.lineTo(blockX + blockSize, blockY + blockSize - radius);
    ctx.quadraticCurveTo(blockX + blockSize, blockY + blockSize, blockX + blockSize - radius, blockY + blockSize);
    ctx.lineTo(blockX + radius, blockY + blockSize);
    ctx.quadraticCurveTo(blockX, blockY + blockSize, blockX, blockY + blockSize - radius);
    ctx.lineTo(blockX, blockY + radius);
    ctx.quadraticCurveTo(blockX, blockY, blockX + radius, blockY);
    ctx.closePath();
    ctx.stroke();
  } else if (block.isFixed && block.type !== 1) {
    // Wall blocks with modern style
    let radius = blockSize * 0.15; // Same radius as other blocks
    
    // Draw wall block with rounded corners
    ctx.fillStyle = '#6688AA'; // Blue-gray color
    
    ctx.beginPath();
    ctx.moveTo(blockX + radius, blockY);
    ctx.lineTo(blockX + blockSize - radius, blockY);
    ctx.quadraticCurveTo(blockX + blockSize, blockY, blockX + blockSize, blockY + radius);
    ctx.lineTo(blockX + blockSize, blockY + blockSize - radius);
    ctx.quadraticCurveTo(blockX + blockSize, blockY + blockSize, blockX + blockSize - radius, blockY + blockSize);
    ctx.lineTo(blockX + radius, blockY + blockSize);
    ctx.quadraticCurveTo(blockX, blockY + blockSize, blockX, blockY + blockSize - radius);
    ctx.lineTo(blockX, blockY + radius);
    ctx.quadraticCurveTo(blockX, blockY, blockX + radius, blockY);
    ctx.closePath();
    ctx.fill();
    
    // Add subtle gradient
    const gradient = ctx.createLinearGradient(blockX, blockY, blockX, blockY + blockSize);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(blockX + radius, blockY);
    ctx.lineTo(blockX + blockSize - radius, blockY);
    ctx.quadraticCurveTo(blockX + blockSize, blockY, blockX + blockSize, blockY + radius);
    ctx.lineTo(blockX + blockSize, blockY + blockSize - radius);
    ctx.quadraticCurveTo(blockX + blockSize, blockY + blockSize, blockX + blockSize - radius, blockY + blockSize);
    ctx.lineTo(blockX + radius, blockY + blockSize);
    ctx.quadraticCurveTo(blockX, blockY + blockSize, blockX, blockY + blockSize - radius);
    ctx.lineTo(blockX, blockY + radius);
    ctx.quadraticCurveTo(blockX, blockY, blockX + radius, blockY);
    ctx.closePath();
    ctx.fill();
    
    // Add texture lines to wall blocks (but clipped to the rounded shape)
    const lineSize = blockSize / 4;
    ctx.strokeStyle = 'rgba(85, 102, 119, 0.6)';
    ctx.lineWidth = 0.8;
    
    // Use clipping to ensure lines don't extend beyond rounded corners
    ctx.save();
    ctx.clip();
    
    for (let i = 1; i < 4; i++) {
      // Horizontal lines only - like the original
      ctx.beginPath();
      ctx.moveTo(blockX, blockY + i * lineSize);
      ctx.lineTo(blockX + blockSize, blockY + i * lineSize);
      ctx.stroke();
    }
    
    ctx.restore();
    
    // Border
    ctx.strokeStyle = 'rgba(68, 85, 102, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(blockX + radius, blockY);
    ctx.lineTo(blockX + blockSize - radius, blockY);
    ctx.quadraticCurveTo(blockX + blockSize, blockY, blockX + blockSize, blockY + radius);
    ctx.lineTo(blockX + blockSize, blockY + blockSize - radius);
    ctx.quadraticCurveTo(blockX + blockSize, blockY + blockSize, blockX + blockSize - radius, blockY + blockSize);
    ctx.lineTo(blockX + radius, blockY + blockSize);
    ctx.quadraticCurveTo(blockX, blockY + blockSize, blockX, blockY + blockSize - radius);
    ctx.lineTo(blockX, blockY + radius);
    ctx.quadraticCurveTo(blockX, blockY, blockX + radius, blockY);
    ctx.closePath();
    ctx.stroke();
  } else {
    // Regular game blocks
    // Get color based on block type (1-indexed)
    const color = blockColors[(block.type - 1) % blockColors.length];
    const symbol = blockSymbols[(block.type - 1) % blockSymbols.length];
    
    // Draw block with rounded corners for modern look
    let radius = blockSize * 0.15; // Rounded corner radius
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(blockX + radius, blockY);
    ctx.lineTo(blockX + blockSize - radius, blockY);
    ctx.quadraticCurveTo(blockX + blockSize, blockY, blockX + blockSize, blockY + radius);
    ctx.lineTo(blockX + blockSize, blockY + blockSize - radius);
    ctx.quadraticCurveTo(blockX + blockSize, blockY + blockSize, blockX + blockSize - radius, blockY + blockSize);
    ctx.lineTo(blockX + radius, blockY + blockSize);
    ctx.quadraticCurveTo(blockX, blockY + blockSize, blockX, blockY + blockSize - radius);
    ctx.lineTo(blockX, blockY + radius);
    ctx.quadraticCurveTo(blockX, blockY, blockX + radius, blockY);
    ctx.closePath();
    ctx.fill();
    
    // Draw modern subtle gradient overlay instead of bevel
    const gradient = ctx.createLinearGradient(blockX, blockY, blockX, blockY + blockSize);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
    
    // Apply gradient with rounded corners
    ctx.fillStyle = gradient;
    ctx.beginPath();
    // Using the same radius as defined above
    ctx.moveTo(blockX + radius, blockY);
    ctx.lineTo(blockX + blockSize - radius, blockY);
    ctx.quadraticCurveTo(blockX + blockSize, blockY, blockX + blockSize, blockY + radius);
    ctx.lineTo(blockX + blockSize, blockY + blockSize - radius);
    ctx.quadraticCurveTo(blockX + blockSize, blockY + blockSize, blockX + blockSize - radius, blockY + blockSize);
    ctx.lineTo(blockX + radius, blockY + blockSize);
    ctx.quadraticCurveTo(blockX, blockY + blockSize, blockX, blockY + blockSize - radius);
    ctx.lineTo(blockX, blockY + radius);
    ctx.quadraticCurveTo(blockX, blockY, blockX + radius, blockY);
    ctx.closePath();
    ctx.fill();
    
    // Draw border with rounded corners
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(blockX + radius, blockY);
    ctx.lineTo(blockX + blockSize - radius, blockY);
    ctx.quadraticCurveTo(blockX + blockSize, blockY, blockX + blockSize, blockY + radius);
    ctx.lineTo(blockX + blockSize, blockY + blockSize - radius);
    ctx.quadraticCurveTo(blockX + blockSize, blockY + blockSize, blockX + blockSize - radius, blockY + blockSize);
    ctx.lineTo(blockX + radius, blockY + blockSize);
    ctx.quadraticCurveTo(blockX, blockY + blockSize, blockX, blockY + blockSize - radius);
    ctx.lineTo(blockX, blockY + radius);
    ctx.quadraticCurveTo(blockX, blockY, blockX + radius, blockY);
    ctx.closePath();
    ctx.stroke();
    
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

// Render the game board (background and border) in modern style
function renderGameBoard(
  ctx: CanvasRenderingContext2D,
  blockSize: number,
  rows: number,
  cols: number
) {
  // Create modern gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, rows * blockSize);
  gradient.addColorStop(0, '#4A7DA5'); // Darker blue at top
  gradient.addColorStop(1, '#86B5D9'); // Lighter blue at bottom
  
  // Apply gradient to background
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, cols * blockSize, rows * blockSize);
  
  // Add subtle patterns for depth
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; // Very subtle white lines
  ctx.lineWidth = 0.5;
  
  // Draw a modern grid pattern
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const patternX = x * blockSize;
      const patternY = y * blockSize;
      
      // Draw grid dots instead of full lines for a more modern look
      const dotSpacing = blockSize / 8;
      
      for (let i = 1; i < 8; i += 2) {
        for (let j = 1; j < 8; j += 2) {
          ctx.beginPath();
          ctx.arc(
            patternX + i * dotSpacing, 
            patternY + j * dotSpacing, 
            0.5, 0, Math.PI * 2
          );
          ctx.fill();
        }
      }
    }
  }
  
  // Draw a more modern border with rounded corners and shadow
  const borderWidth = 3;
  const borderRadius = 8;
  
  // Add shadow to the board
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 15;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 5;
  
  // Draw border as a filled rounded rectangle slightly bigger than the board
  ctx.fillStyle = '#2D5F88';
  ctx.beginPath();
  ctx.moveTo(borderRadius, 0);
  ctx.lineTo(cols * blockSize - borderRadius, 0);
  ctx.quadraticCurveTo(cols * blockSize, 0, cols * blockSize, borderRadius);
  ctx.lineTo(cols * blockSize, rows * blockSize - borderRadius);
  ctx.quadraticCurveTo(cols * blockSize, rows * blockSize, cols * blockSize - borderRadius, rows * blockSize);
  ctx.lineTo(borderRadius, rows * blockSize);
  ctx.quadraticCurveTo(0, rows * blockSize, 0, rows * blockSize - borderRadius);
  ctx.lineTo(0, borderRadius);
  ctx.quadraticCurveTo(0, 0, borderRadius, 0);
  ctx.closePath();
  ctx.stroke();
  
  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
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
  const mouseMoveThresholdRef = useRef<number>(15); // Moderate threshold for intentional movement
  const lastMoveTimeRef = useRef<number>(0); // To limit how frequently moves can happen
  
  // Function to handle pointer (mouse or touch) events for selection
  const handlePointerSelect = (clientX: number, clientY: number) => {
    const coords = getGridCoordinates(clientX, clientY);
    if (!coords) return;
    
    const { gridX, gameY } = coords;
    
    if (gamePhase === "editing") {
      // In editor mode, clicking places or removes blocks
      const blockExists = board[gameY] && board[gameY][gridX] !== null;
      
      if (blockExists) {
        // Remove existing block (all blocks can be removed in editor)
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
    // Only handle mouse move if we're in game mode and have a dragging operation
    if (gamePhase !== "playing" || !dragStartRef.current || !selectedBlockPos) return;
    
    // Check if we've moved recently (enforcing a cooldown period)
    const currentTime = Date.now();
    const timeSinceLastMove = currentTime - lastMoveTimeRef.current;
    
    // Don't allow moves more frequently than every 500ms to ensure one space at a time
    if (timeSinceLastMove < 500) return;
    
    const { x: startX } = dragStartRef.current;
    const diffX = e.clientX - startX;
    
    // Check if we've moved enough to trigger a direction
    if (Math.abs(diffX) > mouseMoveThresholdRef.current) {
      const { moveSelectedBlock } = usePuzznic.getState();
      const { x, y } = selectedBlockPos;
      
      if (diffX < 0) {
        // Move left
        moveSelectedBlock('left');
        playHitSound();
      } else {
        // Move right
        moveSelectedBlock('right');
        playHitSound();
      }
      
      // Update last move time - longer delay forces user to re-drag for next move
      lastMoveTimeRef.current = currentTime;
      
      // Reset drag - this forces the user to release mouse and drag again for another move
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