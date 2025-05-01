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
  const isMobile = useIsMobile();
  
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
  
  return (
    <div className="absolute inset-0 flex flex-col bg-black">
      {/* Editor Header - Simplified for mobile */}
      <div className="bg-gray-900 text-white p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Editor</h2>
          <div className="flex space-x-3">
            <button 
              onClick={() => exitEditMode()}
              className="bg-red-600 text-white px-5 py-3 text-xl font-bold rounded-lg shadow-md active:translate-y-1"
            >
              Exit
            </button>
            <button 
              onClick={handleSaveLevel}
              disabled={!isValid}
              className={
                isValid 
                  ? "bg-green-600 text-white px-5 py-3 text-xl font-bold rounded-lg shadow-md active:translate-y-1" 
                  : "bg-gray-600 text-white px-5 py-3 text-xl font-bold rounded-lg opacity-50"
              }
            >
              Save
            </button>
          </div>
        </div>
      </div>
      
      {/* Block Selection - Simplified for mobile */}
      <div className="bg-gray-800 p-3">
        <div className="flex justify-between items-center mb-3">
          <div className="text-white text-xl font-semibold">Select Block:</div>
          <button
            onClick={() => {
              createEmptyLevel();
              playHit();
              setMessage("New level created");
              setTimeout(() => setMessage(null), 2000);
            }}
            className="bg-blue-600 text-white px-5 py-3 text-xl font-bold rounded-lg shadow-md active:translate-y-1"
          >
            New
          </button>
        </div>
        
        <div className="grid grid-cols-4 gap-4 w-full mb-3">
          {blockTypes.map(type => (
            <div 
              key={type}
              onClick={() => setEditorBlockType(type)}
              className={cn(
                "h-16 cursor-pointer rounded-lg flex items-center justify-center",
                currentEditingBlockType === type 
                  ? "ring-4 ring-white shadow-lg" 
                  : "ring-1 ring-gray-600"
              )}
              style={{
                backgroundColor: getBlockColor(type)
              }}
            >
              <span className="text-white font-bold text-3xl">{blockSymbols[type-1]}</span>
            </div>
          ))}
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <span className={
            isValid 
              ? "px-4 py-2 bg-green-600 text-white text-lg font-bold rounded-lg" 
              : "px-4 py-2 bg-red-600 text-white text-lg font-bold rounded-lg"
          }>
            {isValid ? 'Valid' : 'Invalid'}
          </span>
          {message && (
            <div className="text-yellow-300 text-lg font-semibold px-4 py-2 bg-gray-900 rounded-lg">
              {message}
            </div>
          )}
        </div>
      </div>
      
      {/* User Level Browser - Simplified */}
      {userLevels.length > 0 && (
        <div className="bg-gray-900 p-4">
          <div className="text-white text-xl font-semibold mb-3">
            Saved Levels: {userLevels.length}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {userLevels.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  usePuzznic.getState().loadUserLevel(index);
                  playHit();
                  setMessage(`Level ${index + 1} loaded`);
                  setTimeout(() => setMessage(null), 2000);
                }}
                className="bg-blue-700 text-white py-4 text-xl font-bold rounded-lg shadow-md active:translate-y-1"
              >
                #{index + 1}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Editor Instructions - Simplified */}
      <div className="bg-gray-900 p-4 text-white text-center border-t border-gray-700">
        {isMobile ? (
          <p className="text-lg leading-relaxed">
            Tap to place/remove blocks. <br />
            Blocks must be in pairs.
          </p>
        ) : (
          <p className="text-lg leading-relaxed">
            Click to place or remove blocks. <br />
            Each block type must appear in pairs.
          </p>
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