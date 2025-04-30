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
export function renderBlock(
  ctx: CanvasRenderingContext2D,
  block: BlockType,
  x: number,
  y: number,
  size: number,
  isSelected: boolean
) {
  // Get color based on block type (1-indexed)
  const color = blockColors[(block.type - 1) % blockColors.length];
  const symbol = blockSymbols[(block.type - 1) % blockSymbols.length];
  
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
  
  // Reset opacity
  ctx.globalAlpha = 1.0;
}

// Render the game board (walls, platforms, background)
export function renderGameBoard(
  ctx: CanvasRenderingContext2D,
  levelData: number[][],
  blockSize: number,
  rows: number,
  cols: number
) {
  // Draw background
  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(0, 0, cols * blockSize, rows * blockSize);
  
  // Draw walls/platforms (value 1 represents walls in level data)
  ctx.fillStyle = '#8B4513'; // Wood color
  
  for (let y = 0; y < levelData.length; y++) {
    for (let x = 0; x < levelData[y].length; x++) {
      if (levelData[y][x] === 1) {
        // Convert from game y-coordinate (bottom-up) to UI y-coordinate (top-down)
        const uiY = rows - y - 1;
        
        // Draw wall/platform with wood texture effect
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x * blockSize, uiY * blockSize, blockSize, blockSize);
        
        // Add wood grain lines
        ctx.strokeStyle = '#6B3100';
        ctx.lineWidth = 1;
        
        // Horizontal grain lines
        for (let i = 1; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(x * blockSize, uiY * blockSize + i * blockSize / 5);
          ctx.lineTo(x * blockSize + blockSize, uiY * blockSize + i * blockSize / 5);
          ctx.stroke();
        }
      }
    }
  }
  
  // Draw board border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, cols * blockSize, rows * blockSize);
}