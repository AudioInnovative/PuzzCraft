import { useState, useEffect } from 'react';
import { usePuzznic } from '../../lib/stores/usePuzznic';
import { cn } from '../../lib/utils';
import { useAudio } from '../../lib/stores/useAudio';
import { useIsMobile } from '../../hooks/use-is-mobile';

// Define block symbols based on original Puzznic
const blockSymbols = ["✚", "■", "●", "×", "★", "◆", "▲", "♦", "◇", "○"];

export default function LevelEditor() {
  const { 
    gamePhase, 
    board, 
    currentEditingBlockType, 
    userLevels,
    placeEditorBlock, 
    removeEditorBlock, 
    setEditorBlockType, 
    saveUserLevel, 
    exitEditMode,
    validateLevelData,
    generateLevelData,
    createEmptyLevel
  } = usePuzznic();
  
  const { playHit } = useAudio();
  
  const [message, setMessage] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);
  
  // Check level validity whenever the board changes
  useEffect(() => {
    if (gamePhase === 'editing') {
      const levelData = generateLevelData();
      const valid = validateLevelData(levelData);
      setIsValid(valid);
      
      if (!valid) {
        setMessage('Level not valid! Each block type must appear an even number of times.');
      } else {
        setMessage(null);
      }
    }
  }, [board, gamePhase, validateLevelData, generateLevelData]);
  
  // Only render in editing mode
  if (gamePhase !== 'editing') return null;
  
  // Calculate maximum block type (default is 6, but could be more)
  const maxBlockType = 8;
  
  // Generate an array of block types for the palette
  const blockTypes = Array.from({ length: maxBlockType - 1 }, (_, i) => i + 2);
  
  const handleBlockClick = (x: number, y: number) => {
    // If there's a block at this position, remove it
    if (board[y][x] !== null && !board[y][x]?.isFloor) {
      removeEditorBlock(x, y);
      playHit();
    } 
    // Otherwise place a new block of the current type
    else {
      placeEditorBlock(x, y, currentEditingBlockType);
      playHit();
    }
  };
  
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
  
  const isMobile = useIsMobile();
  
  return (
    <div className="absolute inset-0 flex flex-col bg-blue-900/30 backdrop-blur-md">
      {/* Editor Header */}
      <div className="bg-gray-900 text-white p-3 border-b-2 border-cyan-600">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl uppercase text-cyan-300 font-mono">LEVEL EDITOR</h2>
          <div className="flex space-x-2">
            <button 
              onClick={() => exitEditMode()}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 text-sm uppercase font-mono"
            >
              Exit
            </button>
            <button 
              onClick={handleSaveLevel}
              disabled={!isValid}
              className={cn(
                "px-3 py-2 text-white text-sm uppercase font-mono",
                isValid 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "bg-gray-600 cursor-not-allowed"
              )}
            >
              Save
            </button>
          </div>
        </div>
        {isMobile && (
          <p className="text-xs text-cyan-300 font-mono mt-1">Tap on grid to place/remove blocks</p>
        )}
      </div>
      
      {/* Block Type Palette */}
      <div className="bg-gray-800 p-2 flex flex-wrap gap-2 border-b-2 border-cyan-600">
        <div className="flex justify-between items-center w-full">
          <div className="text-white font-mono text-sm uppercase flex items-center">
            SELECT BLOCK:
          </div>
          <button
            onClick={() => {
              createEmptyLevel();
              playHit();
              setMessage("Created new empty level");
              setTimeout(() => setMessage(null), 2000);
            }}
            className="bg-blue-600 text-white px-3 py-1 text-sm uppercase font-mono hover:bg-blue-500"
          >
            New Level
          </button>
        </div>
        <div className="flex flex-wrap gap-3 justify-center w-full py-2">
          {blockTypes.map(type => (
            <div 
              key={type}
              onClick={() => setEditorBlockType(type)}
              className={cn(
                "w-12 h-12 cursor-pointer border-2 flex items-center justify-center",
                currentEditingBlockType === type 
                  ? "border-yellow-400 shadow-lg" 
                  : "border-gray-700"
              )}
              style={{
                backgroundColor: getBlockColor(type),
                boxShadow: currentEditingBlockType === type ? "0 0 10px rgba(255,255,0,0.5)" : "none"
              }}
            >
              <span className="text-white font-bold text-xl">{blockSymbols[type-1]}</span>
            </div>
          ))}
        </div>
        <div className="w-full flex justify-between items-center mt-1">
          <span className={cn(
            "px-3 py-1 text-white font-mono text-base",
            isValid ? "bg-green-700" : "bg-red-700"
          )}>
            {isValid ? 'VALID' : 'INVALID'}
          </span>
          {message && (
            <div className="text-yellow-300 font-mono text-base">
              {message}
            </div>
          )}
        </div>
      </div>
      
      {/* User Level Browser */}
      {userLevels.length > 0 && (
        <div className="bg-gray-900 p-3 border-b-2 border-cyan-600">
          <div className="text-white font-mono text-sm uppercase flex items-center mb-2">
            SAVED LEVELS: {userLevels.length}
          </div>
          <div className="flex flex-wrap gap-2">
            {userLevels.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  usePuzznic.getState().loadUserLevel(index);
                  playHit();
                  setMessage(`Level ${index + 1} loaded!`);
                  setTimeout(() => setMessage(null), 2000);
                }}
                className="bg-blue-700 hover:bg-blue-600 text-white px-3 py-2 text-sm font-mono rounded"
              >
                LEVEL {index + 1}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Editor Info */}
      <div className="bg-gray-900 p-3 border-b-2 border-cyan-600 text-cyan-300 font-mono">
        {isMobile ? (
          <>
            <div className="text-sm mb-1">- TAP GRID TO PLACE/REMOVE</div>
            <div className="text-sm mb-1">- BLOCKS MUST BE IN PAIRS</div>
            <div className="text-sm">- FLOOR BLOCKS ARE FIXED</div>
          </>
        ) : (
          <>
            <div className="text-sm mb-1">- CLICK ON THE GRID TO PLACE OR REMOVE BLOCKS</div>
            <div className="text-sm mb-1">- EACH BLOCK TYPE MUST APPEAR AN EVEN NUMBER OF TIMES</div>
            <div className="text-sm">- FLOOR BLOCKS CANNOT BE EDITED</div>
          </>
        )}
      </div>
    </div>
  );
}

// Helper function to get a color for each block type
function getBlockColor(type: number): string {
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
  
  // Use modulo to handle any block type value
  return colors[(type - 1) % colors.length];
}