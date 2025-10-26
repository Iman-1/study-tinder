// Offscreen audio player: receives ArrayBuffer and plays it.
let audio = null;
chrome.runtime.onMessage.addListener((msg, _sender, _sendResponse) => {
  if (msg?.type === 'offscreen:play-audio' && msg?.audioBuffer) {
    const blob = new Blob([msg.audioBuffer], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    if (!audio) audio = new Audio();
    audio.src = url;
    audio.onended = () => URL.revokeObjectURL(url);
    audio.play().catch(() => {
      // ignore play errors (e.g., user gesture required in some contexts)
    });
  }
});
