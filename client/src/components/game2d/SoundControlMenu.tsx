import React, { useState } from "react";
import { useAudio } from "../../lib/stores/useAudio";

const SoundControlMenu: React.FC = () => {
  const {
    backgroundMusic,
    hitSound,
    successSound,
    moveSound,
    matchSound,
    fallSound,
    isMuted,
    setBackgroundMusic,
    setHitSound,
    setSuccessSound,
    setMoveSound,
    setMatchSound,
    setFallSound,
    toggleMute,
  } = useAudio();

  // Local UI state for volumes
  const [bgVolume, setBgVolume] = useState(backgroundMusic ? backgroundMusic.volume : 0.15);
  const [sfxVolume, setSfxVolume] = useState(
    hitSound ? hitSound.volume : 0.5
  );
  const [bgMuted, setBgMuted] = useState(backgroundMusic ? backgroundMusic.muted : false);
  const [sfxMuted, setSfxMuted] = useState(
    hitSound ? hitSound.muted : false
  );

  // Handlers
  const handleBgVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Number(e.target.value);
    setBgVolume(vol);
    if (backgroundMusic) backgroundMusic.volume = vol;
  };

  const handleSfxVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Number(e.target.value);
    setSfxVolume(vol);
    [hitSound, successSound, moveSound, matchSound, fallSound].forEach(snd => {
      if (snd) snd.volume = vol;
    });
  };

  const handleBgMute = () => {
    if (backgroundMusic) {
      backgroundMusic.muted = !bgMuted;
      setBgMuted(!bgMuted);
    }
  };

  const handleSfxMute = () => {
    [hitSound, successSound, moveSound, matchSound, fallSound].forEach(snd => {
      if (snd) snd.muted = !sfxMuted;
    });
    setSfxMuted(!sfxMuted);
  };

  return (
    <div style={{
      position: "absolute",
      top: 60, // 40px below button (button is 20px from top + ~40px height)
      right: 20,
      background: "rgba(30,30,40,0.97)",
      borderRadius: 12,
      padding: 20,
      zIndex: 1000,
      boxShadow: "0 2px 16px #0006",
      minWidth: 220,
      color: "#fff"
    }}>
      <h3 style={{marginTop:0, marginBottom:12}}>Sound Settings</h3>
      <div style={{marginBottom:18}}>
        <label style={{fontWeight:600}}>Background Music</label><br />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={bgVolume}
          onChange={handleBgVolume}
          style={{width: "100%"}}
        />
        <button onClick={handleBgMute} style={{marginTop:6}}>
          {bgMuted ? "Unmute" : "Mute"}
        </button>
      </div>
      <div>
        <label style={{fontWeight:600}}>Sound Effects</label><br />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={sfxVolume}
          onChange={handleSfxVolume}
          style={{width: "100%"}}
        />
        <button onClick={handleSfxMute} style={{marginTop:6}}>
          {sfxMuted ? "Unmute" : "Mute"}
        </button>
      </div>
    </div>
  );
};

export default SoundControlMenu;
