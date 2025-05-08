import { useState, useEffect } from 'react';
import { usePuzznic, MOVING_GROUND_TYPE } from '../../lib/stores/usePuzznic';
import { cn } from '../../lib/utils';
import { useAudio } from '../../lib/stores/useAudio';
import { useIsMobile } from '../../hooks/use-is-mobile';

// Block colors matching the game
const blockColors = [
  "#FF0000", // Red (type 1, typically floor)
  "#00FF00", // Green (type 2)
  "#00FFFF", // Cyan (type 3)
  "#FFFF00", // Yellow (type 4)
  "#FF00FF", // Magenta (type 5)
  "#4D4DFF", // Blue (type 6)
  "#FF7700", // Orange (type 7)
  "#AA00FF", // Purple (type 8)
];

export default function MobileEditor() {
  const { 
    gamePhase, 
    board,
    placeEditorBlock, 
    removeEditorBlock, 
    saveUserLevel, 
    loadUserLevel,
    userLevels,
    exitEditMode,
    createEmptyLevel,
    testLevel
  } = usePuzznic();
  
  // --- Grid size state ---
  const [gridWidth, setGridWidth] = useState(8);
  const [gridHeight, setGridHeight] = useState(8);

  // When grid size changes, create a new empty level
  const handleGridSizeChange = (w: number, h: number) => {
    setGridWidth(w);
    setGridHeight(h);
    createEmptyLevel(w, h);
  };
  
  const { playHit } = useAudio();
  const isMobile = useIsMobile();
  
  // Grid configuration with compact cells on mobile to fit everything on one screen
  const CELL_SIZE = isMobile ? 30 : 40; // Compact size on mobile to fit the entire grid
  const PALETTE_BLOCK_SIZE = isMobile ? 30 : 40; // Size of blocks in the palette
  
  const [selectedType, setSelectedType] = useState<number>(1);
  const [message, setMessage] = useState<string | null>(null);
  const [showBlockPalette, setShowBlockPalette] = useState(true);
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  // Add state for story level save status
  const [storyLevelSaveMessage, setStoryLevelSaveMessage] = useState<string | null>(null);
  
  // Check if in dev mode
  const isDevMode = import.meta.env.VITE_REACT_APP_DEV_MODE === 'true';
  console.log('[MobileEditor.tsx] isDevMode:', isDevMode);
  
  // Ensure we're in edit mode
  if (gamePhase !== 'editing') return null;
  
  // Floor block and colored blocks (types 1-8 + moving ground)
  const blockTypes = [1, 2, 3, 4, 5, 6, 7, 8, MOVING_GROUND_TYPE];
  
  // Save the current level
  const handleSaveLevel = () => {
    saveUserLevel();
    setMessage('Level saved!');
    setTimeout(() => setMessage(null), 2000);
  };
  
  // Get color for a block type
  const getBlockColor = (type: number): string => {
    return blockColors[(type - 1) % blockColors.length];
  };
  
  // Render a block with simplified style for better mobile performance
  const renderBlock = (type: number, size: number) => {
    if (type === 1) {
      // Floor block - simplified
      return (
        <div 
          className="rounded-lg flex items-center justify-center relative shadow-sm"
          style={{ 
            width: size, 
            height: size,
            backgroundColor: '#BBBBBB',
            overflow: 'hidden'
          }}
        >
          {/* Simplified style for mobile performance */}
          <div className="absolute inset-0 bg-gradient-to-b from-white to-transparent opacity-30"></div>
          <div className="absolute inset-0 border border-gray-500 rounded-lg"></div>
        </div>
      );
    }
    
    // Colored blocks - simplified for performance and smaller screens
    return (
      <div 
        className="rounded-lg flex items-center justify-center relative shadow-sm overflow-hidden"
        style={{ 
          width: size, 
          height: size
        }}
      >
        {/* Base color with simpler style */}
        <div className="absolute inset-0" 
          style={{ 
            backgroundColor: `rgb(${parseInt(getBlockColor(type).substring(1, 3), 16) * 0.4}, ${parseInt(getBlockColor(type).substring(3, 5), 16) * 0.4}, ${parseInt(getBlockColor(type).substring(5, 7), 16) * 0.4})`,
            borderRadius: '6px'
          }}
        />
        
        {/* Simplified gradient effect */}
        <div className="absolute inset-0 m-[1px] rounded-lg"
          style={{ 
            background: `linear-gradient(135deg, 
              rgb(${Math.min(255, parseInt(getBlockColor(type).substring(1, 3), 16) * 0.9)}, ${Math.min(255, parseInt(getBlockColor(type).substring(3, 5), 16) * 0.9)}, ${Math.min(255, parseInt(getBlockColor(type).substring(5, 7), 16) * 0.9)}) 0%, 
              rgb(${parseInt(getBlockColor(type).substring(1, 3), 16) * 0.4}, ${parseInt(getBlockColor(type).substring(3, 5), 16) * 0.4}, ${parseInt(getBlockColor(type).substring(5, 7), 16) * 0.4}) 100%)`,
          }}
        />
      </div>
    );
  };
  
  return (
    <div className="absolute inset-0 flex flex-col bg-black overflow-hidden">
      {/* Super compact header for mobile */}
      <div className="bg-black p-2 sticky top-0 z-20 border-b-2 border-cyan-600">
        <div className="flex flex-col gap-1">
          {/* Title and primary buttons in one row */}
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-cyan-300 font-mono">EDITOR</h2>
            {/* Grid size controls */}
            <div className="flex items-center gap-1">
              <label className="text-xs text-white">W</label>
              <select
                value={gridWidth}
                onChange={e => handleGridSizeChange(Number(e.target.value), gridHeight)}
                className="bg-gray-800 text-white text-xs border border-cyan-600 rounded px-1"
              >
                {[...Array(7)].map((_, i) => {
                  const val = i + 6;
                  return <option key={val} value={val}>{val}</option>;
                })}
              </select>
              <label className="text-xs text-white">× H</label>
              <select
                value={gridHeight}
                onChange={e => handleGridSizeChange(gridWidth, Number(e.target.value))}
                className="bg-gray-800 text-white text-xs border border-cyan-600 rounded px-1"
              >
                {[...Array(7)].map((_, i) => {
                  const val = i + 6;
                  return <option key={val} value={val}>{val}</option>;
                })}
              </select>
            </div>
            
            <div className="flex gap-1">
              {/* Add Save as Story Level button before MENU, only in dev mode */}
              {isDevMode && (
                <button
                  onClick={async () => {
                    setStoryLevelSaveMessage('Saving story level...');
                    const exportData = board.map(row => row.map(b => b ? b.type : 0));
                    
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
                  className="bg-purple-600 text-white font-bold py-1 px-2 border border-white text-xs"
                >
                  STORY
                </button>
              )}
              
              <button 
                onClick={() => exitEditMode()}
                className="bg-blue-600 text-white font-bold py-1 px-2 border border-white text-xs"
              >
                MENU
              </button>
              
              <button 
                onClick={handleSaveLevel}
                className="bg-green-600 text-white font-bold py-1 px-2 border border-white text-xs"
              >
                SAVE
              </button>
              
              <button 
                onClick={() => {
                  const success = testLevel();
                  if (success) playHit();
                }}
                className="bg-red-600 text-white font-bold py-1 px-2 border border-white text-xs"
              >
                TEST
              </button>
            </div>
          </div>
          
          {/* Second row with less important buttons */}
          <div className="flex justify-between gap-1">
            <button
              onClick={() => {
                createEmptyLevel();
                playHit();
                setMessage("New level");
                setTimeout(() => setMessage(null), 1500);
              }}
              className="bg-purple-600 text-white py-[2px] px-2 border border-white text-xs flex-1"
            >
              NEW
            </button>
            
            <button
              onClick={() => setShowLevelSelector(!showLevelSelector)}
              className="bg-orange-600 text-white py-[2px] px-2 border border-white text-xs flex-1"
            >
              LOAD
            </button>
            
            <button
              onClick={() => setShowBlockPalette(!showBlockPalette)}
              className="bg-cyan-600 text-white py-[2px] px-2 border border-white text-xs flex-1"
            >
              {showBlockPalette ? "HIDE BLOCKS" : "SHOW BLOCKS"}
            </button>
            
            {/* Message indicator - inline to save space */}
            {message ? (
              <div className="text-yellow-300 text-center py-[2px] px-2 bg-gray-900 text-xs animate-pulse flex-1">
                {message}
              </div>
            ) : (
              <div className="flex-1"></div> // Placeholder for layout consistency
            )}
          </div>
        </div>
      </div>
      
      {/* Ultra-compact mobile layout with minimal spacing */}
      <div className="flex flex-col flex-1 p-1 gap-1 bg-black overflow-hidden">
        {/* Level Selector - shows saved levels */}
        {showLevelSelector && (
          <div className="bg-black px-2 py-2 flex flex-col gap-2 shadow-md border-2 border-orange-600 rounded">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-orange-300">SAVED LEVELS</h3>
              <button 
                onClick={() => setShowLevelSelector(false)}
                className="text-white text-xs bg-gray-700 px-2 py-1 rounded"
              >
                CLOSE
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {userLevels.length > 0 ? (
                userLevels.map((_, index) => (
                  <button
                    key={`level-${index}`}
                    onClick={() => {
                      loadUserLevel(index);
                      playHit();
                      setShowLevelSelector(false);
                      setMessage(`Loaded level ${index + 1}`);
                      setTimeout(() => setMessage(null), 1500);
                    }}
                    className="bg-orange-800 hover:bg-orange-700 text-white py-2 text-center border border-orange-500"
                  >
                    Level {index + 1}
                  </button>
                ))
              ) : (
                <div className="col-span-4 text-gray-400 text-center py-4">
                  No saved levels yet. Create and save a level first!
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Block palette - more compact on mobile */}
        {showBlockPalette && (
          <div className="bg-black px-1 py-1 flex flex-col gap-1 shadow-md border-2 border-cyan-600 rounded">
            <div className="grid grid-cols-8 gap-1 place-items-center">
              {blockTypes.map(type => (
                <button 
                  key={type}
                  onClick={() => {
                    setSelectedType(type);
                    playHit();
                  }}
                  className={cn(
                    "cursor-pointer flex items-center justify-center",
                    selectedType === type ? "ring-2 ring-white" : "",
                    type === 1 ? "bg-gray-800" : ""
                  )}
                >
                  {type === MOVING_GROUND_TYPE ? (
                    <div 
                      style={{ 
                        width: PALETTE_BLOCK_SIZE, 
                        height: PALETTE_BLOCK_SIZE,
                        backgroundColor: '#555555',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: 'white'
                      }}
                    >
                      ⬛
                    </div>
                  ) : (
                    renderBlock(type, PALETTE_BLOCK_SIZE)
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Grid area - tightly packed */}
        <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
          <div className="bg-black p-1 shadow-md border-2 border-cyan-600 rounded">
            {/* The grid with minimal spacing */}
            <div className="flex flex-col gap-[1px]">
              {Array.from({ length: gridHeight }).map((_, rowIndex) => {
                // Convert visual row to game row (y)
                const gameY = gridHeight - rowIndex - 1;
                
                return (
                  <div key={`row-${rowIndex}`} className="flex flex-row gap-[1px]">
                    {Array.from({ length: gridWidth }).map((_, colIndex) => {
                      const gameX = colIndex;
                      const block = board[gameY][gameX];
                      
                      return (
                        <div
                          key={`cell-${rowIndex}-${colIndex}`}
                          className={cn(
                            "relative border border-gray-800",
                            block ? "" : "bg-gray-900"
                          )}
                          style={{ 
                            width: CELL_SIZE, 
                            height: CELL_SIZE
                          }}
                          onClick={() => {
                            if (block) {
                              removeEditorBlock(gameX, gameY);
                              playHit();
                            } else {
                              placeEditorBlock(gameX, gameY, selectedType);
                              playHit();
                            }
                          }}
                        >
                          {block && renderBlock(block.type, CELL_SIZE)}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {/* Add modal for story level save message */}
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