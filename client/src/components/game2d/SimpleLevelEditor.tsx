import { useState, useEffect } from 'react';
import { usePuzznic } from '../../lib/stores/usePuzznic';
import { cn } from '../../lib/utils';
import { useAudio } from '../../lib/stores/useAudio';

const CELL_SIZE = 40;
const GRID_SIZE = 8;
const BLOCK_SYMBOLS = ["✚", "■", "●", "×", "★", "◆", "▲", "♦"];

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
  
  // Check level validity whenever the board changes
  useEffect(() => {
    if (gamePhase === 'editing') {
      const levelData = generateLevelData();
      const valid = validateLevelData(levelData);
      setIsValid(valid);
      
      if (!valid) {
        setMessage('Each block type must appear an even number of times');
      } else {
        setMessage(null);
      }
    }
  }, [board, gamePhase, validateLevelData, generateLevelData]);
  
  // Only render in editing mode
  if (gamePhase !== 'editing') return null;
  
  const blockTypes = Array.from({ length: 7 }, (_, i) => i + 2);
  
  const handleSaveLevel = () => {
    if (isValid) {
      saveUserLevel();
      setMessage('Level saved successfully!');
      setTimeout(() => setMessage(null), 2000);
    } else {
      setMessage('Cannot save invalid level!');
      setTimeout(() => setMessage(null), 2000);
    }
  };
  
  // Function to get a color for each block type
  const getBlockColor = (type: number): string => {
    const colors = [
      '#FF0000', // Red (type 1, typically floor)
      '#4CAF50', // Green (type 2)
      '#2196F3', // Blue (type 3)
      '#FFC107', // Yellow (type 4)
      '#9C27B0', // Purple (type 5)
      '#FF9800', // Orange (type 6)
      '#E91E63', // Pink (type 7)
      '#00BCD4'  // Cyan (type 8)
    ];
    
    return colors[(type - 1) % colors.length];
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
              className="bg-red-600 text-white px-4 py-2 text-lg font-bold rounded-lg shadow-md active:translate-y-1"
            >
              Exit
            </button>
            
            <button 
              onClick={() => {
                if (isValid) {
                  const success = testLevel();
                  if (success) {
                    playHit();
                  } else {
                    setMessage("Cannot test invalid level!");
                    setTimeout(() => setMessage(null), 2000);
                  }
                } else {
                  setMessage("Cannot test invalid level!");
                  setTimeout(() => setMessage(null), 2000);
                }
              }}
              disabled={!isValid}
              className={
                isValid 
                  ? "bg-blue-600 text-white px-4 py-2 text-lg font-bold rounded-lg shadow-md active:translate-y-1" 
                  : "bg-gray-600 text-white px-4 py-2 text-lg font-bold rounded-lg opacity-50"
              }
            >
              Test Level
            </button>
            
            <button 
              onClick={handleSaveLevel}
              disabled={!isValid}
              className={
                isValid 
                  ? "bg-green-600 text-white px-4 py-2 text-lg font-bold rounded-lg shadow-md active:translate-y-1" 
                  : "bg-gray-600 text-white px-4 py-2 text-lg font-bold rounded-lg opacity-50"
              }
            >
              Save
            </button>
          </div>
        </div>
      </div>
      
      {/* Main layout */}
      <div className="flex flex-col md:flex-row flex-1 overflow-auto p-4 gap-4">
        {/* Sidebar */}
        <div className="bg-gray-800 p-4 rounded-lg flex flex-col gap-4 md:w-60">
          <div className="text-white text-xl font-semibold text-center mb-2">Block Types</div>
          
          <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
            {blockTypes.map(type => (
              <button 
                key={type}
                onClick={() => {
                  setSelectedType(type);
                  playHit();
                }}
                className={cn(
                  "h-16 cursor-pointer rounded-lg flex items-center justify-center shadow-md",
                  selectedType === type ? "ring-4 ring-white bg-gray-600" : "bg-gray-700 hover:ring-2 hover:ring-gray-400"
                )}
              >
                <div 
                  className="w-12 h-12 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: getBlockColor(type) }}
                >
                  <span className="text-white font-bold text-2xl">{BLOCK_SYMBOLS[type-1]}</span>
                </div>
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
            <p className="text-sm">• Each block type must have an even number</p>
          </div>
          
          {/* Status indicator */}
          <div className="mt-auto">
            <div className={cn(
              "py-2 text-lg font-bold rounded-lg shadow-md text-center",
              isValid ? "bg-green-600 text-white" : "bg-red-600 text-white"
            )}>
              {isValid ? 'Level Valid ✓' : 'Level Invalid ✗'}
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
                            
                            if (block && !block.isFloor) {
                              // Remove existing block
                              removeEditorBlock(gameX, gameY);
                              playHit();
                              console.log(`Removed block at game position x=${gameX}, y=${gameY}`);
                            } else if (selectedType && !(gameY === 0 && block?.isFloor)) {
                              // Place selected block
                              placeEditorBlock(gameX, gameY, selectedType);
                              playHit();
                              console.log(`Placed block type=${selectedType} at game position x=${gameX}, y=${gameY}`);
                            }
                          }}
                        >
                          {/* Display block if it exists */}
                          {block && (
                            <div
                              className="w-full h-full rounded-md flex items-center justify-center"
                              style={{ backgroundColor: getBlockColor(block.type) }}
                            >
                              <span className="text-white font-bold">
                                {BLOCK_SYMBOLS[block.type-1]}
                              </span>
                            </div>
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