import { useState, useEffect } from 'react';
import { usePuzznic } from '../../lib/stores/usePuzznic';
import { cn } from '../../lib/utils';
import { useAudio } from '../../lib/stores/useAudio';

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
    generateLevelData
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
      const success = saveUserLevel();
      if (success) {
        setMessage('Level saved successfully!');
        setTimeout(() => setMessage(null), 2000);
      }
    } else {
      setMessage('Cannot save invalid level!');
      setTimeout(() => setMessage(null), 2000);
    }
  };
  
  return (
    <div className="absolute inset-0 flex flex-col bg-blue-900/30 backdrop-blur-md">
      {/* Editor Header */}
      <div className="bg-gray-900 text-white p-3 flex justify-between items-center border-b-2 border-cyan-600">
        <h2 className="text-xl uppercase text-cyan-300 font-mono">LEVEL EDITOR</h2>
        <div className="flex space-x-3">
          <button 
            onClick={() => exitEditMode()}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm uppercase font-mono"
          >
            Exit Editor
          </button>
          <button 
            onClick={handleSaveLevel}
            disabled={!isValid}
            className={cn(
              "px-3 py-1 text-white text-sm uppercase font-mono",
              isValid 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-gray-600 cursor-not-allowed"
            )}
          >
            Save Level
          </button>
        </div>
      </div>
      
      {/* Block Type Palette */}
      <div className="bg-gray-800 p-2 flex space-x-2 border-b-2 border-cyan-600">
        <div className="text-white font-mono text-sm uppercase flex items-center mr-2">
          SELECT BLOCK:
        </div>
        {blockTypes.map(type => (
          <div 
            key={type}
            onClick={() => setEditorBlockType(type)}
            className={cn(
              "w-10 h-10 cursor-pointer border-2",
              currentEditingBlockType === type 
                ? "border-yellow-400 shadow-lg" 
                : "border-gray-700"
            )}
            style={{
              backgroundColor: getBlockColor(type),
              boxShadow: currentEditingBlockType === type ? "0 0 10px rgba(255,255,0,0.5)" : "none"
            }}
          />
        ))}
        <div className="ml-4 text-white font-mono text-sm flex items-center">
          <span className={cn(
            "px-2 py-1",
            isValid ? "bg-green-700" : "bg-red-700"
          )}>
            {isValid ? 'VALID' : 'INVALID'}
          </span>
        </div>
        {message && (
          <div className="ml-4 text-yellow-300 font-mono text-sm flex items-center">
            {message}
          </div>
        )}
      </div>
      
      {/* User Level Browser */}
      {userLevels.length > 0 && (
        <div className="bg-gray-900 p-2 flex space-x-2 border-b-2 border-cyan-600">
          <div className="text-white font-mono text-sm uppercase flex items-center mr-2">
            SAVED LEVELS: {userLevels.length}
          </div>
        </div>
      )}
      
      {/* Editor Info */}
      <div className="bg-gray-900 p-2 border-b-2 border-cyan-600 text-sm text-cyan-300 font-mono">
        <div>- CLICK ON THE GRID TO PLACE OR REMOVE BLOCKS</div>
        <div>- EACH BLOCK TYPE MUST APPEAR AN EVEN NUMBER OF TIMES</div>
        <div>- FLOOR BLOCKS CANNOT BE EDITED</div>
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