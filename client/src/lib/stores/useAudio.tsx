import { create } from "zustand";

interface AudioState {
  backgroundMusic: HTMLAudioElement | null;
  hitSound: HTMLAudioElement | null;
  successSound: HTMLAudioElement | null;
  moveSound: HTMLAudioElement | null;
  matchSound: HTMLAudioElement | null;
  fallSound: HTMLAudioElement | null;
  isMuted: boolean;
  
  // Setter functions
  setBackgroundMusic: (music: HTMLAudioElement) => void;
  setHitSound: (sound: HTMLAudioElement) => void;
  setSuccessSound: (sound: HTMLAudioElement) => void;
  setMoveSound: (sound: HTMLAudioElement) => void;
  setMatchSound: (sound: HTMLAudioElement) => void;
  setFallSound: (sound: HTMLAudioElement) => void;
  
  // Control functions
  toggleMute: () => void;
  playHit: () => void;
  playSuccess: () => void;
  playMove: () => void;
  playMatch: () => void;
  playFall: () => void;
}

export const useAudio = create<AudioState>((set, get) => ({
  backgroundMusic: null,
  hitSound: null,
  successSound: null,
  moveSound: null,
  matchSound: null,
  fallSound: null,
  isMuted: false, // Start with sound enabled
  
  setBackgroundMusic: (music) => set({ backgroundMusic: music }),
  setHitSound: (sound) => set({ hitSound: sound }),
  setSuccessSound: (sound) => set({ successSound: sound }),
  setMoveSound: (sound) => set({ moveSound: sound }),
  setMatchSound: (sound) => set({ matchSound: sound }),
  setFallSound: (sound) => set({ fallSound: sound }),
  
  toggleMute: () => {
    const { isMuted } = get();
    const newMutedState = !isMuted;
    
    // Just update the muted state
    set({ isMuted: newMutedState });
    
    // Log the change
    console.log(`Sound ${newMutedState ? 'muted' : 'unmuted'}`);
  },
  
  playHit: () => {
    const { hitSound, isMuted } = get();
    if (hitSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Hit sound skipped (muted)");
        return;
      }
      
      // Clone the sound to allow overlapping playback
      const soundClone = hitSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.3;
      soundClone.play().catch(error => {
        console.log("Hit sound play prevented:", error);
      });
    }
  },
  
  playSuccess: () => {
    const { successSound, isMuted } = get();
    if (successSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Success sound skipped (muted)");
        return;
      }
      
      successSound.currentTime = 0;
      successSound.play().catch(error => {
        console.log("Success sound play prevented:", error);
      });
    }
  },
  
  playMove: () => {
    const { moveSound, isMuted } = get();
    if (moveSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Move sound skipped (muted)");
        return;
      }
      
      // Clone the sound to allow overlapping playback
      const soundClone = moveSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.15; // Lower volume for move sound
      soundClone.play().catch(error => {
        console.log("Move sound play prevented:", error);
      });
    }
  },
  
  playMatch: () => {
    const { isMuted } = get();
    
    // If sound is muted, don't play anything
    if (isMuted) {
      console.log("Match sound skipped (muted)");
      return;
    }
    
    // Create Web Audio API context
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create oscillator for laser-like sound
      const oscillator = audioContext.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // Starting frequency
      oscillator.frequency.exponentialRampToValueAtTime(2200, audioContext.currentTime + 0.15); // Ending frequency
      
      // Create volume node
      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(0.05, audioContext.currentTime); // Lower volume
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15); // Fade out
      
      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Start and stop oscillator
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.15);
      
      console.log("Generated laser sound played");
    } catch (error) {
      console.log("Web Audio API error:", error);
    }
  },
  
  playFall: () => {
    const { fallSound, isMuted } = get();
    if (fallSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Fall sound skipped (muted)");
        return;
      }
      
      // Clone the sound to allow overlapping playback
      const soundClone = fallSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.2; // Lower volume for fall sound
      soundClone.play().catch(error => {
        console.log("Fall sound play prevented:", error);
      });
    }
  }
}));
