import { useEffect, useState } from "react";
import { usePuzznic, BlockType } from "../../lib/stores/usePuzznic";
import { GamePanel } from "../ui/game-panel";
import { useIsMobile } from "../../hooks/use-is-mobile";

// Define floor block color
const floorColor = "#777777";

// Import the exact same color array from Board.tsx to ensure perfect matching
// These colors are applied with (blockType - 1) as the index
const boardColors = [
  "#FF005E", // Intense Neon Pink (type 2 uses index 1)
  "#00FF33", // Electric Neon Green (type 3 uses index 2)
  "#00FFFF", // Brilliant Cyan (type 4 uses index 3)
  "#FFFF00", // Vivid Yellow (type 5 uses index 4)
  "#FF00FF", // Vibrant Magenta (type 6 uses index 5)
  "#4D4DFF", // Electric Blue (type 7 uses index 6)
  "#FF7700", // Blazing Orange (type 8 uses index 7)
  "#AA00FF", // Deep Purple (type 9 uses index 8)
  "#FF0099", // Hot Pink (type 10 uses index 9)
  "#00DDFF", // Bright Aqua (type 11 uses index 10)
];

// Helper function to safely get color for a block type
const getColorForType = (type: number): string => {
  if (type === 1) return floorColor;
  
  // Match the indexing in Board.tsx: (block.type - 1) % blockColors.length
  const index = (type - 1) % boardColors.length;
  
  // Safety check to prevent array out of bounds
  if (index >= 0 && index < boardColors.length) {
    return boardColors[index];
  }
  
  // Fallback color for any unexpected block types
  return "#888888";
};

// Interface for block counter
interface BlockCount {
  type: number;
  count: number;
}

