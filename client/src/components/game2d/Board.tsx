import React, { useEffect, useRef } from 'react';
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
  isSelected: boolean
) {
  // Apply selection effect
  const blockSize = isSelected ? size * 1.1 : size * 0.95;
  const blockX = x + (size - blockSize) / 2;
  const blockY = y + (size - blockSize) / 2;
  
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