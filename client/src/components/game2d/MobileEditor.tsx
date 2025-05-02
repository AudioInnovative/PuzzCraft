import { useState, useEffect } from 'react';
import { usePuzznic } from '../../lib/stores/usePuzznic';
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
    exitEditMode,
    createEmptyLevel,
    testLevel
  } = usePuzznic();
  
  const { playHit } = useAudio();
  const isMobile = useIsMobile();
  
  // Grid configuration
  const GRID_SIZE = 8;
  const CELL_SIZE = isMobile ? 40 : 40; // Size in pixels
  
  const [selectedType, setSelectedType] = useState<number>(1);
  const [message, setMessage] = useState<string | null>(null);
  const [showBlockPalette, setShowBlockPalette] = useState(true);
  
  // Ensure we're in edit mode
  if (gamePhase !== 'editing') return null;
  
  // Floor block and colored blocks (types 1-8)
  const blockTypes = [1, 2, 3, 4, 5, 6, 7, 8];
  
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
  
  // Render a block with the appropriate style
  const renderBlock = (type: number, size: number) => {
    if (type === 1) {
      // Floor block
      return (
        <div 
          className="rounded-xl flex items-center justify-center relative shadow-md"
          style={{ 
            width: size, 
            height: size,
            backgroundColor: '#BBBBBB',
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
          
          {isMobile ? null : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-gray-700 bg-gray-200 px-1 py-0.5 rounded-full opacity-80">
                FLOOR
              </span>
            </div>
          )}
        </div>
      );
    }
    
    // Colored blocks
    return (
      <div 
        className="rounded-xl flex items-center justify-center relative shadow-md overflow-hidden"
        style={{ 
          width: size, 
          height: size
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
        
        {/* Top highlight */}
        <div className="absolute top-0 left-0 right-0 h-1/3 rounded-t-lg opacity-30"
          style={{ 
            background: `linear-gradient(to bottom, 
              rgba(255, 255, 255, 0.3) 0%, 
              rgba(255, 255, 255, 0) 100%)`,
          }}
        />
      </div>
    );
  };
  
  return (
    <div className="absolute inset-0 flex flex-col bg-black overflow-auto">
      {/* Header */}
      <div className="bg-black p-3 sticky top-0 z-20 border-b-4 border-cyan-600">
        <div className={cn(
          "flex items-center",
          isMobile ? "flex-col gap-2" : "justify-between"
        )}>
          <h2 className="text-xl font-bold text-cyan-300 font-mono tracking-wider">
            LEVEL EDITOR
          </h2>
          
          {/* Editor controls - responsive layout */}
          <div className="flex flex-wrap gap-2 justify-center">
            <button 
              onClick={() => exitEditMode()}
              className="bg-blue-600 hover:bg-blue-800 text-white font-bold py-1 px-3 border-2 border-white text-sm"
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
              className="bg-red-600 hover:bg-red-800 text-white font-bold py-1 px-3 border-2 border-white text-sm"
            >
              TEST
            </button>
            
            <button 
              onClick={handleSaveLevel}
              className="bg-green-600 hover:bg-green-800 text-white font-bold py-1 px-3 border-2 border-white text-sm"
            >
              SAVE
            </button>
            
            <button
              onClick={() => {
                createEmptyLevel();
                playHit();
                setMessage("New level created");
                setTimeout(() => setMessage(null), 2000);
              }}
              className="bg-purple-600 hover:bg-purple-800 text-white font-bold py-1 px-3 border-2 border-white text-sm"
            >
              NEW
            </button>
            
            <button
              onClick={() => setShowBlockPalette(!showBlockPalette)}
              className="bg-cyan-600 hover:bg-cyan-800 text-white font-bold py-1 px-3 border-2 border-white text-sm"
            >
              {showBlockPalette ? "HIDE BLOCKS" : "SHOW BLOCKS"}
            </button>
          </div>
        </div>
        
        {/* Message indicator */}
        {message && (
          <div className="mt-2 text-yellow-300 text-center p-1 bg-gray-900 font-mono text-sm animate-pulse">
            {message}
          </div>
        )}
      </div>
      
      {/* Mobile-optimized layout */}
      <div className="flex flex-col flex-1 overflow-auto p-2 gap-2 bg-black">
        {/* Block palette - collapsible on mobile */}
        {showBlockPalette && (
          <div className={cn(
            "bg-black px-2 py-3 flex flex-col gap-3 shadow-lg border-4 border-cyan-600",
            isMobile ? "sticky top-[60px] z-10" : ""
          )}>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 place-items-center">
              {blockTypes.map(type => (
                <button 
                  key={type}
                  onClick={() => {
                    setSelectedType(type);
                    playHit();
                  }}
                  className={cn(
                    "cursor-pointer flex items-center justify-center p-1",
                    selectedType === type ? "ring-4 ring-white" : "hover:ring-2 hover:ring-gray-400",
                    type === 1 ? "bg-gray-800" : ""
                  )}
                >
                  {renderBlock(type, isMobile ? 45 : 40)}
                </button>
              ))}
            </div>
            
            <div className="text-xs text-cyan-300 font-mono text-center">
              {isMobile ? 
                "TAP A BLOCK TYPE ABOVE, THEN TAP THE GRID BELOW TO PLACE IT" :
                "SELECTED BLOCK TYPE: " + (selectedType === 1 ? "FLOOR" : `BLOCK ${selectedType}`)
              }
            </div>
          </div>
        )}
        
        {/* Grid area */}
        <div className="flex-1 flex flex-col items-center overflow-auto pt-2">
          <div className="bg-black p-3 shadow-lg border-4 border-cyan-600 rounded-md">
            {/* The grid */}
            <div className="flex flex-col gap-[2px]">
              {Array.from({ length: GRID_SIZE }).map((_, rowIndex) => {
                // Convert visual row to game row (y)
                const gameY = GRID_SIZE - rowIndex - 1;
                
                return (
                  <div key={`row-${rowIndex}`} className="flex flex-row gap-[2px]">
                    {Array.from({ length: GRID_SIZE }).map((_, colIndex) => {
                      // Game X is the same as visual column
                      const gameX = colIndex;
                      
                      // Get the block at this position
                      const block = board[gameY][gameX];
                      
                      return (
                        <div
                          key={`cell-${rowIndex}-${colIndex}`}
                          className={cn(
                            "relative transition-all border border-gray-800",
                            block ? "" : "bg-gray-900 hover:bg-gray-800"
                          )}
                          style={{ 
                            width: CELL_SIZE, 
                            height: CELL_SIZE
                          }}
                          onClick={() => {
                            // On mobile, always place blocks, double tap to remove
                            if (block) {
                              // Remove existing block
                              removeEditorBlock(gameX, gameY);
                              playHit();
                            } else {
                              // Place selected block
                              placeEditorBlock(gameX, gameY, selectedType);
                              playHit();
                            }
                          }}
                        >
                          {/* Display block if it exists */}
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
    </div>
  );
}