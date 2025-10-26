import 'webextension-polyfill';
import {
  pomodoroSettingsStorage,
  pomodoroStateStorage,
  pomodoroBlocklistStorage,
  elevenLabsConfigStorage,
  type PomodoroState,
} from '@extension/storage';

const ALARM_NAME = 'pomodoro-phase-end';
const DNR_RULE_START_ID = 10000;

const minuteToMs = (m: number) => Math.max(0, Math.round(m * 60 * 1000));

const clearPhaseAlarm = async () => {
  await chrome.alarms.clear(ALARM_NAME);
};

const schedulePhaseAlarm = async (when: number) => {
  await chrome.alarms.create(ALARM_NAME, { when });
};

const notify = async (title: string, message: string) => {
  try {
    await chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icon-34.png'),
      title,
      message,
    });
  } catch (e) {
    // noop
  }
};

const startPhase = async (phase: 'start-ritual' | 'work' | 'break' | 'end-ritual', resumeMs?: number) => {
  const [settings, state] = await Promise.all([
    pomodoroSettingsStorage.get(),
    pomodoroStateStorage.get(),
  ]);

  const durationMs = resumeMs ??
    (phase === 'work'
      ? minuteToMs(settings.workMinutes)
      : phase === 'break'
        ? minuteToMs(settings.breakMinutes)
        : phase === 'start-ritual'
          ? minuteToMs(settings.startRitualMinutes ?? 0)
          : minuteToMs(settings.endRitualMinutes ?? 0));
  const startedAt = Date.now();
  const expectedEndAt = startedAt + durationMs;

  await clearPhaseAlarm();
  await schedulePhaseAlarm(expectedEndAt);

  await pomodoroStateStorage.set({
    ...state,
    phase,
    isRunning: true,
    startedAt,
    expectedEndAt,
    pauseRemainingMs: null,
  });

  if (phase === 'work') await enableBlocking(); else await disableBlocking();

  if (!resumeMs) {
    if (phase === 'start-ritual') {
      await speak(
        "Alright, let’s get focused. Take a deep breath in... and out. You’ve got time to lock in. Pick one clear task and commit. You’re capable, calm, and ready. Let’s begin."
      );
    } else if (phase === 'work') {
      await notify('Pomodoro started', `Session ${state.currentSession}`);
    } else if (phase === 'break') {
      await notify('Break started', `Take a ${settings.breakMinutes} min break`);
      await speak(
        "Nice work — that’s one Pomodoro down! Step away from the screen. Stretch, hydrate, or get fresh air. Remember — this break is for recharging, not escaping."
      );
    }
  }
};

const completeAll = async () => {
  const state = await pomodoroStateStorage.get();
  await clearPhaseAlarm();
  await pomodoroStateStorage.set({
    ...state,
    phase: 'completed',
    isRunning: false,
    startedAt: null,
    expectedEndAt: null,
    pauseRemainingMs: null,
  });
  await notify('Pomodoro complete', 'All sessions finished');
  await speak(
    "That’s a full set done — amazing work. Reflect on what you accomplished. Consistency builds real progress. Take a longer break, celebrate the win, and come back strong."
  );
};

const handlePhaseEnd = async () => {
  const [settings, state] = await Promise.all([
    pomodoroSettingsStorage.get(),
    pomodoroStateStorage.get(),
  ]);

  if (state.phase === 'start-ritual') {
    await startPhase('work');
  } else if (state.phase === 'work') {
    // Work finished
    if (state.currentSession >= settings.totalSessions) {
      // go to end ritual if configured
      if ((settings.endRitualMinutes ?? 0) > 0) {
        await startPhase('end-ritual');
      } else {
        await completeAll();
      }
      return;
    }
    // Go to break
    await pomodoroStateStorage.set({
      ...state,
      // keep currentSession
    });
    await startPhase('break');
  } else if (state.phase === 'break') {
    // Break finished -> next work session
    await pomodoroStateStorage.set({
      ...state,
      currentSession: state.currentSession + 1,
    });
    await startPhase('work');
  } else if (state.phase === 'end-ritual') {
    await completeAll();
  } else {
    // Unexpected; just clear
    await clearPhaseAlarm();
  }
};

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === ALARM_NAME) {
    void handlePhaseEnd();
  }
});