export default function GameUI2D() {
  const { 
    gamePhase, 
    level, 
    maxLevel,
    completedLevels, 
    score, 
    moveCount, 
    timeLeft,
    restartLevel,
    nextLevel,
    enterEditMode,
    exitEditMode,
    isTestingCustomLevel,
    skipToLevel,
    board,
    showLevelSelector,
    toggleLevelSelector,
    selectLevel
  } = usePuzznic();
  const isMobile = useIsMobile();
  
  // State to track remaining blocks by type
  const [blockCounts, setBlockCounts] = useState<BlockCount[]>([]);
  
  // Update block counts whenever the board changes
  useEffect(() => {
    if (gamePhase === "playing") {
      updateBlockCounts();
    }
  }, [board, gamePhase]);
  
  // Count blocks of each type that remain on the board
  const updateBlockCounts = () => {
    const counts = new Map<number, number>();
    const blockTypeMap = new Map<number, string>(); // Map to track types to colors

    console.log("Updating block counts");
    
    // First scan: identify all blocks and their types on the board
    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board[y].length; x++) {
        const block = board[y][x];
        if (block && block.type > 1) { // Skip empty cells and floor blocks
          console.log(`Found block at [${x},${y}]: type=${block.type}, matched=${block.matched}`);
          if (!block.matched) {
            const count = counts.get(block.type) || 0;
            counts.set(block.type, count + 1);
          }
        }
      }
    }
    
    console.log("Block count map:", Object.fromEntries(counts));
    
    // Convert map to array sorted by block type
    const countsArray: BlockCount[] = [];
    counts.forEach((count, type) => {
      countsArray.push({ type, count });
    });
    
    // Sort by type
    countsArray.sort((a, b) => a.type - b.type);
    
    console.log("Block count array:", countsArray);
    
    setBlockCounts(countsArray);
  };
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Level Editor Component removed: now using SimpleLevelEditor in Game2D */}
      
      {/* Game HUD styled like original Puzznic - now on the left side with fixed width */}
      <div className="absolute top-0 left-0 bottom-0 flex flex-col items-start p-2 bg-black w-[100px] border-r border-gray-700">
        {/* Game stats - score removed, move counter added */}
        <GamePanel title="Moves" value={moveCount.toString()} />
        <GamePanel title="Level" value={`${level}-${maxLevel}`} />
        
        {/* Block Counter - shows remaining blocks by type */}
        {gamePhase === "playing" && blockCounts.length > 0 && (
          <div className="mt-4 pt-2 border-t border-gray-700 w-full">
            <h3 className="text-xs uppercase font-bold text-white mb-1">Blocks Left</h3>
            <div className="flex flex-col gap-1">
              {blockCounts.map(item => (
                <div key={`block-${item.type}`} className="flex items-center gap-1">
                  {/* Block color indicator with glow effect */}
                  <div 
                    className="w-4 h-4 rounded-sm" 
                    style={{ 
                      backgroundColor: getColorForType(item.type),
                      boxShadow: `0 0 4px ${getColorForType(item.type)}`,
                      border: '1px solid rgba(255, 255, 255, 0.4)'
                    }}
                  />
                  {/* Block count */}
                  <span className="text-xs text-white font-mono">× {item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Controls help (moved after block counter) */}
        {gamePhase === "playing" && (
          <div className="mt-4 pt-2 border-t border-gray-700 w-full">
            <h3 className="text-xs uppercase font-bold text-white mb-1">Controls</h3>
            <div className="text-xs text-cyan-300">
              {isMobile ? (
                <>
                  <p className="mb-1">• Tap to select</p>
                  <p className="mb-1">• Swipe to move</p>
                </>
              ) : (
                <>
                  <p className="mb-1">• Click to select</p>
                  <p className="mb-1">• Drag to move</p>
                  <p className="mb-1">• Space to select</p>
                  <p className="mb-1">• ← → to move</p>
                  <p className="mb-1">• R to restart</p>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Utility buttons */}
        {gamePhase === "ready" && (
          <button 
            className="bg-purple-600 hover:bg-purple-800 text-white text-xs font-bold py-1 px-2 pointer-events-auto border border-white uppercase mt-2 w-full"
            onClick={() => enterEditMode()}
          >
            Editor
          </button>
        )}
        
        {/* Buttons during gameplay */}
        {gamePhase === "playing" && (
          <div className="mt-auto w-full flex flex-col gap-2">
            {/* Edit button only shown when testing a custom level */}
            {isTestingCustomLevel && (
              <button 
                className="bg-purple-600 hover:bg-purple-800 text-white text-xs font-bold py-1 px-2 pointer-events-auto border border-white uppercase w-full"
                onClick={() => enterEditMode()}
              >
                Edit Level
              </button>
            )}
            
            {/* Temporary Skip Level button */}
            <button 
              className="bg-yellow-600 hover:bg-yellow-800 text-white text-xs font-bold py-1 px-2 pointer-events-auto border border-white uppercase w-full"
              onClick={() => {
                // Show prompt to choose level
                const targetLevel = window.prompt("Enter level number to skip to (1-" + maxLevel + "):", level.toString());
                if (targetLevel) {
                  const levelNum = parseInt(targetLevel, 10);
                  if (!isNaN(levelNum) && levelNum >= 1 && levelNum <= maxLevel) {
                    skipToLevel(levelNum);
                  }
                }
              }}
            >
              Skip Level
            </button>

            {/* Restart button */}
            <button 
              className="bg-red-600 hover:bg-red-800 text-white text-xs font-bold py-1 px-2 pointer-events-auto border border-white uppercase w-full"
              onClick={() => restartLevel()}
            >
              Restart
            </button>
            
            {/* Main Menu button */}
            <button 
              className="bg-blue-600 hover:bg-blue-800 text-white text-xs font-bold py-1 px-2 pointer-events-auto border border-white uppercase w-full"
              onClick={() => exitEditMode()} 
            >
              Main Menu
            </button>
          </div>
        )}
      </div>
      
      {/* Game messages */}
      {gamePhase === "ready" && !showLevelSelector && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black p-8 border-4 border-cyan-600 text-center w-4/5 max-w-md">
            <div className="flex justify-center items-center mb-4">
              <img 
                src="/images/puzzcraft_logo.jpg" 
                alt="PuzzCraft Logo" 
                className="w-64 mx-auto" 
              />
            </div>
            <div className="bg-blue-900 border-2 border-blue-700 p-4 mb-6">
              <p className="text-xl text-white mb-4">MATCH THE BLOCKS TO CLEAR THE LEVEL!</p>
            </div>
            <div className="flex justify-center space-x-4 mb-4">
              <button 
                className="bg-red-600 hover:bg-red-800 text-white font-bold py-2 px-8 pointer-events-auto border-2 border-white"
                onClick={() => usePuzznic.getState().startGame()}
              >
                PLAY GAME
              </button>
              <button 
                className="bg-purple-600 hover:bg-purple-800 text-white font-bold py-2 px-4 pointer-events-auto border-2 border-white"
                onClick={() => enterEditMode()}
              >
                LEVEL EDITOR
              </button>
            </div>
            
            {/* Show level selector button only if player has completed levels */}
            {completedLevels.length > 0 && (
              <button 
                className="bg-cyan-600 hover:bg-cyan-800 text-white font-bold py-2 px-4 mt-2 pointer-events-auto border-2 border-white w-full"
                onClick={() => toggleLevelSelector()}
              >
                SELECT LEVEL
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Level Selector Modal */}
      {gamePhase === "ready" && showLevelSelector && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black p-8 border-4 border-cyan-600 text-center w-4/5 max-w-md">
            <h2 className="text-3xl font-bold text-cyan-300 mb-6 font-mono uppercase">LEVEL SELECT</h2>
            <div className="bg-blue-900 border-2 border-blue-700 p-4 mb-6">
              <p className="text-xl text-yellow-300 mb-4 font-mono">SELECT A COMPLETED LEVEL</p>
              
              <div className="grid grid-cols-4 gap-2 mb-4">
                {Array.from({ length: maxLevel }, (_, i) => i + 1).map(levelNum => {
                  // Check if this level is completed
                  const isCompleted = completedLevels.includes(levelNum);
                  return (
                    <button
                      key={`level-${levelNum}`}
                      className={`
                        p-2 border-2 pointer-events-auto
                        ${isCompleted 
                          ? "border-green-500 bg-green-900 text-white hover:bg-green-700" 
                          : "border-gray-600 bg-gray-900 text-gray-500 cursor-not-allowed"}
                      `}
                      onClick={() => isCompleted && selectLevel(levelNum)}
                      disabled={!isCompleted}
                    >
                      {levelNum}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <button 
              className="bg-blue-600 hover:bg-blue-800 text-white font-bold py-2 px-4 pointer-events-auto border-2 border-white"
              onClick={() => toggleLevelSelector()}
            >
              BACK
            </button>
          </div>
        </div>
      )}
      
      {gamePhase === "level_complete" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black p-8 border-4 border-cyan-600 text-center w-4/5 max-w-md">
            <h2 className="text-4xl font-bold text-cyan-300 mb-6 font-mono uppercase">LEVEL CLEAR!</h2>
            <div className="bg-blue-900 border-2 border-blue-700 p-4 mb-6">
              <p className="text-2xl text-yellow-300 mb-6 font-mono">ALL BLOCKS MATCHED!</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-left mb-4">
                <p className="text-white font-mono">MOVES:</p>
                <p className="text-cyan-300 font-mono text-right">{moveCount}</p>
              </div>
            </div>
            <div className="animate-pulse flex justify-center space-x-4">
              {isTestingCustomLevel ? (
                <>
                  <button 
                    className="bg-purple-600 hover:bg-purple-800 text-white font-bold py-2 px-4 pointer-events-auto border-2 border-white uppercase font-mono"
                    onClick={() => enterEditMode()}
                  >
                    Edit Level
                  </button>
                  <button 
                    className="bg-green-600 hover:bg-green-800 text-white font-bold py-2 px-4 pointer-events-auto border-2 border-white uppercase font-mono"
                    onClick={() => restartLevel()}
                  >
                    Try Again
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className="bg-green-600 hover:bg-green-800 text-white font-bold py-2 px-4 pointer-events-auto border-2 border-white uppercase font-mono"
                    onClick={() => nextLevel()}
                  >
                    Next Level
                  </button>
                  <button 
                    className="bg-blue-600 hover:bg-blue-800 text-white font-bold py-2 px-4 pointer-events-auto border-2 border-white uppercase font-mono"
                    onClick={() => exitEditMode()}
                  >
                    Main Menu
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {gamePhase === "game_over" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black p-8 border-4 border-red-600 text-center w-4/5 max-w-md">
            <h2 className="text-4xl font-bold text-red-500 mb-6 font-mono uppercase tracking-wider">GAME OVER</h2>
            <div className="bg-blue-900 border-2 border-blue-700 p-4 mb-6">
              <p className="text-2xl text-white mb-6 font-mono">LEVEL FAILED!</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-left mb-4">
                <p className="text-white font-mono">MOVES:</p>
                <p className="text-cyan-300 font-mono text-right">{moveCount}</p>
              </div>
            </div>
            <div className="flex justify-center space-x-4">
              {isTestingCustomLevel ? (
                <>
                  <button 
                    className="bg-purple-600 hover:bg-purple-800 text-white font-bold py-2 px-4 pointer-events-auto border-2 border-white uppercase font-mono"
                    onClick={() => enterEditMode()}
                  >
                    Edit Level
                  </button>
                  <button 
                    className="bg-blue-600 hover:bg-blue-800 text-white font-bold py-2 px-4 pointer-events-auto border-2 border-white uppercase font-mono"
                    onClick={() => restartLevel()}
                  >
                    Retry Level
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className="bg-red-600 hover:bg-red-800 text-white font-bold py-2 px-4 pointer-events-auto border-2 border-white uppercase font-mono"
                    onClick={() => restartLevel()}
                  >
                    Retry
                  </button>
                  <button 
                    className="bg-blue-600 hover:bg-blue-800 text-white font-bold py-2 px-4 pointer-events-auto border-2 border-white uppercase font-mono"
                    onClick={() => exitEditMode()}
                  >
                    Main Menu
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {gamePhase === "game_won" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black p-8 border-4 border-yellow-500 text-center w-4/5 max-w-md">
            <h2 className="text-4xl font-bold text-yellow-300 mb-6 font-mono uppercase tracking-wider">YOU WIN!</h2>
            <div className="bg-blue-900 border-2 border-blue-700 p-4 mb-6">
              <p className="text-2xl text-cyan-300 mb-6 font-mono">ALL LEVELS COMPLETED!</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-left mb-4">
                <p className="text-white font-mono">TOTAL MOVES:</p>
                <p className="text-cyan-300 font-mono text-right">{moveCount}</p>
              </div>
            </div>
            <div className="animate-pulse flex justify-center space-x-4">
              <button 
                className="bg-green-600 hover:bg-green-800 text-white font-bold py-2 px-4 pointer-events-auto border-2 border-white uppercase font-mono"
                onClick={() => {
                  // Restart from level 1
                  nextLevel();
                }}
              >
                Play Again
              </button>
              <button 
                className="bg-blue-600 hover:bg-blue-800 text-white font-bold py-2 px-4 pointer-events-auto border-2 border-white uppercase font-mono"
                onClick={() => exitEditMode()}
              >
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Help text during gameplay - moved to the sidebar */}
      {/* We don't need a separate help bar now that we have a persistent sidebar */}
    </div>
  );
}