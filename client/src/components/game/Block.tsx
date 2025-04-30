import { useRef } from "react";
import { useTexture } from "@react-three/drei";
import { ThreeEvent } from "@react-three/fiber";
import { BlockType } from "../../lib/stores/usePuzznic";
import * as THREE from "three";

interface BlockProps {
  block: BlockType;
  position: [number, number, number];
  onClick: () => void;
}

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

export function Block({ block, position, onClick }: BlockProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Load wood texture
  const texture = useTexture("/textures/wood.jpg");
  
  // Get color based on block type (1-indexed)
  const color = blockColors[(block.type - 1) % blockColors.length];
  const symbol = blockSymbols[(block.type - 1) % blockSymbols.length];
  
  // Handle click
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick();
  };
  
  // Scale effect when selected
  const scale = block.selected ? 1.1 : 1.0;
  const yOffset = block.selected ? 0.05 : 0;
  
  // Opacity for matched blocks
  const opacity = block.matched ? 0.5 : 1.0;
  
  return (
    <group
      position={[position[0], position[1] + yOffset, position[2]]}
      scale={[scale, scale, scale]}
    >
      {/* Block body */}
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onClick={handleClick}
      >
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial 
          map={texture}
          color={color} 
          opacity={opacity}
          transparent={block.matched}
        />
      </mesh>
      
      {/* Block symbol (front face) */}
      <mesh position={[0, 0, 0.46]}>
        <planeGeometry args={[0.5, 0.5]} />
        <meshBasicMaterial 
          color="#FFFFFF" 
          opacity={opacity} 
          transparent={block.matched}
        >
          <canvasTexture
            attach="map"
            image={(() => {
              // Create canvas for text
              const canvas = document.createElement('canvas');
              canvas.width = 128;
              canvas.height = 128;
              const context = canvas.getContext('2d')!;
              
              // Clear canvas
              context.fillStyle = 'rgba(0, 0, 0, 0)';
              context.fillRect(0, 0, canvas.width, canvas.height);
              
              // Draw symbol
              context.font = 'bold 80px Arial';
              context.textAlign = 'center';
              context.textBaseline = 'middle';
              context.fillStyle = 'black';
              context.fillText(symbol, canvas.width / 2, canvas.height / 2);
              
              return canvas;
            })()}
          />
        </meshBasicMaterial>
      </mesh>
    </group>
  );
}
