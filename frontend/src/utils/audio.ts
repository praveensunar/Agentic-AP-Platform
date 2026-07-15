/**
 * Plays a clean, programmatic synth notification alert chime using the browser Web Audio API.
 * This does not require downloading external mp3 files and runs with high compatibility.
 */
export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();
    
    // Check if audio context is suspended (some browsers block audio until user interaction)
    if (audioCtx.state === 'suspended') {
      // Resume audio context
      audioCtx.resume();
    }

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Warm electronic alert bell chime sound
    oscillator.type = 'sine';
    
    // Play two quick overlapping notes for a beautiful premium chime
    oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    oscillator.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.08); // A5

    gainNode.gain.setValueAtTime(0.0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.04); // Quick fade-in
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35); // Slow ring-out

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.40);
  } catch (error) {
    console.warn('Audio chime was blocked by browser or context suspension:', error);
  }
}
