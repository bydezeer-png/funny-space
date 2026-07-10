export function playSuccessSound() {
  if (typeof window === 'undefined') return;
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playBeep = (freq: number, startDelay: number, duration: number) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start(audioCtx.currentTime + startDelay);
      
      gain.gain.setValueAtTime(0, audioCtx.currentTime + startDelay);
      gain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + startDelay + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + startDelay + duration);
      
      osc.stop(audioCtx.currentTime + startDelay + duration);
    };

    // Double pleasant high chime
    playBeep(660, 0, 0.15);
    playBeep(880, 0.1, 0.25);
  } catch (e) {
    console.error("Failed to play success sound: ", e);
  }
}

export function playErrorSound() {
  if (typeof window === 'undefined') return;
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playBeep = (freq: number, startDelay: number, duration: number) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start(audioCtx.currentTime + startDelay);
      
      gain.gain.setValueAtTime(0, audioCtx.currentTime + startDelay);
      gain.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + startDelay + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + startDelay + duration);
      
      osc.stop(audioCtx.currentTime + startDelay + duration);
    };

    // Buzzy warning sound
    playBeep(180, 0, 0.35);
  } catch (e) {
    console.error("Failed to play error sound: ", e);
  }
}
