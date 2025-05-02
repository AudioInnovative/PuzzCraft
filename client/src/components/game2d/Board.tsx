import React, { useCallback, useEffect, useRef } from 'react';
import { usePuzznic } from '../../lib/stores/usePuzznic';
import { useAudio } from '../../lib/stores/useAudio';
import { BlockType } from '../../lib/stores/usePuzznic';

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
  
  // Floor block (type 1) with 3D effect
  if (block.type === 1) {
    // Use futuristic version of floor blocks with rounded corners
    let radius = blockSize * 0.2; // Same radius as regular blocks
    
    // Draw shadow for 3D effect
    ctx.fillStyle = '#222222'; // Very dark shadow
    const shadowOffset = 4;
    ctx.beginPath();
    ctx.moveTo(blockX + radius + shadowOffset, blockY + shadowOffset);
    ctx.lineTo(blockX + blockSize - radius + shadowOffset, blockY + shadowOffset);
    ctx.quadraticCurveTo(blockX + blockSize + shadowOffset, blockY + shadowOffset, blockX + blockSize + shadowOffset, blockY + radius + shadowOffset);
    ctx.lineTo(blockX + blockSize + shadowOffset, blockY + blockSize - radius + shadowOffset);
    ctx.quadraticCurveTo(blockX + blockSize + shadowOffset, blockY + blockSize + shadowOffset, blockX + blockSize - radius + shadowOffset, blockY + blockSize + shadowOffset);
    ctx.lineTo(blockX + radius + shadowOffset, blockY + blockSize + shadowOffset);
    ctx.quadraticCurveTo(blockX + shadowOffset, blockY + blockSize + shadowOffset, blockX + shadowOffset, blockY + blockSize - radius + shadowOffset);
    ctx.lineTo(blockX + shadowOffset, blockY + radius + shadowOffset);
    ctx.quadraticCurveTo(blockX + shadowOffset, blockY + shadowOffset, blockX + radius + shadowOffset, blockY + shadowOffset);
    ctx.closePath();
    ctx.fill();
    
    // Draw base floor block with a darker metallic color
    ctx.fillStyle = '#333333'; // Very dark gray base
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
    
    // Draw top surface with inset
    const inset = 3;
    ctx.fillStyle = '#454545'; // Slightly lighter gray for top surface
    ctx.beginPath();
    ctx.moveTo(blockX + radius, blockY + inset);
    ctx.lineTo(blockX + blockSize - radius, blockY + inset);
    ctx.quadraticCurveTo(blockX + blockSize - inset, blockY + inset, blockX + blockSize - inset, blockY + radius);
    ctx.lineTo(blockX + blockSize - inset, blockY + blockSize - radius);
    ctx.quadraticCurveTo(blockX + blockSize - inset, blockY + blockSize - inset, blockX + blockSize - radius, blockY + blockSize - inset);
    ctx.lineTo(blockX + radius, blockY + blockSize - inset);
    ctx.quadraticCurveTo(blockX + inset, blockY + blockSize - inset, blockX + inset, blockY + blockSize - radius);
    ctx.lineTo(blockX + inset, blockY + radius);
    ctx.quadraticCurveTo(blockX + inset, blockY + inset, blockX + radius, blockY + inset);
    ctx.closePath();
    ctx.fill();
    
    // Add 3D effect with metallic gradient
    const gradient = ctx.createLinearGradient(
      blockX, blockY, 
      blockX + blockSize, blockY + blockSize
    );
    gradient.addColorStop(0, 'rgba(100, 100, 100, 0.6)'); // Lighter on top-left
    gradient.addColorStop(0.5, 'rgba(70, 70, 70, 0.5)');
    gradient.addColorStop(1, 'rgba(40, 40, 40, 0.7)'); // Darker on bottom-right
    
    // Apply 3D gradient with inner rounded corners
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(blockX + radius, blockY + inset);
    ctx.lineTo(blockX + blockSize - radius, blockY + inset);
    ctx.quadraticCurveTo(blockX + blockSize - inset, blockY + inset, blockX + blockSize - inset, blockY + radius);
    ctx.lineTo(blockX + blockSize - inset, blockY + blockSize - radius);
    ctx.quadraticCurveTo(blockX + blockSize - inset, blockY + blockSize - inset, blockX + blockSize - radius, blockY + blockSize - inset);
    ctx.lineTo(blockX + radius, blockY + blockSize - inset);
    ctx.quadraticCurveTo(blockX + inset, blockY + blockSize - inset, blockX + inset, blockY + blockSize - radius);
    ctx.lineTo(blockX + inset, blockY + radius);
    ctx.quadraticCurveTo(blockX + inset, blockY + inset, blockX + radius, blockY + inset);
    ctx.closePath();
    ctx.fill();
    
    // Add tech grid pattern for futuristic feel
    ctx.strokeStyle = 'rgba(0, 150, 255, 0.3)'; // Subtle blue tech lines
    ctx.lineWidth = 0.7;
    
    // Use clipping to ensure grid lines don't extend beyond rounded corners
    ctx.save();
    ctx.clip();
    
    // Draw futuristic grid pattern
    const gridSize = blockSize / 5;
    
    // Draw horizontal and vertical grid lines
    for (let i = 1; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(blockX, blockY + i * gridSize);
      ctx.lineTo(blockX + blockSize, blockY + i * gridSize);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(blockX + i * gridSize, blockY);
      ctx.lineTo(blockX + i * gridSize, blockY + blockSize);
      ctx.stroke();
    }
    
    // Add glowing dots at intersections
    ctx.fillStyle = 'rgba(0, 150, 255, 0.4)';
    for (let i = 0; i <= 5; i++) {
      for (let j = 0; j <= 5; j++) {
        ctx.beginPath();
        ctx.arc(
          blockX + i * gridSize, 
          blockY + j * gridSize, 
          0.8, 0, Math.PI * 2
        );
        ctx.fill();
      }
    }
    
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
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  } else if (block.isFixed && block.type !== 1) {
    // Wall blocks with futuristic tech style and 3D effect
    let radius = blockSize * 0.2; // Match radius with other blocks
    
    // Draw shadow for 3D effect
    ctx.fillStyle = '#131C24'; // Very dark shadow for wall blocks
    const shadowOffset = 4;
    ctx.beginPath();
    ctx.moveTo(blockX + radius + shadowOffset, blockY + shadowOffset);
    ctx.lineTo(blockX + blockSize - radius + shadowOffset, blockY + shadowOffset);
    ctx.quadraticCurveTo(blockX + blockSize + shadowOffset, blockY + shadowOffset, blockX + blockSize + shadowOffset, blockY + radius + shadowOffset);
    ctx.lineTo(blockX + blockSize + shadowOffset, blockY + blockSize - radius + shadowOffset);
    ctx.quadraticCurveTo(blockX + blockSize + shadowOffset, blockY + blockSize + shadowOffset, blockX + blockSize - radius + shadowOffset, blockY + blockSize + shadowOffset);
    ctx.lineTo(blockX + radius + shadowOffset, blockY + blockSize + shadowOffset);
    ctx.quadraticCurveTo(blockX + shadowOffset, blockY + blockSize + shadowOffset, blockX + shadowOffset, blockY + blockSize - radius + shadowOffset);
    ctx.lineTo(blockX + shadowOffset, blockY + radius + shadowOffset);
    ctx.quadraticCurveTo(blockX + shadowOffset, blockY + shadowOffset, blockX + radius + shadowOffset, blockY + shadowOffset);
    ctx.closePath();
    ctx.fill();
    
    // Draw base wall block with a dark metallic blue
    ctx.fillStyle = '#1A2530'; // Very dark blue base
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
    
    // Draw top surface with inset
    const inset = 3;
    ctx.fillStyle = '#2A3B4A'; // Slightly lighter blue for top surface
    ctx.beginPath();
    ctx.moveTo(blockX + radius, blockY + inset);
    ctx.lineTo(blockX + blockSize - radius, blockY + inset);
    ctx.quadraticCurveTo(blockX + blockSize - inset, blockY + inset, blockX + blockSize - inset, blockY + radius);
    ctx.lineTo(blockX + blockSize - inset, blockY + blockSize - radius);
    ctx.quadraticCurveTo(blockX + blockSize - inset, blockY + blockSize - inset, blockX + blockSize - radius, blockY + blockSize - inset);
    ctx.lineTo(blockX + radius, blockY + blockSize - inset);
    ctx.quadraticCurveTo(blockX + inset, blockY + blockSize - inset, blockX + inset, blockY + blockSize - radius);
    ctx.lineTo(blockX + inset, blockY + radius);
    ctx.quadraticCurveTo(blockX + inset, blockY + inset, blockX + radius, blockY + inset);
    ctx.closePath();
    ctx.fill();
    
    // Add 3D effect with futuristic tech gradient
    const gradient = ctx.createLinearGradient(
      blockX, blockY, 
      blockX + blockSize, blockY + blockSize
    );
    gradient.addColorStop(0, 'rgba(60, 90, 120, 0.7)'); // Lighter on top-left
    gradient.addColorStop(0.5, 'rgba(40, 70, 100, 0.6)');
    gradient.addColorStop(1, 'rgba(20, 40, 60, 0.7)'); // Darker on bottom-right
    
    // Apply 3D gradient with inner rounded corners
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(blockX + radius, blockY + inset);
    ctx.lineTo(blockX + blockSize - radius, blockY + inset);
    ctx.quadraticCurveTo(blockX + blockSize - inset, blockY + inset, blockX + blockSize - inset, blockY + radius);
    ctx.lineTo(blockX + blockSize - inset, blockY + blockSize - radius);
    ctx.quadraticCurveTo(blockX + blockSize - inset, blockY + blockSize - inset, blockX + blockSize - radius, blockY + blockSize - inset);
    ctx.lineTo(blockX + radius, blockY + blockSize - inset);
    ctx.quadraticCurveTo(blockX + inset, blockY + blockSize - inset, blockX + inset, blockY + blockSize - radius);
    ctx.lineTo(blockX + inset, blockY + radius);
    ctx.quadraticCurveTo(blockX + inset, blockY + inset, blockX + radius, blockY + inset);
    ctx.closePath();
    ctx.fill();
    
    // Add tech circuit pattern
    ctx.strokeStyle = 'rgba(0, 150, 255, 0.4)'; // Slightly brighter blue tech lines
    ctx.lineWidth = 0.8;
    
    // Use clipping to ensure lines don't extend beyond rounded corners
    ctx.save();
    ctx.clip();
    
    // Horizontal tech lines
    const lineSize = blockSize / 5;
    for (let i = 1; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(blockX, blockY + i * lineSize);
      ctx.lineTo(blockX + blockSize, blockY + i * lineSize);
      ctx.stroke();
    }
    
    // Add tech circuit pattern with vertical lines
    ctx.beginPath();
    ctx.moveTo(blockX + blockSize / 2, blockY);
    ctx.lineTo(blockX + blockSize / 2, blockY + blockSize);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(blockX + blockSize / 4, blockY);
    ctx.lineTo(blockX + blockSize / 4, blockY + blockSize / 2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(blockX + 3 * blockSize / 4, blockY + blockSize / 2);
    ctx.lineTo(blockX + 3 * blockSize / 4, blockY + blockSize);
    ctx.stroke();
    
    // Add diagonal circuit lines for more futuristic look
    ctx.beginPath();
    ctx.moveTo(blockX + blockSize / 5, blockY);
    ctx.lineTo(blockX + blockSize, blockY + 4 * blockSize / 5);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(blockX, blockY + blockSize / 5);
    ctx.lineTo(blockX + 4 * blockSize / 5, blockY + blockSize);
    ctx.stroke();
    
    // Add small glowing dots at key circuit intersections
    ctx.fillStyle = 'rgba(0, 220, 255, 0.7)'; // Brighter dots
    
    // Center dot
    ctx.beginPath();
    ctx.arc(
      blockX + blockSize / 2, 
      blockY + blockSize / 2, 
      1.5, 0, Math.PI * 2
    );
    ctx.fill();
    
    // Corner and circuit intersections
    const dotPositions = [
      [blockX + blockSize / 4, blockY + blockSize / 3],
      [blockX + 3 * blockSize / 4, blockY + 2 * blockSize / 3],
      [blockX + blockSize / 4, blockY + blockSize / 2],
      [blockX + 3 * blockSize / 4, blockY + blockSize / 2],
      [blockX + blockSize / 2, blockY + blockSize / 4],
      [blockX + blockSize / 2, blockY + 3 * blockSize / 4]
    ];
    
    for (const [x, y] of dotPositions) {
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    
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
      r = parseInt(color.substring(1, 3), 16);
      g = parseInt(color.substring(3, 5), 16);
      b = parseInt(color.substring(5, 7), 16);
    }
    
    let radius = blockSize * 0.2; // Slightly larger rounded corner radius for modern look
    
    // Draw a much darker base underlying block (shadow) for 3D effect
    ctx.fillStyle = `rgb(${Math.floor(r*0.1)}, ${Math.floor(g*0.1)}, ${Math.floor(b*0.1)})`;
    
    // Offset slightly to create a 3D shadow effect
    const shadowOffset = 4;
    ctx.beginPath();
    ctx.moveTo(blockX + radius + shadowOffset, blockY + shadowOffset);
    ctx.lineTo(blockX + blockSize - radius + shadowOffset, blockY + shadowOffset);
    ctx.quadraticCurveTo(blockX + blockSize + shadowOffset, blockY + shadowOffset, blockX + blockSize + shadowOffset, blockY + radius + shadowOffset);
    ctx.lineTo(blockX + blockSize + shadowOffset, blockY + blockSize - radius + shadowOffset);
    ctx.quadraticCurveTo(blockX + blockSize + shadowOffset, blockY + blockSize + shadowOffset, blockX + blockSize - radius + shadowOffset, blockY + blockSize + shadowOffset);
    ctx.lineTo(blockX + radius + shadowOffset, blockY + blockSize + shadowOffset);
    ctx.quadraticCurveTo(blockX + shadowOffset, blockY + blockSize + shadowOffset, blockX + shadowOffset, blockY + blockSize - radius + shadowOffset);
    ctx.lineTo(blockX + shadowOffset, blockY + radius + shadowOffset);
    ctx.quadraticCurveTo(blockX + shadowOffset, blockY + shadowOffset, blockX + radius + shadowOffset, blockY + shadowOffset);
    ctx.closePath();
    ctx.fill();
    
    // Draw darker base block (bottom layer)
    ctx.fillStyle = `rgb(${Math.floor(r*0.15)}, ${Math.floor(g*0.15)}, ${Math.floor(b*0.15)})`;
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
    
    // Draw main block with darker but still rich color
    // Use a darker version of the original color
    ctx.fillStyle = `rgb(${Math.floor(r*0.6)}, ${Math.floor(g*0.6)}, ${Math.floor(b*0.6)})`;
    const inset = 3; // Slightly larger inset for more pronounced 3D effect
    ctx.beginPath();
    ctx.moveTo(blockX + radius, blockY + inset);
    ctx.lineTo(blockX + blockSize - radius, blockY + inset);
    ctx.quadraticCurveTo(blockX + blockSize - inset, blockY + inset, blockX + blockSize - inset, blockY + radius);
    ctx.lineTo(blockX + blockSize - inset, blockY + blockSize - radius);
    ctx.quadraticCurveTo(blockX + blockSize - inset, blockY + blockSize - inset, blockX + blockSize - radius, blockY + blockSize - inset);
    ctx.lineTo(blockX + radius, blockY + blockSize - inset);
    ctx.quadraticCurveTo(blockX + inset, blockY + blockSize - inset, blockX + inset, blockY + blockSize - radius);
    ctx.lineTo(blockX + inset, blockY + radius);
    ctx.quadraticCurveTo(blockX + inset, blockY + inset, blockX + radius, blockY + inset);
    ctx.closePath();
    ctx.fill();
    
    // Add 3D effect gradients - top left to bottom right lighting
    const topGradient = ctx.createLinearGradient(
      blockX, blockY, 
      blockX + blockSize, blockY + blockSize
    );
    topGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.6)`); // Lighter on top-left
    topGradient.addColorStop(0.3, `rgba(${Math.floor(r*0.5)}, ${Math.floor(g*0.5)}, ${Math.floor(b*0.5)}, 0.6)`);
    topGradient.addColorStop(1, `rgba(${Math.floor(r*0.3)}, ${Math.floor(g*0.3)}, ${Math.floor(b*0.3)}, 0.6)`); // Darker on bottom-right
    
    // Apply 3D gradient with inner rounded corners
    ctx.fillStyle = topGradient;
    ctx.beginPath();
    ctx.moveTo(blockX + radius, blockY + inset);
    ctx.lineTo(blockX + blockSize - radius, blockY + inset);
    ctx.quadraticCurveTo(blockX + blockSize - inset, blockY + inset, blockX + blockSize - inset, blockY + radius);
    ctx.lineTo(blockX + blockSize - inset, blockY + blockSize - radius);
    ctx.quadraticCurveTo(blockX + blockSize - inset, blockY + blockSize - inset, blockX + blockSize - radius, blockY + blockSize - inset);
    ctx.lineTo(blockX + radius, blockY + blockSize - inset);
    ctx.quadraticCurveTo(blockX + inset, blockY + blockSize - inset, blockX + inset, blockY + blockSize - radius);
    ctx.lineTo(blockX + inset, blockY + radius);
    ctx.quadraticCurveTo(blockX + inset, blockY + inset, blockX + radius, blockY + inset);
    ctx.closePath();
    ctx.fill();
    
    // Add tech-style grid pattern (very subtle)
    ctx.strokeStyle = `rgba(255, 255, 255, 0.2)`; // Slightly more visible grid
    ctx.lineWidth = 0.7;
    
    ctx.save();
    ctx.clip(); // Use current path as clip
    
    // Draw a simple tech grid
    const gridSize = blockSize / 5;
    
    // Horizontal lines
    for (let i = 1; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(blockX, blockY + i * gridSize);
      ctx.lineTo(blockX + blockSize, blockY + i * gridSize);
      ctx.stroke();
    }
    
    // Vertical lines
    for (let i = 1; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(blockX + i * gridSize, blockY);
      ctx.lineTo(blockX + i * gridSize, blockY + blockSize);
      ctx.stroke();
    }
    
    // Add subtle highlight arc for visual interest
    ctx.fillStyle = `rgba(255, 255, 255, 0.15)`;
    ctx.beginPath();
    ctx.arc(
      blockX + blockSize / 2,
      blockY + blockSize / 2,
      blockSize / 3,
      0, Math.PI * 2
    );
    ctx.fill();
    
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