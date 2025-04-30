import React, { useEffect, useRef } from 'react';
import { usePuzznic } from '../../lib/stores/usePuzznic';
import { useAudio } from '../../lib/stores/useAudio';
import { renderBlock, renderGameBoard } from './renderUtils';

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
  
  // Handle canvas click to select blocks
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Get click position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale - offsetX / scale;
    const y = (e.clientY - rect.top) / scale - offsetY / scale;
    
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
    
    // Render game board (walls, platforms, etc.)
    renderGameBoard(ctx, currentLevelData, BLOCK_SIZE, rows, cols);
    
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
      style={{ 
        width: '100%', 
        height: '100%',
        background: 'linear-gradient(to bottom, #87CEEB, #e0f7fa)'
      }}
    />
  );
}