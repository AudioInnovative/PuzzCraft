import React, { useCallback, useEffect, useRef } from 'react';
import { usePuzznic, BlockType, MOVING_GROUND_TYPE } from '../../lib/stores/usePuzznic';
import { useAudio } from '../../lib/stores/useAudio';

// Define block colors based on type (using an ultra-vibrant futuristic neon palette)
const blockColors = [
  "#FF005E", // Intense Neon Pink
  "#00FF33", // Electric Neon Green
  "#00FFFF", // Brilliant Cyan
  "#FFFF00", // Vivid Yellow
  "#FF00FF", // Vibrant Magenta
  "#4D4DFF", // Electric Blue
  "#FF7700", // Blazing Orange
  "#AA00FF", // Deep Purple
  "#FF0099", // Hot Pink
  "#00DDFF", // Bright Aqua
];

// Define block symbols based on original Puzznic
const blockSymbols = ["✚", "■", "●", "×", "★", "◆", "▲", "♦", "◇", "○"];

// Render a single block in futuristic glowing style
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
  const baseBlockSize = isSelected ? size * 1.1 : size * 0.95;
  let drawBlockSize = baseBlockSize;
  
  // Calculate position with animation if block is falling
  let blockX = x + (size - drawBlockSize) / 2;
  let blockY = y + (size - drawBlockSize) / 2;
  
  // If block is falling, animate its position
  if (block.falling && animationProgress > 0) {
    // Use an ease-out cubic for smoother falling
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const easedProgress = easeOutCubic(animationProgress);
    blockY = (y - size) + (size * easedProgress) + (size - drawBlockSize) / 2;
    // Add a more pronounced squash effect as it lands
    if (animationProgress > 0.85) {
      const squash = 1 + 0.18 * (1 - (animationProgress - 0.85) / 0.15); // Squash at the end
      const squashFactor = Math.min(squash, 1.18);
      drawBlockSize = baseBlockSize * squashFactor;
      blockY += size * 0.03 * (1 - squashFactor); // Adjust Y so squash stays centered
    }
    blockX = x + (size - drawBlockSize) / 2;
  }
  
  // Set opacity for matched blocks
  ctx.globalAlpha = block.matched ? 0.5 : 1.0;
  
  // Reset shadow properties before drawing each block
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
  // Determine the glow color based on block type
  let glowColor = 'rgba(255, 255, 255, 0.8)'; // Default white glow
  
  if (block.type !== 1 && !block.isFixed) {
    // Get color based on block type for regular blocks
    const baseColor = blockColors[(block.type - 1) % blockColors.length];
    
    // For hex colors, convert to RGB and create a glow
    if (baseColor.startsWith('#')) {
      // Convert hex to RGB
      const r = parseInt(baseColor.substring(1, 3), 16);
      const g = parseInt(baseColor.substring(3, 5), 16);
      const b = parseInt(baseColor.substring(5, 7), 16);
      
      // Create semi-transparent glow color
      glowColor = `rgba(${r}, ${g}, ${b}, 0.7)`;
    }
  }
  
  // Apply appropriate glow effect based on block state
  if (isSelected) {
    // Intense glow for selected blocks
    ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  } else if (block.type !== 1 && !block.isFixed) {
    // Subtle neon glow for regular blocks
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  } else {
    // Very subtle shadow for floor and wall blocks
    ctx.shadowColor = 'rgba(0, 150, 255, 0.3)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }
  
  // --- Moving Ground Block Rendering ---
  if (block.type === MOVING_GROUND_TYPE || block.isMovingGround) {
    // Draw elevator block as a floor block with a square hole
    let radius = drawBlockSize * 0.2;
    ctx.save();
    // Shadow effect
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    // Base elevator block color (darker than ground)
    ctx.fillStyle = '#23242A';
    ctx.beginPath();
    ctx.moveTo(blockX + radius, blockY);
    ctx.lineTo(blockX + drawBlockSize - radius, blockY);
    ctx.quadraticCurveTo(blockX + drawBlockSize, blockY, blockX + drawBlockSize, blockY + radius);
    ctx.lineTo(blockX + drawBlockSize, blockY + drawBlockSize - radius);
    ctx.quadraticCurveTo(blockX + drawBlockSize, blockY + drawBlockSize, blockX + drawBlockSize - radius, blockY + drawBlockSize);
    ctx.lineTo(blockX + radius, blockY + drawBlockSize);
    ctx.quadraticCurveTo(blockX, blockY + drawBlockSize, blockX, blockY + drawBlockSize - radius);
    ctx.lineTo(blockX, blockY + radius);
    ctx.quadraticCurveTo(blockX, blockY, blockX + radius, blockY);
    ctx.closePath();
    ctx.fill();
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    // Bevel gradient
    const bevelGradient = ctx.createLinearGradient(
      blockX, blockY,
      blockX + drawBlockSize, blockY + drawBlockSize
    );
    // Slightly darker bevel gradient for elevator block
    bevelGradient.addColorStop(0, '#44444A');
    bevelGradient.addColorStop(0.5, '#36363A');
    bevelGradient.addColorStop(1, '#23242A');
    ctx.fillStyle = bevelGradient;
    // Smaller bevel
    const bevel = 2;
    ctx.beginPath();
    ctx.moveTo(blockX + radius, blockY + bevel);
    ctx.lineTo(blockX + drawBlockSize - radius, blockY + bevel);
    ctx.quadraticCurveTo(blockX + drawBlockSize - bevel, blockY + bevel, blockX + drawBlockSize - bevel, blockY + radius);
    ctx.lineTo(blockX + drawBlockSize - bevel, blockY + drawBlockSize - radius);
    ctx.quadraticCurveTo(blockX + drawBlockSize - bevel, blockY + drawBlockSize - bevel, blockX + drawBlockSize - radius, blockY + drawBlockSize - bevel);
    ctx.lineTo(blockX + radius, blockY + drawBlockSize - bevel);
    ctx.quadraticCurveTo(blockX + bevel, blockY + drawBlockSize - bevel, blockX + bevel, blockY + drawBlockSize - radius);
    ctx.lineTo(blockX + bevel, blockY + radius);
    ctx.quadraticCurveTo(blockX + bevel, blockY + bevel, blockX + radius, blockY + bevel);
    ctx.closePath();
    ctx.fill();
    // Highlight
    ctx.save();
    ctx.clip();
    const lightSize = drawBlockSize * 0.5;
    const gradientHighlight = ctx.createRadialGradient(
      blockX + drawBlockSize * 0.3,
      blockY + drawBlockSize * 0.3,
      0,
      blockX + drawBlockSize * 0.3,
      blockY + drawBlockSize * 0.3,
      lightSize
    );
    gradientHighlight.addColorStop(0, `rgba(255, 255, 255, 0.1)`);
    gradientHighlight.addColorStop(1, `rgba(255, 255, 255, 0)`);
    ctx.fillStyle = gradientHighlight;
    ctx.fillRect(blockX, blockY, drawBlockSize, drawBlockSize);
    ctx.restore();
    // Subtle glowing border
    ctx.strokeStyle = 'rgba(0, 150, 255, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(0, 150, 255, 0.5)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.beginPath();
    ctx.moveTo(blockX + radius, blockY);
    ctx.lineTo(blockX + drawBlockSize - radius, blockY);
    ctx.quadraticCurveTo(blockX + drawBlockSize, blockY, blockX + drawBlockSize, blockY + radius);
    ctx.lineTo(blockX + drawBlockSize, blockY + drawBlockSize - radius);
    ctx.quadraticCurveTo(blockX + drawBlockSize, blockY + drawBlockSize, blockX + drawBlockSize - radius, blockY + drawBlockSize);
    ctx.lineTo(blockX + radius, blockY + drawBlockSize);
    ctx.quadraticCurveTo(blockX, blockY + drawBlockSize, blockX, blockY + drawBlockSize - radius);
    ctx.lineTo(blockX, blockY + radius);
    ctx.quadraticCurveTo(blockX, blockY, blockX + radius, blockY);
    ctx.closePath();
    ctx.stroke();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    // --- Draw the hole ---
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#0A1521'; // Board background color (matches top left of gradient)
    ctx.beginPath();
    ctx.rect(blockX + drawBlockSize * 0.28, blockY + drawBlockSize * 0.28, drawBlockSize * 0.44, drawBlockSize * 0.44);
    ctx.fill();
    ctx.restore();
    ctx.restore();
    return;
  }

  // Floor block (type 1) with 3D effect
  if (block.type === 1) {
    // Use futuristic version of floor blocks with rounded corners
    let radius = drawBlockSize * 0.2; // Same radius as regular blocks
    
    // Draw shadow effect directly on the canvas
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    
    // Draw base floor block with a darker metallic color
    ctx.fillStyle = '#333333'; // Very dark gray base
    ctx.beginPath();
    ctx.moveTo(blockX + radius, blockY);
    ctx.lineTo(blockX + drawBlockSize - radius, blockY);
    ctx.quadraticCurveTo(blockX + drawBlockSize, blockY, blockX + drawBlockSize, blockY + radius);
    ctx.lineTo(blockX + drawBlockSize, blockY + drawBlockSize - radius);
    ctx.quadraticCurveTo(blockX + drawBlockSize, blockY + drawBlockSize, blockX + drawBlockSize - radius, blockY + drawBlockSize);
    ctx.lineTo(blockX + radius, blockY + drawBlockSize);
    ctx.quadraticCurveTo(blockX, blockY + drawBlockSize, blockX, blockY + drawBlockSize - radius);
    ctx.lineTo(blockX, blockY + radius);
    ctx.quadraticCurveTo(blockX, blockY, blockX + radius, blockY);
    ctx.closePath();
    ctx.fill();
    
    // Reset shadow for main shape
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Add 3D bevel effect with metallic gradient
    const bevelGradient = ctx.createLinearGradient(
      blockX, blockY, 
      blockX + drawBlockSize, blockY + drawBlockSize
    );
    
    // Gradient goes from lighter to darker for 3D effect
    bevelGradient.addColorStop(0, '#666666'); // Top-left light
    bevelGradient.addColorStop(0.5, '#555555'); // Mid
    bevelGradient.addColorStop(1, '#333333'); // Bottom-right shadow
    
    // Apply gradient to fill entire block solidly
    ctx.fillStyle = bevelGradient;
    
    // Redraw with slightly smaller size to create bevel
    const bevel = 2;
    ctx.beginPath();
    ctx.moveTo(blockX + radius, blockY + bevel);
    ctx.lineTo(blockX + drawBlockSize - radius, blockY + bevel);
    ctx.quadraticCurveTo(blockX + drawBlockSize - bevel, blockY + bevel, blockX + drawBlockSize - bevel, blockY + radius);
    ctx.lineTo(blockX + drawBlockSize - bevel, blockY + drawBlockSize - radius);
    ctx.quadraticCurveTo(blockX + drawBlockSize - bevel, blockY + drawBlockSize - bevel, blockX + drawBlockSize - radius, blockY + drawBlockSize - bevel);
    ctx.lineTo(blockX + radius, blockY + drawBlockSize - bevel);
    ctx.quadraticCurveTo(blockX + bevel, blockY + drawBlockSize - bevel, blockX + bevel, blockY + drawBlockSize - radius);
    ctx.lineTo(blockX + bevel, blockY + radius);
    ctx.quadraticCurveTo(blockX + bevel, blockY + bevel, blockX + radius, blockY + bevel);
    ctx.closePath();
    ctx.fill();
    
    // No grid patterns - keeping floor blocks completely solid
    ctx.save();
    ctx.clip(); // Still use clipping for safety
    
    // Just a very subtle highlight in the top-left
    const lightSize = drawBlockSize * 0.5;
    const gradientHighlight = ctx.createRadialGradient(
      blockX + drawBlockSize * 0.3,
      blockY + drawBlockSize * 0.3,
      0,
      blockX + drawBlockSize * 0.3,
      blockY + drawBlockSize * 0.3,
      lightSize
    );
    
    gradientHighlight.addColorStop(0, `rgba(255, 255, 255, 0.1)`); // Very subtle highlight
    gradientHighlight.addColorStop(1, `rgba(255, 255, 255, 0)`); // Fade to transparent
    
    ctx.fillStyle = gradientHighlight;
    ctx.fillRect(blockX, blockY, drawBlockSize, drawBlockSize);
    
    ctx.restore();
    
    // Subtle glowing border
    ctx.strokeStyle = 'rgba(0, 150, 255, 0.5)';
    ctx.lineWidth = 1.5;
    
    // Add subtle shadow glow effect
    ctx.shadowColor = 'rgba(0, 150, 255, 0.5)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    ctx.beginPath();
    ctx.moveTo(blockX + radius, blockY);
    ctx.lineTo(blockX + drawBlockSize - radius, blockY);
    ctx.quadraticCurveTo(blockX + drawBlockSize, blockY, blockX + drawBlockSize, blockY + radius);
    ctx.lineTo(blockX + drawBlockSize, blockY + drawBlockSize - radius);
    ctx.quadraticCurveTo(blockX + drawBlockSize, blockY + drawBlockSize, blockX + drawBlockSize - radius, blockY + drawBlockSize);
    ctx.lineTo(blockX + radius, blockY + drawBlockSize);
    ctx.quadraticCurveTo(blockX, blockY + drawBlockSize, blockX, blockY + drawBlockSize - radius);
    ctx.lineTo(blockX, blockY + radius);
    ctx.quadraticCurveTo(blockX, blockY, blockX + radius, blockY);
    ctx.closePath();
    ctx.stroke();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  } else if (block.isFixed && block.type !== 1) {
    // Wall blocks with futuristic tech style and 3D effect
    let radius = drawBlockSize * 0.2; // Match radius with other blocks
    
    // Draw shadow effect directly on the canvas
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    
    // Draw base wall block with a dark metallic blue
    ctx.fillStyle = '#1A2530'; // Very dark blue base
    ctx.beginPath();
    ctx.moveTo(blockX + radius, blockY);
    ctx.lineTo(blockX + drawBlockSize - radius, blockY);
    ctx.quadraticCurveTo(blockX + drawBlockSize, blockY, blockX + drawBlockSize, blockY + radius);
    ctx.lineTo(blockX + drawBlockSize, blockY + drawBlockSize - radius);
    ctx.quadraticCurveTo(blockX + drawBlockSize, blockY + drawBlockSize, blockX + drawBlockSize - radius, blockY + drawBlockSize);
    ctx.lineTo(blockX + radius, blockY + drawBlockSize);
    ctx.quadraticCurveTo(blockX, blockY + drawBlockSize, blockX, blockY + drawBlockSize - radius);
    ctx.lineTo(blockX, blockY + radius);
    ctx.quadraticCurveTo(blockX, blockY, blockX + radius, blockY);
    ctx.closePath();
    ctx.fill();
    
    // Reset shadow for main shape
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Add 3D bevel effect with tech gradient
    const bevelGradient = ctx.createLinearGradient(
      blockX, blockY, 
      blockX + drawBlockSize, blockY + drawBlockSize
    );
    
    // Gradient goes from lighter to darker for 3D effect
    bevelGradient.addColorStop(0, '#304760'); // Top-left light
    bevelGradient.addColorStop(0.5, '#253850'); // Mid
    bevelGradient.addColorStop(1, '#1A2530'); // Bottom-right shadow
    
    // Apply gradient to fill entire block solidly
    ctx.fillStyle = bevelGradient;
    
    // Redraw with slightly smaller size to create bevel
    const bevel = 2;
    ctx.beginPath();
    ctx.moveTo(blockX + radius, blockY + bevel);
    ctx.lineTo(blockX + drawBlockSize - radius, blockY + bevel);
    ctx.quadraticCurveTo(blockX + drawBlockSize - bevel, blockY + bevel, blockX + drawBlockSize - bevel, blockY + radius);
    ctx.lineTo(blockX + drawBlockSize - bevel, blockY + drawBlockSize - radius);
    ctx.quadraticCurveTo(blockX + drawBlockSize - bevel, blockY + drawBlockSize - bevel, blockX + drawBlockSize - radius, blockY + drawBlockSize - bevel);
    ctx.lineTo(blockX + radius, blockY + drawBlockSize - bevel);
    ctx.quadraticCurveTo(blockX + bevel, blockY + drawBlockSize - bevel, blockX + bevel, blockY + drawBlockSize - radius);
    ctx.lineTo(blockX + bevel, blockY + radius);
    ctx.quadraticCurveTo(blockX + bevel, blockY + bevel, blockX + radius, blockY + bevel);
    ctx.closePath();
    ctx.fill();
    
    // No circuit patterns - keeping wall blocks completely solid
    ctx.save();
    ctx.clip(); // Still use clipping for safety
    
    // Just a very subtle top-left highlight for 3D effect
    const lightSize = drawBlockSize * 0.6;
    const gradientHighlight = ctx.createRadialGradient(
      blockX + drawBlockSize * 0.25, // More towards the top-left
      blockY + drawBlockSize * 0.25,
      0,
      blockX + drawBlockSize * 0.25,
      blockY + drawBlockSize * 0.25,
      lightSize
    );
    
    gradientHighlight.addColorStop(0, 'rgba(60, 100, 140, 0.15)'); // Subtle blue highlight
    gradientHighlight.addColorStop(1, 'rgba(60, 100, 140, 0)'); // Fade to transparent
    
    ctx.fillStyle = gradientHighlight;
    ctx.fillRect(blockX, blockY, drawBlockSize, drawBlockSize);
    
    ctx.restore();
    
    // Glowing border with enhanced effect
    ctx.strokeStyle = 'rgba(0, 150, 255, 0.6)';
    ctx.lineWidth = 1.5;
    
    // Add glow effect
    ctx.shadowColor = 'rgba(0, 150, 255, 0.6)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    ctx.beginPath();
    ctx.moveTo(blockX + radius, blockY);
    ctx.lineTo(blockX + drawBlockSize - radius, blockY);
    ctx.quadraticCurveTo(blockX + drawBlockSize, blockY, blockX + drawBlockSize, blockY + radius);
    ctx.lineTo(blockX + drawBlockSize, blockY + drawBlockSize - radius);
    ctx.quadraticCurveTo(blockX + drawBlockSize, blockY + drawBlockSize, blockX + drawBlockSize - radius, blockY + drawBlockSize);
    ctx.lineTo(blockX + radius, blockY + drawBlockSize);
    ctx.quadraticCurveTo(blockX, blockY + drawBlockSize, blockX, blockY + drawBlockSize - radius);
    ctx.lineTo(blockX, blockY + radius);
    ctx.quadraticCurveTo(blockX, blockY, blockX + radius, blockY);
    ctx.closePath();
    ctx.stroke();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  } else {
    // Regular game blocks with futuristic neon glowing style - no symbols, just rich colors
    // Get color based on block type (1-indexed)
    const color = blockColors[(block.type - 1) % blockColors.length];
    
    // Convert hex to RGB for glow
    let r = 255, g = 255, b = 255;
    if (color.startsWith('#')) {
      // Convert hex to RGB
      r = parseInt(color.substring(1, 3), 16);
      g = parseInt(color.substring(3, 5), 16);
      b = parseInt(color.substring(5, 7), 16);
    }
    
    let radius = drawBlockSize * 0.2; // Slightly larger rounded corner radius for modern look
    
    // Draw shadow effect directly on the canvas rather than as another shape
    // to prevent overlapping issues
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    
    // Draw base block with darker but still rich color
    ctx.fillStyle = `rgb(${Math.floor(r*0.4)}, ${Math.floor(g*0.4)}, ${Math.floor(b*0.4)})`;
    ctx.beginPath();
    ctx.moveTo(blockX + radius, blockY);
    ctx.lineTo(blockX + drawBlockSize - radius, blockY);
    ctx.quadraticCurveTo(blockX + drawBlockSize, blockY, blockX + drawBlockSize, blockY + radius);
    ctx.lineTo(blockX + drawBlockSize, blockY + drawBlockSize - radius);
    ctx.quadraticCurveTo(blockX + drawBlockSize, blockY + drawBlockSize, blockX + drawBlockSize - radius, blockY + drawBlockSize);
    ctx.lineTo(blockX + radius, blockY + drawBlockSize);
    ctx.quadraticCurveTo(blockX, blockY + drawBlockSize, blockX, blockY + drawBlockSize - radius);
    ctx.lineTo(blockX, blockY + radius);
    ctx.quadraticCurveTo(blockX, blockY, blockX + radius, blockY);
    ctx.closePath();
    ctx.fill();
    
    // Reset shadow for main shape
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Add a 3D bevel effect with gradient
    const bevelGradient = ctx.createLinearGradient(
      blockX, blockY, 
      blockX + drawBlockSize, blockY + drawBlockSize
    );
    
    // Gradient goes from lighter to darker for 3D effect
    bevelGradient.addColorStop(0, `rgb(${Math.min(255, Math.floor(r*0.9))}, ${Math.min(255, Math.floor(g*0.9))}, ${Math.min(255, Math.floor(b*0.9))})`); // Top-left light
    bevelGradient.addColorStop(0.5, `rgb(${Math.floor(r*0.7)}, ${Math.floor(g*0.7)}, ${Math.floor(b*0.7)})`); // Mid
    bevelGradient.addColorStop(1, `rgb(${Math.floor(r*0.3)}, ${Math.floor(g*0.3)}, ${Math.floor(b*0.3)})`); // Bottom-right shadow
    
    // Apply gradient to fill entire block solidly
    ctx.fillStyle = bevelGradient;
    
    // Redraw with slightly smaller size to create bevel
    const bevel = 2;
    ctx.beginPath();
    ctx.moveTo(blockX + radius, blockY + bevel);
    ctx.lineTo(blockX + drawBlockSize - radius, blockY + bevel);
    ctx.quadraticCurveTo(blockX + drawBlockSize - bevel, blockY + bevel, blockX + drawBlockSize - bevel, blockY + radius);
    ctx.lineTo(blockX + drawBlockSize - bevel, blockY + drawBlockSize - radius);
    ctx.quadraticCurveTo(blockX + drawBlockSize - bevel, blockY + drawBlockSize - bevel, blockX + drawBlockSize - radius, blockY + drawBlockSize - bevel);
    ctx.lineTo(blockX + radius, blockY + drawBlockSize - bevel);
    ctx.quadraticCurveTo(blockX + bevel, blockY + drawBlockSize - bevel, blockX + bevel, blockY + drawBlockSize - radius);
    ctx.lineTo(blockX + bevel, blockY + radius);
    ctx.quadraticCurveTo(blockX + bevel, blockY + bevel, blockX + radius, blockY + bevel);
    ctx.closePath();
    ctx.fill();
    
    // No grid patterns or center circle - keeping blocks completely solid
    ctx.save();
    ctx.clip(); // Still use clipping for safety
    
    // Just a very subtle top highlight to maintain 3D look without patterns
    const lightSize = drawBlockSize * 0.3;
    const gradientHighlight = ctx.createRadialGradient(
      blockX + drawBlockSize * 0.3, // Slightly to the top-left
      blockY + drawBlockSize * 0.3,
      0,
      blockX + drawBlockSize * 0.3,
      blockY + drawBlockSize * 0.3,
      lightSize
    );
    
    gradientHighlight.addColorStop(0, `rgba(255, 255, 255, 0.15)`); // Very subtle light spot
    gradientHighlight.addColorStop(1, `rgba(255, 255, 255, 0)`); // Fade to transparent
    
    ctx.fillStyle = gradientHighlight;
    ctx.fillRect(blockX, blockY, drawBlockSize, drawBlockSize);
    
    ctx.restore();
    
    // Draw glowing border with enhanced color matching the block
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 1.0)`; // Full opacity for more vibrant borders
    ctx.lineWidth = 2;
    
    // Add stronger glow effect
    ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 1.0)`;
    ctx.shadowBlur = 10; // Increased blur for more pronounced glow
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    ctx.beginPath();
    ctx.moveTo(blockX + radius, blockY);
    ctx.lineTo(blockX + drawBlockSize - radius, blockY);
    ctx.quadraticCurveTo(blockX + drawBlockSize, blockY, blockX + drawBlockSize, blockY + radius);
    ctx.lineTo(blockX + drawBlockSize, blockY + drawBlockSize - radius);
    ctx.quadraticCurveTo(blockX + drawBlockSize, blockY + drawBlockSize, blockX + drawBlockSize - radius, blockY + drawBlockSize);
    ctx.lineTo(blockX + radius, blockY + drawBlockSize);
    ctx.quadraticCurveTo(blockX, blockY + drawBlockSize, blockX, blockY + drawBlockSize - radius);
    ctx.lineTo(blockX, blockY + radius);
    ctx.quadraticCurveTo(blockX, blockY, blockX + radius, blockY);
    ctx.closePath();
    ctx.stroke();
  }
  
  // Reset opacity
  ctx.globalAlpha = 1.0;
}

