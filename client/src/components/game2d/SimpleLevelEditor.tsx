import { useState, useEffect } from 'react';
import { usePuzznic } from '../../lib/stores/usePuzznic';
import { cn } from '../../lib/utils';
import { useAudio } from '../../lib/stores/useAudio';

const CELL_SIZE = 40;
const GRID_SIZE = 8;
const BLOCK_SYMBOLS = ["✚", "■", "●", "×", "★", "◆", "▲", "♦"];

// Match the game's block colors exactly
const blockColors = [
  "#FF0000", // Vivid Red (type 1, typically floor)
  "#00FF00", // Bright Green (type 2)
  "#00FFFF", // Brilliant Cyan (type 3)
  "#FFFF00", // Vivid Yellow (type 4)
  "#FF00FF", // Vibrant Magenta (type 5)
  "#4D4DFF", // Electric Blue (type 6)
  "#FF7700", // Blazing Orange (type 7)
  "#AA00FF", // Deep Purple (type 8)
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
      <div className="bg-black p-4 sticky top-0 z-10 shadow-lg border-b-4 border-cyan-600">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-cyan-300 flex items-center font-mono tracking-wider">
            LEVEL EDITOR
          </h2>
          <div className="flex gap-3">
            <button 
              onClick={() => exitEditMode()}
              className="bg-blue-600 hover:bg-blue-800 text-white font-bold py-2 px-4 border-2 border-white"
            >
              MAIN MENU
            </button>
            
            <button 
              onClick={() => {
                const success = testLevel();
                if (success) {
                  playHit();
                }
              }}
              className="bg-red-600 hover:bg-red-800 text-white font-bold py-2 px-4 border-2 border-white"
            >
              TEST LEVEL
            </button>
            
            <button 
              onClick={handleSaveLevel}
              className="bg-green-600 hover:bg-green-800 text-white font-bold py-2 px-4 border-2 border-white"
            >
              SAVE
            </button>
          </div>
        </div>
      </div>
      
      {/* Main layout */}
      <div className="flex flex-col md:flex-row flex-1 overflow-auto p-4 gap-4 bg-black">
        {/* Sidebar */}
        <div className="bg-black p-6 flex flex-col gap-4 md:w-80 shadow-lg border-4 border-cyan-600">
          <div className="text-cyan-300 text-xl font-bold text-center mb-2 font-mono tracking-wider">BLOCK TYPES</div>
          
          <div className="grid grid-cols-2 gap-4 place-items-center">
            {blockTypes.map(type => (
              <button 
                key={type}
                onClick={() => {
                  setSelectedType(type);
                  playHit();
                }}
                className={cn(
                  "cursor-pointer flex items-center justify-center",
                  selectedType === type ? "ring-4 ring-white" : "hover:ring-2 hover:ring-gray-400"
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
                  // Regular colored blocks with 3D solid style matching the game
                  <div 
                    className="w-full h-full rounded-xl flex items-center justify-center relative shadow-md overflow-hidden"
                    style={{ 
                      width: CELL_SIZE, 
                      height: CELL_SIZE
                    }}
                  >
                    {/* Base darker color */}
                    <div className="absolute inset-0" 
                      style={{ 
                        backgroundColor: `rgb(${parseInt(getBlockColor(type).substring(1, 3), 16) * 0.4}, ${parseInt(getBlockColor(type).substring(3, 5), 16) * 0.4}, ${parseInt(getBlockColor(type).substring(5, 7), 16) * 0.4})`,
                        borderRadius: '8px'
                      }}
                    />
                    
                    {/* Inner 3D bevel effect */}
                    <div className="absolute inset-0 m-[2px] rounded-lg"
                      style={{ 
                        background: `linear-gradient(135deg, 
                          rgb(${Math.min(255, parseInt(getBlockColor(type).substring(1, 3), 16) * 0.9)}, ${Math.min(255, parseInt(getBlockColor(type).substring(3, 5), 16) * 0.9)}, ${Math.min(255, parseInt(getBlockColor(type).substring(5, 7), 16) * 0.9)}) 0%, 
                          rgb(${parseInt(getBlockColor(type).substring(1, 3), 16) * 0.7}, ${parseInt(getBlockColor(type).substring(3, 5), 16) * 0.7}, ${parseInt(getBlockColor(type).substring(5, 7), 16) * 0.7}) 50%, 
                          rgb(${parseInt(getBlockColor(type).substring(1, 3), 16) * 0.3}, ${parseInt(getBlockColor(type).substring(3, 5), 16) * 0.3}, ${parseInt(getBlockColor(type).substring(5, 7), 16) * 0.3}) 100%)`,
                      }}
                    />
                    
                    {/* Subtle top highlight for 3D effect */}
                    <div className="absolute top-0 left-0 right-0 h-1/3 rounded-t-lg opacity-30"
                      style={{ 
                        background: `linear-gradient(to bottom, 
                          rgba(255, 255, 255, 0.3) 0%, 
                          rgba(255, 255, 255, 0) 100%)`,
                      }}
                    />
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
            className="w-full bg-blue-600 hover:bg-blue-800 text-white py-2 text-lg font-bold border-2 border-white mt-4 font-mono"
          >
            NEW LEVEL
          </button>
          
          {/* Instructions */}
          <div className="mt-4 bg-blue-900 border-2 border-blue-700 p-4">
            <p className="text-cyan-300 font-mono mb-2 font-semibold text-center">HOW TO USE:</p>
            <p className="text-white mb-1 font-mono text-sm">• SELECT A BLOCK TYPE</p>
            <p className="text-white mb-1 font-mono text-sm">• CLICK IN GRID TO PLACE</p>
            <p className="text-white mb-1 font-mono text-sm">• CLICK BLOCK TO REMOVE</p>
            <p className="text-white font-mono text-sm">• DESIGN YOUR LEVEL</p>
          </div>
          
          {/* Status indicator */}
          <div className="mt-auto">
            <div className="py-2 text-lg font-bold text-center bg-green-600 text-white border-2 border-white font-mono">
              READY TO TEST/SAVE
            </div>
            
            {message && (
              <div className="mt-2 text-yellow-300 text-center p-2 bg-gray-900 font-mono">
                {message}
              </div>
            )}
          </div>
        </div>
        
        {/* Grid area */}
        <div className="flex-1 flex flex-col items-center overflow-auto p-4">
          <div className="bg-black p-4 shadow-lg border-4 border-cyan-600">
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
                            "relative flex items-center justify-center transition-all",
                            block ? "" : "bg-gray-900 hover:bg-gray-800"
                          )}
                          style={{ 
                            width: CELL_SIZE, 
                            height: CELL_SIZE,
                            border: block ? 'none' : '1px solid rgba(44, 185, 210, 0.4)'
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
                              // Regular colored blocks with 3D solid style matching the game
                              <div 
                                className="w-full h-full rounded-xl flex items-center justify-center relative shadow-md overflow-hidden"
                              >
                                {/* Base darker color */}
                                <div className="absolute inset-0" 
                                  style={{ 
                                    backgroundColor: `rgb(${parseInt(getBlockColor(block.type).substring(1, 3), 16) * 0.4}, ${parseInt(getBlockColor(block.type).substring(3, 5), 16) * 0.4}, ${parseInt(getBlockColor(block.type).substring(5, 7), 16) * 0.4})`,
                                    borderRadius: '8px'
                                  }}
                                />
                                
                                {/* Inner 3D bevel effect */}
                                <div className="absolute inset-0 m-[2px] rounded-lg"
                                  style={{ 
                                    background: `linear-gradient(135deg, 
                                      rgb(${Math.min(255, parseInt(getBlockColor(block.type).substring(1, 3), 16) * 0.9)}, ${Math.min(255, parseInt(getBlockColor(block.type).substring(3, 5), 16) * 0.9)}, ${Math.min(255, parseInt(getBlockColor(block.type).substring(5, 7), 16) * 0.9)}) 0%, 
                                      rgb(${parseInt(getBlockColor(block.type).substring(1, 3), 16) * 0.7}, ${parseInt(getBlockColor(block.type).substring(3, 5), 16) * 0.7}, ${parseInt(getBlockColor(block.type).substring(5, 7), 16) * 0.7}) 50%, 
                                      rgb(${parseInt(getBlockColor(block.type).substring(1, 3), 16) * 0.3}, ${parseInt(getBlockColor(block.type).substring(3, 5), 16) * 0.3}, ${parseInt(getBlockColor(block.type).substring(5, 7), 16) * 0.3}) 100%)`,
                                  }}
                                />
                                
                                {/* Subtle top highlight for 3D effect */}
                                <div className="absolute top-0 left-0 right-0 h-1/3 rounded-t-lg opacity-30"
                                  style={{ 
                                    background: `linear-gradient(to bottom, 
                                      rgba(255, 255, 255, 0.3) 0%, 
                                      rgba(255, 255, 255, 0) 100%)`,
                                  }}
                                />
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
            <div className="w-full mt-4 border-4 border-cyan-600 bg-black p-4">
              <div className="text-cyan-300 text-xl font-bold mb-3 text-center font-mono tracking-wider">
                SAVED LEVELS: {userLevels.length}
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
                    className="bg-blue-600 hover:bg-blue-800 text-white py-2 font-bold border-2 border-white font-mono"
                  >
                    LEVEL {index + 1}
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