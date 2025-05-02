import { usePuzznic } from "../../lib/stores/usePuzznic";
import { GamePanel } from "../ui/game-panel";
import { useIsMobile } from "../../hooks/use-is-mobile";

export default function GameUI2D() {
  const { 
    gamePhase, 
    level, 
    maxLevel,
    score, 
    moveCount, 
    timeLeft,
    restartLevel,
    nextLevel,
    enterEditMode,
    exitEditMode,
    isTestingCustomLevel
  } = usePuzznic();
  const isMobile = useIsMobile();
  
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
        
        {/* Controls help */}
        {gamePhase === "playing" && (
          <div className="mt-4 pt-2 border-t border-gray-700 w-full">
            <h3 className="text-xs uppercase font-bold text-white mb-1">Controls</h3>
            <div className="text-xs text-cyan-300">
              {isMobile ? (
                <>
                  <p className="mb-1">• Tap to select</p>
                  <p className="mb-1">• Swipe to move</p>
                  <p className="mb-1">• Hold to restart</p>
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
      {gamePhase === "ready" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black p-8 border-4 border-cyan-600 text-center w-4/5 max-w-md">
            <h2 className="text-4xl font-bold text-cyan-300 mb-6 font-mono tracking-wider">PUZZNIC</h2>
            <div className="bg-blue-900 border-2 border-blue-700 p-4 mb-6">
              <p className="text-xl text-white mb-4">MATCH THE BLOCKS TO CLEAR THE LEVEL!</p>
              <p className="text-white font-bold mb-3 uppercase">Controls:</p>
              <p className="text-cyan-300 mb-1 font-mono">← → - MOVE BLOCK</p>
              <p className="text-cyan-300 mb-1 font-mono">SPACE - SELECT BLOCK</p>
              <p className="text-cyan-300 mb-1 font-mono">R - RESTART LEVEL</p>
              {isMobile && (
                <p className="text-yellow-300 mt-3 font-mono">TAP & SWIPE TO PLAY ON MOBILE</p>
              )}
            </div>
            <div className="flex justify-center space-x-4">
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