// Render the game board (background and border) in futuristic style
function renderGameBoard(
  ctx: CanvasRenderingContext2D,
  blockSize: number,
  rows: number,
  cols: number
) {
  // Create dark futuristic gradient background
  const gradient = ctx.createLinearGradient(0, 0, cols * blockSize, rows * blockSize);
  gradient.addColorStop(0, '#0A1521'); // Very dark blue at top left
  gradient.addColorStop(0.3, '#0F2031'); // Dark blue 
  gradient.addColorStop(0.7, '#102436'); // Slightly lighter dark blue
  gradient.addColorStop(1, '#0A1521'); // Back to very dark blue at bottom right
  
  // Apply gradient to background
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, cols * blockSize, rows * blockSize);
  
  // Add futuristic grid pattern
  ctx.strokeStyle = 'rgba(0, 150, 255, 0.08)'; // Subtle tech blue lines
  ctx.lineWidth = 0.5;
  
  // Draw horizontal grid lines
  for (let y = 0; y <= rows; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * blockSize);
    ctx.lineTo(cols * blockSize, y * blockSize);
    ctx.stroke();
  }
  
  // Draw vertical grid lines
  for (let x = 0; x <= cols; x++) {
    ctx.beginPath();
    ctx.moveTo(x * blockSize, 0);
    ctx.lineTo(x * blockSize, rows * blockSize);
    ctx.stroke();
  }
  
  // Add some tech-style dots at intersections for futuristic feel
  ctx.fillStyle = 'rgba(0, 150, 255, 0.2)';
  for (let y = 0; y <= rows; y++) {
    for (let x = 0; x <= cols; x++) {
      ctx.beginPath();
      ctx.arc(
        x * blockSize, 
        y * blockSize, 
        1, 0, Math.PI * 2
      );
      ctx.fill();
    }
  }
  
  // Create dark futuristic border with glow effect
  const borderRadius = 8;
  
  // Draw glowing border
  ctx.strokeStyle = 'rgba(0, 150, 255, 0.6)';
  ctx.lineWidth = 2;
  
  // Add glow effect
  ctx.shadowColor = 'rgba(0, 150, 255, 0.8)';
  ctx.shadowBlur = 15;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
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
  const lastFrameTimeRef = useRef<number | null>(null);
  const blockAnimationProgress = useRef(new Map());
  
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
  
  // --- Mouse down handler (editor and game) ---
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return; // Only respond to left mouse button
    const coords = getGridCoordinates(e.clientX, e.clientY);
    if (!coords) return;
    const { gridX, gameY } = coords;
    if (gamePhase === "editing") {
      placeEditorBlock(gridX, gameY, currentEditingBlockType);
    } else if (gamePhase === "playing") {
      selectBlock(gridX, gameY);
      dragStartRef.current = { x: e.clientX, y: e.clientY, gridX, gameY };
    }
  };

  // --- Mouse move handler (editor and game) ---
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Only handle drag logic for playing mode
    if (gamePhase !== "playing" || !dragStartRef.current) return;
    const coords = getGridCoordinates(e.clientX, e.clientY);
    if (coords) {
      const { gridX, gameY } = coords;
      if (!selectedBlockPos || selectedBlockPos.x !== gridX || selectedBlockPos.y !== gameY) {
        selectBlock(gridX, gameY);
      }
    }
    const currentTime = Date.now();
    const timeSinceLastMove = currentTime - lastMoveTimeRef.current;
    if (timeSinceLastMove < 120) return;
    const { x: startX } = dragStartRef.current;
    const diffX = e.clientX - startX;
    if (Math.abs(diffX) > mouseMoveThresholdRef.current) {
      const { moveSelectedBlock } = usePuzznic.getState();
      if (diffX < 0) {
        moveSelectedBlock('left');
        playHitSound();
      } else {
        moveSelectedBlock('right');
        playHitSound();
      }
      lastMoveTimeRef.current = currentTime;
      dragStartRef.current.x = e.clientX;
      dragStartRef.current.y = e.clientY;
    }
  };

  // --- Mouse up handler ---
  const handleMouseUp = () => {
    dragStartRef.current = null;
  };

  // --- Mouse leave handler ---
  const handleMouseLeave = () => {
    dragStartRef.current = null;
  };

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

  // Helper: get unique key for a block
  function blockKey(x: number, y: number): string {
    return `${x},${y}`;
  }
  
  // --- Render game state with per-block animation ---
  const renderGameState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    renderGameBoard(ctx, BLOCK_SIZE, rows, cols);
    board.forEach((row, y: number) => {
      row.forEach((block, x: number) => {
        if (block) {
          const uiY = rows - y - 1;
          const key = blockKey(x, y);
          const progress = blockAnimationProgress.current.get(key) || 0;
          renderBlock(
            ctx,
            block,
            x * BLOCK_SIZE,
            uiY * BLOCK_SIZE,
            BLOCK_SIZE,
            selectedBlockPos?.x === x && selectedBlockPos?.y === y,
            progress
          );
        }
      });
    });
    ctx.restore();
  }, [board, width, height, offsetX, offsetY, scale, rows, cols, selectedBlockPos]);

  // --- Update animation progress for each falling block ---
  const animateBlocks = useCallback((timestamp: number) => {
    if (!lastFrameTimeRef.current) {
      lastFrameTimeRef.current = timestamp;
    }
    const elapsed = timestamp - lastFrameTimeRef.current;
    const ANIMATION_DURATION = 200;

    let anyFalling = false;
    board.forEach((row, y: number) => {
      row.forEach((block, x: number) => {
        if (block && block.falling) {
          anyFalling = true;
          const key = blockKey(x, y);
          const prev = blockAnimationProgress.current.get(key) || 0;
          let next = prev + elapsed / ANIMATION_DURATION;
          if (next > 1) next = 1;
          blockAnimationProgress.current.set(key, next);
        } else if (block) {
          // Reset progress if not falling
          blockAnimationProgress.current.set(blockKey(x, y), 0);
        }
      });
    });

    // Remove progress for blocks no longer present
    for (const key of Array.from(blockAnimationProgress.current.keys())) {
      const [x, y] = key.split(',').map(Number);
      if (!board[y] || !board[y][x]) {
        blockAnimationProgress.current.delete(key);
      }
    }

    // If animation is complete or no blocks are falling, reset
    if (!anyFalling) {
      lastFrameTimeRef.current = null;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      renderGameState();
      return;
    } else {
      lastFrameTimeRef.current = timestamp;
    }

    renderGameState();
    animationFrameRef.current = requestAnimationFrame(animateBlocks);
  }, [board, renderGameState]);

  // Start animation when blocks start falling
  useEffect(() => {
    const blocksFalling = board.some(row => row.some(block => block?.falling));
    if (blocksFalling && animationFrameRef.current === null) {
      // Reset per-block progress
      blockAnimationProgress.current = new Map();
      lastFrameTimeRef.current = null;
      animationFrameRef.current = requestAnimationFrame(animateBlocks);
    }
    if (!blocksFalling) {
      renderGameState();
    }
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
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onClick={undefined}
      onTouchStart={undefined}
      onTouchEnd={undefined}
      onTouchCancel={undefined}
      style={{ 
        width: '100%', 
        height: '100%',
        background: '#000000', // Black background
        touchAction: 'none', // Prevent browser handling of touch gestures (like scrolling)
        cursor: selectedBlockPos 
          ? `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><defs><filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.5" result="blur"/><feComposite in="SourceGraphic" in2="blur" operator="over"/></filter></defs><circle cx="24" cy="24" r="6" fill="%23FFFFFF" filter="url(%23glow)" /><circle cx="24" cy="24" r="11" stroke="%23000000" stroke-width="3" fill="none" /><circle cx="24" cy="24" r="18" stroke="%23FF3300" stroke-width="3.5" fill="none" filter="url(%23glow)" /><circle cx="24" cy="24" r="11" stroke="%23FF3300" stroke-width="2" fill="none" filter="url(%23glow)" /></svg>') 24 24, auto`
          : gamePhase === "editing"
            ? `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><defs><filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.5" result="blur"/><feComposite in="SourceGraphic" in2="blur" operator="over"/></filter></defs><circle cx="24" cy="24" r="5" fill="%23FFFFFF" /><path d="M10 24 L38 24 M24 10 L24 38" stroke="%23000000" stroke-width="4" /><path d="M10 24 L38 24 M24 10 L24 38" stroke="%23FF3300" stroke-width="2.5" filter="url(%23glow)" /><circle cx="24" cy="24" r="18" stroke="%23FF3300" stroke-width="2.5" fill="none" filter="url(%23glow)" /></svg>') 24 24, auto`
            : `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><defs><filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.5" result="blur"/><feComposite in="SourceGraphic" in2="blur" operator="over"/></filter></defs><circle cx="24" cy="24" r="5" fill="%23FFFFFF" /><path d="M24 6 L24 15 M24 33 L24 42 M6 24 L15 24 M33 24 L42 24" stroke="%23000000" stroke-width="4" /><path d="M24 6 L24 15 M24 33 L24 42 M6 24 L15 24 M33 24 L42 24" stroke="%23FF3300" stroke-width="2.5" filter="url(%23glow)" /><circle cx="24" cy="24" r="20" stroke="%23FF3300" stroke-width="2.5" stroke-dasharray="4,4" fill="none" filter="url(%23glow)" /></svg>') 24 24, auto`
      }}
    />
  );
}