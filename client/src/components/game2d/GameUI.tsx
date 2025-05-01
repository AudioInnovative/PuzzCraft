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
    nextLevel
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
      {/* Game HUD styled like original Puzznic */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-start p-2 bg-black/80 border-b-4 border-blue-700">
        <div className="flex flex-col gap-2">
          <GamePanel title="Score" value={score.toString()} />
          <GamePanel title="Level" value={`${level}-${maxLevel}`} />
          <GamePanel 
            title="Time" 
            value={formatTime(timeLeft)} 
            alert={timeLeft <= 30}
          />
        </div>
        
        {/* Right-side blocks counter would go here in the future */}
        <div className="w-24"></div>
      </div>
      
      {/* Game messages */}
      {gamePhase === "ready" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/80 p-8 rounded-lg text-center">
            <h2 className="text-4xl font-bold text-white mb-4">Puzznic</h2>
            <p className="text-xl text-white mb-6">Match the blocks to clear the level!</p>
            <p className="text-white mb-2">Controls:</p>
            <p className="text-white mb-1">← → - Move selected block</p>
            <p className="text-white mb-1">Space - Select block</p>
            <p className="text-white mb-1">R - Restart level</p>
            {isMobile && (
              <p className="text-white mb-4">Swipe left/right to move blocks</p>
            )}
            <button 
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded pointer-events-auto"
              onClick={() => usePuzznic.getState().startGame()}
            >
              Start Game
            </button>
          </div>
        </div>
      )}
      
      {gamePhase === "level_complete" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/80 p-8 rounded-lg text-center">
            <h2 className="text-4xl font-bold text-white mb-4">Level Complete!</h2>
            <p className="text-xl text-white mb-6">You cleared all the blocks!</p>
            <p className="text-white mb-2">Score: {score}</p>
            <p className="text-white mb-2">Moves: {moveCount}</p>
            <p className="text-white mb-4">Time: {formatTime(timeLeft)}</p>
            <button 
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded pointer-events-auto"
              onClick={() => nextLevel()}
            >
              Next Level
            </button>
          </div>
        </div>
      )}
      
      {gamePhase === "game_over" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/80 p-8 rounded-lg text-center">
            <h2 className="text-4xl font-bold text-white mb-4">Game Over!</h2>
            <p className="text-xl text-white mb-6">You ran out of time!</p>
            <p className="text-white mb-2">Score: {score}</p>
            <p className="text-white mb-4">Moves: {moveCount}</p>
            <button 
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded pointer-events-auto mr-4"
              onClick={() => restartLevel()}
            >
              Retry Level
            </button>
            <button 
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded pointer-events-auto"
              onClick={() => nextLevel()}
            >
              New Game
            </button>
          </div>
        </div>
      )}
      
      {gamePhase === "game_won" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/80 p-8 rounded-lg text-center">
            <h2 className="text-4xl font-bold text-white mb-4">You Win!</h2>
            <p className="text-xl text-white mb-6">Congratulations! You completed all levels!</p>
            <p className="text-white mb-2">Final Score: {score}</p>
            <p className="text-white mb-4">Total Moves: {moveCount}</p>
            <button 
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded pointer-events-auto"
              onClick={() => {
                // Restart from level 1
                nextLevel();
              }}
            >
              Play Again
            </button>
          </div>
        </div>
      )}
      
      {/* Help text during gameplay */}
      {gamePhase === "playing" && (
        <div className="absolute bottom-4 left-4 right-4 flex justify-center">
          <div className="bg-black/50 p-2 rounded-lg text-center">
            {isMobile ? (
              <p className="text-sm text-white">
                Tap to select block | Swipe left/right to move | Tap and hold to restart
              </p>
            ) : (
              <p className="text-sm text-white">
                ← → to move selected block | Space to select | R to restart
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}