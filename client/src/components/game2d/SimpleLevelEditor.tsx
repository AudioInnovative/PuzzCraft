import { useState, useEffect } from 'react';
import { usePuzznic } from '../../lib/stores/usePuzznic';
import { cn } from '../../lib/utils';
import { useAudio } from '../../lib/stores/useAudio';

const CELL_SIZE = 40;
const GRID_SIZE = 8;
const BLOCK_SYMBOLS = ["✚", "■", "●", "×", "★", "◆", "▲", "♦"];

// Define block colors based on type (using modern gradient palette) - match the updated colors in Board.tsx
const blockColors = [
  "#FF5252", // Modern Red (type 1, typically floor)
  "#4CAF50", // Modern Green (type 2)
  "#448AFF", // Modern Blue (type 3)
  "#FFC107", // Modern Amber (type 4)
  "#E040FB", // Modern Purple (type 5)
  "#18FFFF", // Modern Cyan (type 6)
  "#FF9800", // Modern Orange (type 7)
  "#7C4DFF", // Modern Deep Purple (type 8)
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
      <div className="bg-gradient-to-r from-slate-900 via-gray-900 to-slate-900 text-white p-4 sticky top-0 z-10 shadow-lg border-b border-gray-800">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <span className="mr-2 text-blue-400">✏️</span>Level Editor
          </h2>
          <div className="flex gap-3">
            <button 
              onClick={() => exitEditMode()}
              className="bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white px-5 py-2 text-lg font-bold rounded-xl shadow-md active:translate-y-1 transition-all"
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
              className="bg-gradient-to-b from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white px-5 py-2 text-lg font-bold rounded-xl shadow-md active:translate-y-1 transition-all"
            >
              Test Level
            </button>
            
            <button 
              onClick={handleSaveLevel}
              className="bg-gradient-to-b from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white px-5 py-2 text-lg font-bold rounded-xl shadow-md active:translate-y-1 transition-all"
            >
              Save
            </button>
          </div>
        </div>
      </div>
      
      {/* Main layout */}
      <div className="flex flex-col md:flex-row flex-1 overflow-auto p-4 gap-4 bg-gradient-to-b from-gray-900 to-black">
        {/* Sidebar */}
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-6 rounded-xl flex flex-col gap-4 md:w-80 shadow-lg border border-gray-700">
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
                  // Floor/ground block style with modern rounded corners
                  <div 
                    className="w-full h-full rounded-xl flex items-center justify-center relative shadow-md"
                    style={{ 
                      width: CELL_SIZE, 
                      height: CELL_SIZE,
                      backgroundColor: '#BBBBBB', // Matching the color from the updated game
                      overflow: 'hidden'
                    }}
                  >
                    {/* Subtle gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white to-transparent opacity-30"></div>
                    
                    {/* Subtle grid lines */}
                    <div className="absolute top-0 left-0 w-full h-full grid grid-cols-2 grid-rows-2 opacity-50">
                      <div className="border-b border-r border-gray-600"></div>
                      <div className="border-b border-gray-600"></div>
                      <div className="border-r border-gray-600"></div>
                      <div></div>
                    </div>
                    
                    {/* Border */}
                    <div className="absolute inset-0 border border-gray-500 rounded-xl"></div>
                    
                    {/* Label */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-700 bg-gray-200 px-2 py-0.5 rounded-full shadow-sm opacity-90">
                        FLOOR
                      </span>
                    </div>
                  </div>
                ) : (
                  // Regular colored blocks with modern style
                  <div 
                    className="w-full h-full rounded-xl flex items-center justify-center relative shadow-md overflow-hidden"
                    style={{ 
                      backgroundColor: getBlockColor(type),
                      width: CELL_SIZE, 
                      height: CELL_SIZE 
                    }}
                  >
                    {/* Modern gradient overlay instead of flat bevels */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white to-transparent opacity-30"></div>
                    
                    {/* Subtle inner shadow effect at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-[10%] bg-black opacity-20"></div>
                    
                    {/* Block symbol with drop shadow */}
                    <div className="relative">
                      <span className="absolute text-black opacity-30 font-bold text-2xl" style={{top: '2px', left: '2px'}}>
                        {BLOCK_SYMBOLS[type-1]}
                      </span>
                      <span className="text-white font-bold text-2xl relative drop-shadow-md">
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
            className="w-full bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white py-3 text-lg font-bold rounded-xl shadow-md active:translate-y-1 mt-4 transition-all"
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
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-4 rounded-xl shadow-lg border border-gray-700">
            {/* The grid */}
            <div className="flex flex-col gap-1.5">
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
                            "relative rounded-lg flex items-center justify-center transition-all",
                            block ? "" : "bg-gradient-to-b from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700",
                            "shadow-inner"
                          )}
                          style={{ 
                            width: CELL_SIZE, 
                            height: CELL_SIZE,
                            border: block ? 'none' : '1px solid rgba(75, 85, 99, 0.4)'
                          }}
                          onClick={() => {
                            if (block) {
                              // Remove existing block (including floor blocks)
                              removeEditorBlock(gameX, gameY);
                              playHit();
                            } else if (selectedType) {
                              // Place selected block
                              placeEditorBlock(gameX, gameY, selectedType);
                              playHit();
                            }
                          }}
                        >
                          {/* Display block if it exists */}
                          {block && (
                            block.type === 1 ? (
                              // Type 1 blocks are floor blocks - modern style with rounded corners
                              <div className="w-full h-full rounded-xl flex items-center justify-center relative shadow-md overflow-hidden"
                                   style={{ backgroundColor: '#BBBBBB' }}>
                                {/* Subtle gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-b from-white to-transparent opacity-30"></div>
                                
                                {/* Subtle grid pattern */}
                                <div className="absolute top-0 left-0 w-full h-full grid grid-cols-2 grid-rows-2 opacity-50">
                                  <div className="border-b border-r border-gray-600"></div>
                                  <div className="border-b border-gray-600"></div>
                                  <div className="border-r border-gray-600"></div>
                                  <div></div>
                                </div>
                                
                                {/* Border */}
                                <div className="absolute inset-0 border border-gray-500 rounded-xl"></div>
                              </div>
                            ) : (
                              // Regular blocks with modern style
                              <div
                                className="w-full h-full rounded-xl flex items-center justify-center relative shadow-md overflow-hidden"
                                style={{ backgroundColor: getBlockColor(block.type) }}
                              >
                                {/* Modern gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-b from-white to-transparent opacity-30"></div>
                                
                                {/* Subtle inner shadow effect at bottom */}
                                <div className="absolute bottom-0 left-0 right-0 h-[10%] bg-black opacity-20"></div>
                                
                                {/* Block symbol with drop shadow for better readability */}
                                <div className="relative">
                                  <span className="absolute text-black opacity-30 font-bold" style={{top: '1px', left: '1px'}}>
                                    {BLOCK_SYMBOLS[block.type-1]}
                                  </span>
                                  <span className="text-white font-bold relative drop-shadow-md">
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