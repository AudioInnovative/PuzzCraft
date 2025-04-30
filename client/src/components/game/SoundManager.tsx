import { useEffect } from "react";
import { useAudio } from "../../lib/stores/useAudio";
import { usePuzznic } from "../../lib/stores/usePuzznic";

export default function SoundManager() {
  const { backgroundMusic, toggleMute, isMuted, playSuccess } = useAudio();
  const { gamePhase } = usePuzznic();
  
  // Play background music when game starts
  useEffect(() => {
    if (backgroundMusic) {
      if (gamePhase === "playing") {
        backgroundMusic.play().catch(err => {
          console.log("Failed to play background music:", err);
        });
      } else {
        backgroundMusic.pause();
      }
    }
    
    return () => {
      if (backgroundMusic) {
        backgroundMusic.pause();
      }
    };
  }, [backgroundMusic, gamePhase]);
  
  // Play success sound on level complete
  useEffect(() => {
    if (gamePhase === "level_complete" || gamePhase === "game_won") {
      playSuccess();
    }
  }, [gamePhase, playSuccess]);
  
  return (
    <div className="absolute top-4 right-4">
      <button 
        className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors duration-200 pointer-events-auto"
        onClick={toggleMute}
      >
        {isMuted ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="3" x2="21" y2="21" />
            <path d="M18.4 5.6a10 10 0 0 1 2.6 6.4" />
            <path d="M19.5 2.5a14 14 0 0 1 4.5 11.5" />
            <path d="M12 6L8 10H6a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2l4 4V6z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 6L8 10H6a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2l4 4V6z" />
            <path d="M19.5 2.5a14 14 0 0 1 0 19" />
            <path d="M16 8a6 6 0 0 1 0 8" />
          </svg>
        )}
      </button>
    </div>
  );
}
