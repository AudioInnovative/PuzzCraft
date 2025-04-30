import { useTexture } from "@react-three/drei";
import { usePuzznic } from "../../lib/stores/usePuzznic";
import * as THREE from "three";

export function Level() {
  const { board, currentLevelData } = usePuzznic();
  
  // Load textures
  const woodTexture = useTexture("/textures/wood.jpg");
  
  // Calculate board dimensions
  const rows = board.length;
  const cols = board[0]?.length || 0;
  const boardWidth = cols;
  const boardHeight = rows;
  
  // Create a plane for each wall/platform in the level
  return (
    <group>
      {/* Background plane */}
      <mesh position={[0, boardHeight / 2 - 0.5, -0.5]} receiveShadow>
        <planeGeometry args={[boardWidth + 2, boardHeight + 2]} />
        <meshStandardMaterial color="#888888" />
      </mesh>
      
      {/* Floor and platforms */}
      {currentLevelData.map((row, y) => 
        row.map((cell, x) => {
          // Wall cells are represented by value 1 in level data
          if (cell === 1) {
            return (
              <mesh 
                key={`wall-${x}-${y}`}
                position={[x - 3.5, rows - y - 1, 0]}
                receiveShadow
                castShadow
              >
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial map={woodTexture} color="#8B4513" />
              </mesh>
            );
          }
          return null;
        })
      )}
      
      {/* Side walls */}
      <mesh position={[-cols/2 - 0.5, boardHeight/2 - 0.5, 0]} receiveShadow castShadow>
        <boxGeometry args={[1, boardHeight + 2, 1]} />
        <meshStandardMaterial map={woodTexture} color="#8B4513" />
      </mesh>
      
      <mesh position={[cols/2 + 0.5, boardHeight/2 - 0.5, 0]} receiveShadow castShadow>
        <boxGeometry args={[1, boardHeight + 2, 1]} />
        <meshStandardMaterial map={woodTexture} color="#8B4513" />
      </mesh>
      
      {/* Top wall */}
      <mesh position={[0, boardHeight + 0.5, 0]} receiveShadow castShadow>
        <boxGeometry args={[boardWidth + 3, 1, 1]} />
        <meshStandardMaterial map={woodTexture} color="#8B4513" />
      </mesh>
      
      {/* Bottom floor (always present) */}
      <mesh position={[0, -0.5, 0]} receiveShadow castShadow>
        <boxGeometry args={[boardWidth + 3, 1, 1]} />
        <meshStandardMaterial map={woodTexture} color="#8B4513" />
      </mesh>
    </group>
  );
}
