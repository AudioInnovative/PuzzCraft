import React, { useEffect, useRef } from 'react';
import { usePuzznic } from '../../lib/stores/usePuzznic';
import { useAudio } from '../../lib/stores/useAudio';
import { BlockType } from '../../lib/stores/usePuzznic';

// Define block colors based on type
const blockColors = [
  "#FF0000", // Red
  "#00FF00", // Green
  "#0000FF", // Blue
  "#FFFF00", // Yellow
  "#FF00FF", // Magenta
  "#00FFFF", // Cyan
];

// Define block symbols based on type
const blockSymbols = ["★", "■", "●", "▲", "♦", "✦"];

// Render a single block
function renderBlock(
  ctx: CanvasRenderingContext2D,
  block: BlockType,
  x: number,
  y: number,
  size: number,
  isSelected: boolean
) {
  // Apply selection effect
  const blockSize = isSelected ? size * 1.1 : size * 0.9;
  const blockX = x + (size - blockSize) / 2;
  const blockY = y + (size - blockSize) / 2;
  
  // Set opacity for matched blocks
  ctx.globalAlpha = block.matched ? 0.5 : 1.0;
  
  // Draw block shadow if selected
  if (isSelected) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(blockX + 3, blockY + 3, blockSize, blockSize);
  }
  
  // Check if this is a floor/fixed block
  if (block.isFixed) {
    // Draw fixed blocks (like walls/floor) with a special style
    if (block.type === 1) { // Type 1 is typically a floor block
      // Draw floor block with a wood texture
      ctx.fillStyle = '#8B4513'; // Wood color
      ctx.fillRect(blockX, blockY, blockSize, blockSize);
      
      // Add wood grain lines
      ctx.strokeStyle = '#6B3100';
      ctx.lineWidth = 1;
      
      // Horizontal grain lines
      for (let i = 1; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(blockX, blockY + i * blockSize / 5);
        ctx.lineTo(blockX + blockSize, blockY + i * blockSize / 5);
        ctx.stroke();
      }
      
      // Border
      ctx.strokeStyle = '#4D2600';
      ctx.lineWidth = 2;
      ctx.strokeRect(blockX, blockY, blockSize, blockSize);
    } else {
      // Other fixed block types
      ctx.fillStyle = '#555555'; // Dark gray
      ctx.fillRect(blockX, blockY, blockSize, blockSize);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(blockX, blockY, blockSize, blockSize);
    }
  } else {
    // Regular game blocks
    // Get color based on block type (1-indexed)
    const color = blockColors[(block.type - 1) % blockColors.length];
    const symbol = blockSymbols[(block.type - 1) % blockSymbols.length];
    
    // Draw block background
    ctx.fillStyle = color;
    ctx.fillRect(blockX, blockY, blockSize, blockSize);
    
    // Draw block border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.lineWidth = 2;
    ctx.strokeRect(blockX, blockY, blockSize, blockSize);
    
    // Draw block symbol
    ctx.fillStyle = 'white';
    ctx.font = `bold ${blockSize * 0.5}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, blockX + blockSize / 2, blockY + blockSize / 2);
  }
  
  // Reset opacity
  ctx.globalAlpha = 1.0;
}

// Render the game board (background and border)
function renderGameBoard(
  ctx: CanvasRenderingContext2D,
  blockSize: number,
  rows: number,
  cols: number
) {
  // Draw sky background
  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(0, 0, cols * blockSize, rows * blockSize);
  
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
  const { 
    board, 
    currentLevelData,
    selectBlock,
    selectedBlockPos 
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
  
  // Function to handle pointer (mouse or touch) events to select blocks
  const handlePointerSelect = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
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
      selectBlock(gridX, gameY);
      playHitSound();
    }
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
  
  // Render the game board
  useEffect(() => {
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
            selectedBlockPos?.x === x && selectedBlockPos?.y === y
          );
        }
      });
    });
    
    ctx.restore();
  }, [board, currentLevelData, width, height, offsetX, offsetY, scale, rows, cols, selectedBlockPos]);
  
  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleCanvasClick}
      onTouchStart={handleCanvasTouch}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{ 
        width: '100%', 
        height: '100%',
        background: 'linear-gradient(to bottom, #87CEEB, #e0f7fa)',
        touchAction: 'none' // Prevent browser handling of touch gestures (like scrolling)
      }}
    />
  );
}