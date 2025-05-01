import { useState, useEffect, useRef, DragEvent } from 'react';
import { usePuzznic } from '../../lib/stores/usePuzznic';
import { BlockType } from '../../lib/stores/usePuzznic';
import { cn } from '../../lib/utils';
import { useAudio } from '../../lib/stores/useAudio';
import { useIsMobile } from '../../hooks/use-is-mobile';

// Define block symbols based on original Puzznic
const blockSymbols = ["✚", "■", "●", "×", "★", "◆", "▲", "♦", "◇", "○"];

// Grid cell size for the editor
const CELL_SIZE = 40;

export default function LevelEditor() {
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
    loadUserLevel
  } = usePuzznic();
  
  const { playHit } = useAudio();
  const isMobile = useIsMobile();
  
  const [message, setMessage] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);
  const [draggedBlockType, setDraggedBlockType] = useState<number | null>(null);
  const editorGridRef = useRef<HTMLDivElement>(null);
  
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
  
  // Calculate maximum block type (default is 6, but could be more)
  const maxBlockType = 8;
  
  // Generate an array of block types for the palette
  const blockTypes = Array.from({ length: maxBlockType - 1 }, (_, i) => i + 2);
  
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
  
  // Drag handlers
  const handleDragStart = (e: DragEvent<HTMLDivElement>, blockType: number) => {
    setDraggedBlockType(blockType);
    
    // Set drag image (transparent 1x1 pixel)
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
    
    // Add some data to the drag operation
    e.dataTransfer.setData('text/plain', blockType.toString());
    e.dataTransfer.effectAllowed = 'copy';
  };
  
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };
  
  const handleDrop = (e: DragEvent<HTMLDivElement>, row: number, col: number) => {
    e.preventDefault();
    
    if (draggedBlockType !== null) {
      // Convert grid coordinates to game coordinates
      // In the UI grid, row 0 is at the top, but in the game grid, y=0 is at the bottom
      const gameY = board.length - row - 1;
      
      // Don't allow placing blocks on the floor row
      if (gameY === 0 && board[gameY][col]?.isFloor) {
        return;
      }
      
      // Place the block
      placeEditorBlock(col, gameY, draggedBlockType);
      playHit();
    }
    
    setDraggedBlockType(null);
  };
  
  // Handle cell click to remove blocks
  const handleCellClick = (row: number, col: number) => {
    // Convert grid coordinates to game coordinates
    const gameY = board.length - row - 1;
    
    // If there's a block that isn't a floor block, remove it
    if (board[gameY][col] !== null && !board[gameY][col]?.isFloor) {
      removeEditorBlock(col, gameY);
      playHit();
    }
  };
  
  // Create the grid display
  const renderEditorGrid = () => {
    const rows = board.length;
    const cols = board[0].length;
    
    // Create a 2D array for UI display (reversed rows to match UI display)
    const displayGrid: (BlockType | null)[][] = [];
    
    // Copy and reverse the board for UI display (top-down)
    for (let y = rows - 1; y >= 0; y--) {
      const displayRow: (BlockType | null)[] = [];
      for (let x = 0; x < cols; x++) {
        displayRow.push(board[y][x]);
      }
      displayGrid.push(displayRow);
    }
    
    return (
      <div 
        ref={editorGridRef}
        className="grid grid-cols-8 gap-1 bg-gray-800 p-2 rounded-lg"
        style={{ width: cols * (CELL_SIZE + 4), height: rows * (CELL_SIZE + 4) }}
      >
        {displayGrid.map((row, rowIndex) => (
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className="bg-gray-700 rounded-md flex items-center justify-center"
              style={{ width: CELL_SIZE, height: CELL_SIZE }}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
            >
              {cell && (
                <div 
                  className="w-full h-full rounded-md flex items-center justify-center"
                  style={{ backgroundColor: getBlockColor(cell.type) }}
                >
                  <span className="text-white font-bold">{blockSymbols[cell.type-1]}</span>
                </div>
              )}
            </div>
          ))
        ))}
      </div>
    );
  };
  
  return (
    <div className="absolute inset-0 flex flex-col bg-black overflow-auto">
      {/* Editor Header */}
      <div className="bg-gray-900 text-white p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Level Editor</h2>
          <div className="flex space-x-3">
            <button 
              onClick={() => exitEditMode()}
              className="bg-red-600 text-white px-4 py-2 text-lg font-bold rounded-lg shadow-md active:translate-y-1"
            >
              Exit
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
      
      {/* Main editor layout with side panel and grid */}
      <div className="flex flex-col md:flex-row flex-1 overflow-auto p-4 gap-4">
        {/* Block palette (sidebar) */}
        <div className="bg-gray-800 p-4 rounded-lg flex flex-col gap-4 md:w-60">
          <div className="text-white text-xl font-semibold text-center mb-2">Block Types</div>
          
          <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
            {blockTypes.map(type => (
              <div 
                key={type}
                draggable="true"
                onDragStart={(e) => handleDragStart(e, type)}
                className="h-16 cursor-grab bg-gray-700 active:cursor-grabbing rounded-lg flex items-center justify-center shadow-md"
              >
                <div 
                  className="w-12 h-12 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: getBlockColor(type) }}
                >
                  <span className="text-white font-bold text-2xl">{blockSymbols[type-1]}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4">
            <button
              onClick={() => {
                createEmptyLevel();
                playHit();
                setMessage("Created new empty level");
                setTimeout(() => setMessage(null), 2000);
              }}
              className="w-full bg-blue-600 text-white py-3 text-lg font-bold rounded-lg shadow-md active:translate-y-1"
            >
              New Level
            </button>
          </div>
          
          {/* Instructions */}
          <div className="mt-4 text-white">
            <p className="text-center mb-2 font-semibold">Instructions:</p>
            <p className="text-sm mb-1">• Drag blocks from palette to grid</p>
            <p className="text-sm mb-1">• Tap blocks on grid to remove</p>
            <p className="text-sm">• Each block must have a matching pair</p>
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
        
        {/* Board/grid area */}
        <div className="flex-1 flex flex-col items-center overflow-auto p-4">
          {/* Editor grid */}
          <div className="mb-4 overflow-auto">
            {renderEditorGrid()}
          </div>
          
          {/* Saved levels */}
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