chrome.runtime.onMessage.addListener((message: any, _sender, sendResponse) => {
  const respond = (ok = true) => sendResponse({ ok });
  (async () => {
    const state = await pomodoroStateStorage.get();
    switch (message?.type) {
      case 'pomodoro:start': {
        if (state.phase === 'paused' && state.pauseRemainingMs) {
          await startPhase(state.resumePhase === 'break' ? 'break' : 'work', state.pauseRemainingMs as number);
        } else if (state.phase === 'idle' || state.phase === 'completed') {
          await pomodoroStateStorage.set({
            ...state,
            currentSession: 1,
          });
          const settings = await pomodoroSettingsStorage.get();
          if ((settings.startRitualMinutes ?? 0) > 0) await startPhase('start-ritual');
          else await startPhase('work');
        } else if (!state.isRunning) {
          // resume current phase if we have expectedEndAt or pauseRemainingMs
          const remaining = state.expectedEndAt ? Math.max(0, state.expectedEndAt - Date.now()) : state.pauseRemainingMs ?? undefined;
          await startPhase(state.phase === 'break' ? 'break' : state.phase === 'start-ritual' ? 'start-ritual' : state.phase === 'end-ritual' ? 'end-ritual' : 'work', remaining);
        }
        respond();
        break;
      }
      case 'pomodoro:pause': {
        if (state.isRunning) {
          const remaining = state.expectedEndAt ? Math.max(0, state.expectedEndAt - Date.now()) : null;
          await clearPhaseAlarm();
          const newState: PomodoroState = {
            ...state,
            isRunning: false,
            phase: 'paused',
            startedAt: null,
            expectedEndAt: null,
            pauseRemainingMs: remaining,
            resumePhase: state.phase === 'break' ? 'break' : 'work',
          } as PomodoroState;
          await pomodoroStateStorage.set(newState);
          await disableBlocking();
        }
        respond();
        break;
      }
      case 'pomodoro:reset': {
        await clearPhaseAlarm();
        await pomodoroStateStorage.set({
          phase: 'idle',
          currentSession: 1,
          isRunning: false,
          startedAt: null,
          expectedEndAt: null,
          pauseRemainingMs: null,
          resumePhase: null,
        });
        await disableBlocking();
        respond();
        break;
      }
      default:
        respond(false);
    }
  })();
  return true; // keep channel open for async response
});

// Ensure alarm aligns with stored state on startup
(async () => {
  const state = await pomodoroStateStorage.get();
  if (state.isRunning && state.expectedEndAt) {
    if (Date.now() >= state.expectedEndAt) {
      await handlePhaseEnd();
    } else {
      await schedulePhaseAlarm(state.expectedEndAt);
    }
  } else {
    await clearPhaseAlarm();
  }
  // Ensure blocking state aligns on startup
  const current = await pomodoroStateStorage.get();
  if (current.phase === 'work' && current.isRunning) await enableBlocking();
  else await disableBlocking();
})();

console.log('Background loaded: Pomodoro timer ready');

// ---------- Site Blocking (DNR) ----------
async function enableBlocking() {
  const list = await pomodoroBlocklistStorage.get();
  const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
  const ours = currentRules.filter(r => r.id >= DNR_RULE_START_ID && r.id < DNR_RULE_START_ID + 1000).map(r => r.id);
  if (ours.length) await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: ours });

  const rules: chrome.declarativeNetRequest.Rule[] = list
    .filter(Boolean)
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 500)
    .map((entry, i) => {
      let filter = entry;
      try {
        const u = new URL(entry.includes('://') ? entry : `https://${entry}`);
        filter = `||${u.hostname}^`;
      } catch {
        // keep as-is
      }
      return {
        id: DNR_RULE_START_ID + i,
        priority: 1,
        action: { type: chrome.declarativeNetRequest.RuleActionType.BLOCK },
        condition: { urlFilter: filter, resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME] },
      };
    });

  if (rules.length) await chrome.declarativeNetRequest.updateDynamicRules({ addRules: rules });
}

async function disableBlocking() {
  const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
  const ours = currentRules.filter(r => r.id >= DNR_RULE_START_ID && r.id < DNR_RULE_START_ID + 1000).map(r => r.id);
  if (ours.length) await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: ours });
}

// Best-effort coach when navigating to blocked sites (in addition to DNR)
chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo) => {
  if (changeInfo.status !== 'loading' || !changeInfo.url) return;
  const state = await pomodoroStateStorage.get();
  if (!(state.isRunning && state.phase === 'work')) return;
  const list = await pomodoroBlocklistStorage.get();
  if (list.some(entry => changeInfo.url!.includes(entry))) {
    await speak("Let's get back to work and avoid distractions.");
  }
});

// ---------- ElevenLabs Voice Coach ----------
async function ensureOffscreen() {
  const exists = await chrome.offscreen.hasDocument?.().catch(() => false);
  if (exists) return;
  await chrome.offscreen.createDocument({
    url: chrome.runtime.getURL('offscreen.html'),
    reasons: ['AUDIO_PLAYBACK'],
    justification: 'Play voice coach prompts during study sessions',
  });
}

async function speak(text: string) {
  try {
    const cfg = await elevenLabsConfigStorage.get();
    if (!cfg.enabled || !cfg.apiKey || !cfg.voiceId) return;
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${cfg.voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': cfg.apiKey,
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.4, similarity_boost: 0.8 },
      }),
    });
    if (!res.ok) return;
    const buf = await res.arrayBuffer();
    await ensureOffscreen();
    await chrome.runtime.sendMessage({ type: 'offscreen:play-audio', audioBuffer: buf });
  } catch {
    // ignore
  }
}
