import { useState, useEffect } from 'react';
import { usePuzznic } from '../../lib/stores/usePuzznic';
import { cn } from '../../lib/utils';
import { useAudio } from '../../lib/stores/useAudio';

const CELL_SIZE = 40;
const GRID_SIZE = 8;
const BLOCK_SYMBOLS = ["✚", "■", "●", "×", "★", "◆", "▲", "♦"];

// Define block colors based on type (using NES Puzznic color palette) - same as in Board.tsx
const blockColors = [
  "#FF0000", // Red (type 1, typically floor) 
  "#00FF00", // Green (type 2)
  "#0000FF", // Blue (type 3)
  "#FFFF00", // Yellow (type 4)
  "#FF00FF", // Magenta (type 5)
  "#00FFFF", // Cyan (type 6)
  "#FF8800", // Orange (type 7)
  "#8800FF", // Purple (type 8)
];

export default function SimpleLevelEditor() {
  const { 
    gamePhase, 
    board,
    userLevels,
    placeEditorBlock, 
    removeEditorBlock, 
    saveUserLevel, 
    exitEditMode,
    validateLevelData,
    generateLevelData,
    createEmptyLevel,
    loadUserLevel,
    testLevel
  } = usePuzznic();
  
  const { playHit } = useAudio();
  
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);
  
  // Level validation is no longer required
  useEffect(() => {
    if (gamePhase === 'editing') {
      // All levels are valid now
      setIsValid(true);
      setMessage(null);
    }
  }, [gamePhase]);
  
  // Only render in editing mode
  if (gamePhase !== 'editing') return null;
  
  // Include floor/ground block (type 1) and regular blocks (types 2-8)
  const blockTypes = [1, ...Array.from({ length: 7 }, (_, i) => i + 2)];
  
  const handleSaveLevel = () => {
    saveUserLevel();
    setMessage('Level saved successfully!');
    setTimeout(() => setMessage(null), 2000);
  };
  
  // Function to get a color for each block type - Use the same colors as the game
  const getBlockColor = (type: number): string => {
    return blockColors[(type - 1) % blockColors.length];
  };
  
  return (
    <div className="absolute inset-0 flex flex-col bg-black overflow-auto">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Simple Level Editor</h2>
          <div className="flex space-x-3">
            <button 
              onClick={() => exitEditMode()}
              className="bg-blue-600 text-white px-4 py-2 text-lg font-bold rounded-lg shadow-md active:translate-y-1"
            >
              Main Menu
            </button>
            
            <button 
              onClick={() => {
                const success = testLevel();
                if (success) {
                  playHit();
                }
              }}
              className="bg-red-600 text-white px-4 py-2 text-lg font-bold rounded-lg shadow-md active:translate-y-1"
            >
              Test Level
            </button>
            
            <button 
              onClick={handleSaveLevel}
              className="bg-green-600 text-white px-4 py-2 text-lg font-bold rounded-lg shadow-md active:translate-y-1"
            >
              Save
            </button>
          </div>
        </div>
      </div>
      
      {/* Main layout */}
      <div className="flex flex-col md:flex-row flex-1 overflow-auto p-4 gap-4">
        {/* Sidebar */}
        <div className="bg-gray-800 p-4 rounded-lg flex flex-col gap-4 md:w-80">
          <div className="text-white text-xl font-semibold text-center mb-2">Block Types</div>
          
          <div className="grid grid-cols-2 gap-4 place-items-center">
            {blockTypes.map(type => (
              <button 
                key={type}
                onClick={() => {
                  setSelectedType(type);
                  playHit();
                }}
                className={cn(
                  "cursor-pointer rounded-lg flex items-center justify-center shadow-md",
                  selectedType === type ? "ring-4 ring-white bg-gray-600" : "bg-gray-700 hover:ring-2 hover:ring-gray-400"
                )}
                style={{ padding: '4px' }}
              >
                {type === 1 ? (
                  // Floor/ground block style (gray tile with grid)
                  <div 
                    className="w-full h-full rounded-md flex items-center justify-center relative"
                    style={{ 
                      width: CELL_SIZE, 
                      height: CELL_SIZE,
                      backgroundColor: '#d1d5db' // Gray color
                    }}
                  >
                    {/* Grid lines to match NES floor blocks */}
                    <div className="absolute top-0 left-0 w-full h-full grid grid-cols-2 grid-rows-2">
                      <div className="border-b border-r border-gray-500"></div>
                      <div className="border-b border-gray-500"></div>
                      <div className="border-r border-gray-500"></div>
                      <div></div>
                    </div>
                    {/* Border */}
                    <div className="absolute inset-0 border-2 border-gray-600 rounded-md"></div>
                    
                    {/* Label */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-700 bg-gray-300 px-1 rounded opacity-80">
                        FLOOR
                      </span>
                    </div>
                  </div>
                ) : (
                  // Regular colored blocks with 3D effect
                  <div 
                    className="w-full h-full rounded-md flex items-center justify-center relative overflow-hidden"
                    style={{ 
                      backgroundColor: getBlockColor(type),
                      width: CELL_SIZE, 
                      height: CELL_SIZE 
                    }}
                  >
                    {/* 3D bevel effect - top/left highlight */}
                    <div className="absolute top-0 left-0 right-0 h-[20%] bg-white opacity-40"></div>
                    <div className="absolute top-0 left-0 bottom-0 w-[20%] bg-white opacity-40"></div>
                    
                    {/* 3D bevel effect - bottom/right shadow */}
                    <div className="absolute bottom-0 left-0 right-0 h-[20%] bg-black opacity-40"></div>
                    <div className="absolute top-0 right-0 bottom-0 w-[20%] bg-black opacity-40"></div>
                    
                    {/* Block symbol with drop shadow */}
                    <div className="relative">
                      <span className="absolute text-black opacity-30 font-bold text-2xl" style={{top: '2px', left: '2px'}}>
                        {BLOCK_SYMBOLS[type-1]}
                      </span>
                      <span className="text-white font-bold text-2xl relative">
                        {BLOCK_SYMBOLS[type-1]}
                      </span>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => {
              createEmptyLevel();
              playHit();
              setMessage("Created new empty level");
              setTimeout(() => setMessage(null), 2000);
            }}
            className="w-full bg-blue-600 text-white py-3 text-lg font-bold rounded-lg shadow-md active:translate-y-1 mt-4"
          >
            New Level
          </button>
          
          {/* Instructions */}
          <div className="mt-4 text-white">
            <p className="text-center mb-2 font-semibold">Instructions:</p>
            <p className="text-sm mb-1">• Select a block type from the sidebar</p>
            <p className="text-sm mb-1">• Click in the grid to place it</p>
            <p className="text-sm mb-1">• Click on an existing block to remove it</p>
            <p className="text-sm">• Create any level design you want</p>
          </div>
          
          {/* Status indicator */}
          <div className="mt-auto">
            <div className="py-2 text-lg font-bold rounded-lg shadow-md text-center bg-green-600 text-white">
              Ready to Test/Save
            </div>
            
            {message && (
              <div className="mt-2 text-yellow-300 text-sm font-medium p-2 bg-gray-900 rounded-lg text-center">
                {message}
              </div>
            )}
          </div>
        </div>
        
        {/* Grid area */}
        <div className="flex-1 flex flex-col items-center overflow-auto p-4">
          <div className="bg-gray-800 p-2 rounded-lg">
            {/* The grid */}
            <div className="flex flex-col gap-1">
              {Array.from({ length: GRID_SIZE }).map((_, rowIndex) => {
                // Convert visual row to game row (y)
                // Game Y=0 is at the bottom, but we display top-to-bottom
                const gameY = GRID_SIZE - rowIndex - 1;
                
                return (
                  <div key={`row-${rowIndex}`} className="flex flex-row gap-1">
                    {Array.from({ length: GRID_SIZE }).map((_, colIndex) => {
                      // Game X is the same as visual column
                      const gameX = colIndex;
                      
                      // Get the block at this position
                      const block = board[gameY][gameX];
                      
                      return (
                        <div
                          key={`cell-${rowIndex}-${colIndex}`}
                          className={cn(
                            "relative rounded-md flex items-center justify-center",
                            "border border-gray-700",
                            block ? "" : "bg-gray-700"
                          )}
                          style={{ width: CELL_SIZE, height: CELL_SIZE }}
                          onClick={() => {
                            console.log(`Clicked at visual row=${rowIndex}, col=${colIndex}, maps to game x=${gameX}, y=${gameY}`);
                            
                            if (block) {
                              // Remove existing block (including floor blocks)
                              removeEditorBlock(gameX, gameY);
                              playHit();
                              console.log(`Removed block at game position x=${gameX}, y=${gameY}`);
                            } else if (selectedType) {
                              // Place selected block
                              placeEditorBlock(gameX, gameY, selectedType);
                              playHit();
                              console.log(`Placed block type=${selectedType} at game position x=${gameX}, y=${gameY}`);
                            }
                          }}
                        >
                          {/* Display block if it exists */}
                          {block && (
                            block.type === 1 ? (
                              // Type 1 blocks are always floor blocks - gray tile design
                              <div className="w-full h-full rounded-md flex items-center justify-center bg-gray-300 relative">
                                {/* Grid lines to match NES floor blocks */}
                                <div className="absolute top-0 left-0 w-full h-full grid grid-cols-2 grid-rows-2">
                                  <div className="border-b border-r border-gray-500"></div>
                                  <div className="border-b border-gray-500"></div>
                                  <div className="border-r border-gray-500"></div>
                                  <div></div>
                                </div>
                                {/* Border */}
                                <div className="absolute inset-0 border-2 border-gray-600 rounded-md"></div>
                              </div>
                            ) : (
                              // Regular blocks with 3D effect
                              <div
                                className="w-full h-full rounded-md flex items-center justify-center relative overflow-hidden"
                                style={{ backgroundColor: getBlockColor(block.type) }}
                              >
                                {/* 3D bevel effect - top/left highlight */}
                                <div className="absolute top-0 left-0 right-0 h-[20%] bg-white opacity-40 clip-polygon"></div>
                                <div className="absolute top-0 left-0 bottom-0 w-[20%] bg-white opacity-40 clip-polygon"></div>
                                
                                {/* 3D bevel effect - bottom/right shadow */}
                                <div className="absolute bottom-0 left-0 right-0 h-[20%] bg-black opacity-40 clip-polygon"></div>
                                <div className="absolute top-0 right-0 bottom-0 w-[20%] bg-black opacity-40 clip-polygon"></div>
                                
                                {/* Block symbol with drop shadow for better readability */}
                                <div className="relative">
                                  <span className="absolute text-black opacity-30 font-bold" style={{top: '2px', left: '2px'}}>
                                    {BLOCK_SYMBOLS[block.type-1]}
                                  </span>
                                  <span className="text-white font-bold relative">
                                    {BLOCK_SYMBOLS[block.type-1]}
                                  </span>
                                </div>
                              </div>
                            )
                          )}
                          
                          {/* Display coordinates for debugging */}
                          <span className="absolute text-[6px] text-white opacity-40 top-0 left-0.5">
                            {gameX},{gameY}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Saved levels section */}
          {userLevels.length > 0 && (
            <div className="w-full mt-4">
              <div className="text-white text-xl font-semibold mb-3 text-center">
                Saved Levels: {userLevels.length}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {userLevels.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      loadUserLevel(index);
                      playHit();
                      setMessage(`Level ${index + 1} loaded`);
                      setTimeout(() => setMessage(null), 2000);
                    }}
                    className="bg-blue-700 text-white py-3 text-base font-semibold rounded-lg shadow-md active:translate-y-1"
                  >
                    Level {index + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}