import { useState, useEffect, useRef, DragEvent } from 'react';
import { usePuzznic, BlockType, MOVING_GROUND_TYPE } from '../../lib/stores/usePuzznic';
import { cn } from '../../lib/utils';
import { useAudio } from '../../lib/stores/useAudio';
import { useIsMobile } from '../../hooks/use-is-mobile';

// Define block symbols based on original Puzznic
const blockSymbols = ["✚", "■", "●", "×", "★", "◆", "▲", "♦", "◇", "○"];

// Grid cell size for the editor
const CELL_SIZE = 40;

// Data structure for drag and drop operations
interface DragData {
  blockType: number;
}

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
    loadUserLevel,
    set
  } = usePuzznic();
  
  // Log gamePhase for LevelEditor context
  console.log('[LevelEditor.tsx] gamePhase:', gamePhase);
  const isDevMode = import.meta.env.VITE_REACT_APP_DEV_MODE === 'true';
  console.log('[LevelEditor.tsx] isDevMode:', isDevMode);

  const { playHit } = useAudio();
  const isMobile = useIsMobile();
  
  const [message, setMessage] = useState<string | null>(null);
  const [storyLevelSaveMessage, setStoryLevelSaveMessage] = useState<string | null>(null); // New state for story level save
  const [isValid, setIsValid] = useState(true);
  const [selectedBlockType, setSelectedBlockType] = useState<number | null>(null);
  const [editingUserLevelIndex, setEditingUserLevelIndex] = useState<number | null>(null);
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

  // If user loads a new level, update the editing index
  useEffect(() => {
    // If the board matches a user level, set the editing index
    const idx = userLevels.findIndex(lvl => JSON.stringify(lvl) === JSON.stringify(generateLevelData()));
    setEditingUserLevelIndex(idx >= 0 ? idx : null);
    // eslint-disable-next-line
  }, [board, userLevels]);
  
  // Calculate maximum block type (default is 6, but could be more)
  const maxBlockType = 9; // Now includes moving ground block
  
  // Generate an array of block types for the palette
  const blockTypes = Array.from({ length: maxBlockType - 1 }, (_, i) => i + 2);
  
  const handleSaveLevel = () => {
    if (!isValid) {
      setMessage('Cannot save invalid level!');
      setTimeout(() => setMessage(null), 2000);
      return;
    }
    const levelData = generateLevelData();
    if (editingUserLevelIndex !== null && editingUserLevelIndex >= 0 && editingUserLevelIndex < userLevels.length) {
      // Overwrite existing level
      const updatedUserLevels = [...userLevels];
      updatedUserLevels[editingUserLevelIndex] = JSON.parse(JSON.stringify(levelData));
      set({ userLevels: updatedUserLevels });
      setMessage(`Level ${editingUserLevelIndex + 1} updated!`);
    } else {
      // Add as new level
      saveUserLevel();
      setMessage('Level saved successfully!');
    }
    setTimeout(() => setMessage(null), 2000);
  };
  
  // Handle selection of block type from palette
  const handleSelectBlockType = (blockType: number) => {
    setSelectedBlockType(blockType);
    playHit();
    setMessage(`Selected ${blockSymbols[blockType-1]} block. Click on grid to place.`);
    setTimeout(() => setMessage(null), 2000);
  };
  
  // Debugging function to log the board structure
  const logBoardStructure = () => {
    console.log('Current Board Structure:');
    for (let y = board.length - 1; y >= 0; y--) {
      let rowStr = `Row ${y}: `;
      for (let x = 0; x < board[0].length; x++) {
        const cell = board[y][x];
        rowStr += cell ? `[${cell.type}]` : '[ ]';
      }
      console.log(rowStr);
    }
  };
  
  // Create a direct visual representation of the grid with numbered coordinates
  const renderEditorGrid = () => {
    const rows = board.length;
    const cols = board[0].length;
    
    // We'll create the grid in UI order - top to bottom
    const uiGrid = [];
    
    // Create the visual grid - we'll map each UI position directly to the correct game position
    for (let uiRow = 0; uiRow < rows; uiRow++) {
      const rowCells = [];
      
      // In each row, create columns
      for (let uiCol = 0; uiCol < cols; uiCol++) {
        // Convert UI coordinates to game board coordinates
        const gameY = rows - uiRow - 1; // y=0 is bottom in game, but top in UI
        const gameX = uiCol;            // x coordinates align
        
        // Get cell content from game coordinates
        const cell = board[gameY][gameX];
        
        // Create a grid cell with visual position indicators (for debugging)
        rowCells.push(
          <div
            key={`${uiRow}-${uiCol}`}
            className={cn(
              "rounded-md flex items-center justify-center relative",
              selectedBlockType !== null ? "cursor-pointer" : "",
              cell ? "bg-opacity-90" : "bg-gray-700"
            )}
            style={{ 
              width: CELL_SIZE, 
              height: CELL_SIZE,
              border: '1px solid rgba(255,255,255,0.1)'
            }}
            // Click handler for placing/removing blocks
            onClick={() => {
              console.log(`------------------`);
              console.log(`UI Click: row=${uiRow}, col=${uiCol}`);
              console.log(`Game pos: X=${gameX}, Y=${gameY}`);
              
              // Direct click-to-place/remove at game coordinates
              if (cell !== null) {
                console.log(`Removing block at game X=${gameX}, Y=${gameY}`);
                removeEditorBlock(gameX, gameY);
                playHit();
              } else if (selectedBlockType !== null) {
                console.log(`Placing block type ${selectedBlockType} at game X=${gameX}, Y=${gameY}`);
                placeEditorBlock(gameX, gameY, selectedBlockType); 
                playHit();
                
                // Verify placement
                setTimeout(() => {
                  const updatedCell = board[gameY][gameX];
                  console.log(`After placement, cell at (${gameX},${gameY}) is:`, 
                    updatedCell ? `Block type ${updatedCell.type}` : 'Empty');
                }, 100);
              }
            }}
            // Drag and drop handlers
            onDragOver={(e) => {
              // Allow dropping - prevent default to enable drop
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
              
              // Add a visual indicator that drop is allowed
              // All cells are droppable
              e.currentTarget.style.outline = '3px solid rgba(0,255,0,0.7)';
              e.currentTarget.style.boxShadow = '0 0 10px rgba(0,255,0,0.5)';
            }}
            onDragLeave={(e) => {
              // Remove visual indicators when leaving
              e.currentTarget.style.outline = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onDrop={(e) => {
              e.preventDefault();
              
              // Remove visual indicators
              e.currentTarget.style.outline = 'none';
              e.currentTarget.style.boxShadow = 'none';
              
              // Get drag data
              try {
                const dragData = JSON.parse(e.dataTransfer.getData('text/plain')) as DragData;
                
                if (dragData.blockType) {
                  console.log(`------------------`);
                  console.log(`Drop at UI: row=${uiRow}, col=${uiCol}`);
                  console.log(`Game pos: X=${gameX}, Y=${gameY}`);
                  
                  // Allow placing blocks anywhere
                  console.log(`Placing block type ${dragData.blockType} at X=${gameX}, Y=${gameY}`);
                  placeEditorBlock(gameX, gameY, dragData.blockType);
                  playHit();
                    
                  // Verify placement
                  setTimeout(() => {
                    const updatedCell = board[gameY][gameX];
                    console.log(`After placement, cell at (${gameX},${gameY}) is:`, 
                      updatedCell ? `Block type ${updatedCell.type}` : 'Empty');
                  }, 100);
                }
              } catch (error) {
                console.error('Error parsing drag data:', error);
              }
            }}
          >
            {cell && (
              <div 
                className="w-full h-full rounded-md flex items-center justify-center"
                style={{ backgroundColor: getBlockColor(cell.type) }}
              >
                <span className="text-white font-bold">{blockSymbols[cell.type-1]}</span>
              </div>
            )}
            
            {/* Small top-left coordinate indicator for debugging */}
            <span className="absolute text-[6px] text-white opacity-40 top-0 left-0.5">
              {gameX},{gameY}
            </span>
          </div>
        );
      }
      
      uiGrid.push(
        <div key={`row-${uiRow}`} className="flex flex-row gap-1">
          {rowCells}
        </div>
      );
    }
    
    return (
      <div 
        ref={editorGridRef}
        className="flex flex-col gap-1 bg-gray-800 p-2 rounded-lg"
        style={{ width: cols * (CELL_SIZE + 4) + 8, height: rows * (CELL_SIZE + 4) + 8 }}
      >
        {uiGrid}
      </div>
    );
  };
  
  return (
    <div className="level-editor-container w-full max-w-2xl mx-auto p-4 bg-gray-800 text-white rounded-lg shadow-xl">
      {/* Palette and Grid */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        {/* Block Palette */}
        <div className="palette-container bg-gray-700 p-3 rounded-md shadow">
          <h3 className="text-lg font-semibold mb-2 text-center">Block Palette</h3>
          <div className="grid grid-cols-4 gap-2">
            {blockTypes.map((type) => (
              <button
                key={type}
                onClick={() => handleSelectBlockType(type)}
                title={`Select block type ${blockSymbols[type-1]}`}
                className={cn(
                  "w-12 h-12 text-2xl rounded-md flex items-center justify-center transition-all duration-150 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800",
                  selectedBlockType === type ? "ring-2 ring-yellow-400 shadow-lg scale-105" : "hover:bg-opacity-70",
                  `bg-${getBlockColor(type)}-500` // Using Tailwind dynamic classes might require full class names in safelist
                )}
                style={{ backgroundColor: getBlockColor(type) }} // Fallback for dynamic bg
              >
                {blockSymbols[type-1]}
              </button>
            ))}
            <button
              onClick={() => handleSelectBlockType(MOVING_GROUND_TYPE)} // Ground Block type
              title="Select Moving Ground Block"
              className={cn(
                "w-12 h-12 text-xl rounded-md flex items-center justify-center transition-all duration-150 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 bg-gray-500",
                selectedBlockType === MOVING_GROUND_TYPE ? "ring-2 ring-yellow-400 shadow-lg scale-105" : "hover:bg-opacity-70"
              )}
            >
               जमीन
            </button>
          </div>
        </div>

        {/* Editor Grid */}
        <div ref={editorGridRef} className="editor-grid-container flex-grow bg-gray-700 p-3 rounded-md shadow">
          {renderEditorGrid()} 
        </div>
      </div>

      {/* Action Buttons & Messages */}
      <div className="action-buttons-messages text-center mb-4">
        {/* Example: <button onClick={handleSomeActualAction}>Actual Button</button> */}
        {/* The 'Save as Story Level' button will be placed here in the next step */}
        {isDevMode && (
            <button
              style={{ marginLeft: 16, background: '#223', color: '#fff', border: '1px solid #446', borderRadius: 6, padding: '6px 14px', fontWeight: 600, cursor: 'pointer' }}
              onClick={async () => {
                setStoryLevelSaveMessage('Saving story level...');
                const exportData = generateLevelData();
                if (exportData) {
                  try {
                    const response = await fetch('/api/dev/save-story-level', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ levelData: exportData }),
                    });
                    const contentType = response.headers.get("content-type");
                    if (contentType && contentType.indexOf("application/json") !== -1) {
                      const result = await response.json();
                      if (response.ok) {
                        setStoryLevelSaveMessage(`Success: ${result.message}`);
                      } else {
                        setStoryLevelSaveMessage(`Error: ${result.message || 'Failed to save level.'}`);
                      }
                    } else {
                      const textResponse = await response.text();
                      setStoryLevelSaveMessage(`Error: Server returned non-JSON response. Status: ${response.status}. Response: ${textResponse}`);
                    }
                  } catch (error) {
                    console.error('Error saving story level:', error);
                    setStoryLevelSaveMessage(`Network Error: Could not connect to server. ${(error as Error).message}`);
                  }
                } else {
                  setStoryLevelSaveMessage('Error: Could not generate level data to export.');
                }
              }}
            >
              Save as Story Level
            </button>
          )}
      </div>

      {message && (
        <div className={`p-3 rounded-md text-center font-semibold ${isValid ? 'bg-green-600' : 'bg-red-600'} shadow`}>
          {message}
        </div>
      )}

      {/* Modal for story level save message */}
      {storyLevelSaveMessage && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(10,21,33,0.78)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#181e2a', borderRadius: 8, padding: 24, boxShadow: '0 2px 16px #0008', maxWidth: 600, width: '90vw', textAlign: 'center' }}>
            <h3 style={{ color: '#fff', marginTop: 0, marginBottom: 16 }}>Save Story Level Status</h3>
            <p style={{ color: '#eee', fontSize: '16px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {storyLevelSaveMessage}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setStoryLevelSaveMessage(null)} style={{ background: '#223', color: '#fff', border: '1px solid #446', borderRadius: 6, padding: '6px 18px', fontWeight: 600, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
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