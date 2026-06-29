'use strict';

// State
let studySeconds = 0;
let breakSeconds = 0;
let currentState = 'study';
let timerInterval = null;
let consecutiveBreakSeconds = 0;
let streakIncrementedToday = false;
let optionsOpen = false;
let isCollapsed = false;

const BREAK_WARNING_THRESHOLD = 900; // 15 minutes

// DOM refs
const studyTimeEl = document.getElementById('study-time');
const breakTimeEl = document.getElementById('break-time');
const studyBoxEl  = document.getElementById('study-box');
const breakBoxEl  = document.getElementById('break-box');
const modeToggle  = document.getElementById('mode-toggle');
const toggleIcon  = document.getElementById('toggle-icon');
const toggleLabel = document.getElementById('toggle-label');
const toggleHint  = document.getElementById('toggle-hint');
const warnMsg     = document.getElementById('warn-msg');
const focusRow    = document.getElementById('focus-score-row');
const focusPct    = document.getElementById('focus-pct');
const focusFill   = document.getElementById('focus-bar-fill');
const streakValue = document.getElementById('streak-value');
const counterVal  = document.getElementById('counter-value');
const mainContent = document.getElementById('main-content');
const btnTogSize  = document.getElementById('btn-toggle-size');
const btnClose    = document.getElementById('btn-close');
const btnMore     = document.getElementById('btn-more');
const optPanel    = document.getElementById('options-panel');
const sumStudy    = document.getElementById('sum-study');
const sumBreak    = document.getElementById('sum-break');
const sumProblems = document.getElementById('sum-problems');

// ── Helpers ────────────────────────────────────────────────────────────────

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

// ── Timer ──────────────────────────────────────────────────────────────────

function updateTimerUI() {
  studyTimeEl.textContent = formatTime(studySeconds);
  breakTimeEl.textContent = formatTime(breakSeconds);

  if (currentState === 'study') {
    studyBoxEl.classList.add('timer-active-study');
    studyBoxEl.classList.remove('timer-active-break');
    breakBoxEl.classList.remove('timer-active-break');
    breakBoxEl.classList.remove('timer-active-study');
  } else {
    breakBoxEl.classList.add('timer-active-break');
    breakBoxEl.classList.remove('timer-active-study');
    studyBoxEl.classList.remove('timer-active-study');
    studyBoxEl.classList.remove('timer-active-break');
  }
}

function updateFocusScore() {
  const total = studySeconds + breakSeconds;
  const pct = total === 0 ? 100 : Math.round((studySeconds / total) * 100);

  focusPct.textContent = pct + '%';
  focusFill.style.width = pct + '%';

  focusRow.classList.remove('score-green', 'score-amber', 'score-red');
  if (pct >= 70) {
    focusRow.classList.add('score-green');
  } else if (pct >= 50) {
    focusRow.classList.add('score-amber');
  } else {
    focusRow.classList.add('score-red');
  }
}

function updateWarningState() {
  if (consecutiveBreakSeconds >= BREAK_WARNING_THRESHOLD) {
    document.body.classList.add('break-warning');
    warnMsg.style.display = 'block';
  } else {
    document.body.classList.remove('break-warning');
    warnMsg.style.display = 'none';
  }
}

function startTicking() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (currentState === 'study') {
      studySeconds++;
      consecutiveBreakSeconds = 0;
    } else {
      breakSeconds++;
      consecutiveBreakSeconds++;
    }

    updateTimerUI();
    updateFocusScore();
    updateWarningState();
    window.api.saveStudySeconds(studySeconds);

    if (!streakIncrementedToday && studySeconds >= 3600) {
      streakIncrementedToday = true;
      window.api.incrementStreak().then(updateStreakUI);
    }
  }, 1000);
}

// ── Toggle ─────────────────────────────────────────────────────────────────

function applyToggleUI() {
  modeToggle.classList.remove('mode-study', 'mode-break');

  if (currentState === 'study') {
    modeToggle.classList.add('mode-study');
    toggleIcon.textContent  = '📚';
    toggleLabel.textContent = 'Studying';
    toggleHint.textContent  = 'tap to take a break';
  } else {
    modeToggle.classList.add('mode-break');
    toggleIcon.textContent  = '☕';
    toggleLabel.textContent = 'On a break';
    toggleHint.textContent  = 'tap to get back to work';
  }
}

modeToggle.addEventListener('click', () => {
  currentState = currentState === 'study' ? 'break' : 'study';
  if (currentState === 'study') {
    consecutiveBreakSeconds = 0;
  }
  applyToggleUI();
  updateWarningState();
  updateTimerUI();
});

// ── Collapse / Expand ──────────────────────────────────────────────────────

btnTogSize.addEventListener('click', () => {
  isCollapsed = !isCollapsed;
  if (isCollapsed) {
    mainContent.style.display = 'none';
    btnTogSize.textContent = '▴';
    window.api.collapse();
  } else {
    mainContent.style.display = 'flex';
    btnTogSize.textContent = '▾';
    if (optionsOpen) {
      window.api.setHeight(400);
    } else {
      window.api.expand();
    }
  }
});

// ── Close ──────────────────────────────────────────────────────────────────

btnClose.addEventListener('click', () => {
  window.api.closeApp();
});

// ── Problem counter ────────────────────────────────────────────────────────

async function initCounter() {
  const count = await window.api.getCount();
  counterVal.textContent = count;

  document.getElementById('btn-inc').addEventListener('click', async () => {
    const val = await window.api.incrementCount();
    counterVal.textContent = val;
  });

  document.getElementById('btn-dec').addEventListener('click', async () => {
    const val = await window.api.decrementCount();
    counterVal.textContent = val;
  });
}

// ── Streak ─────────────────────────────────────────────────────────────────

function updateStreakUI(val) {
  streakValue.textContent = val === 1 ? '1 day' : val + ' days';
}

// ── More / Options panel ───────────────────────────────────────────────────

function updateSummary() {
  const sh = Math.floor(studySeconds / 3600);
  const sm = Math.floor((studySeconds % 3600) / 60);
  const bh = Math.floor(breakSeconds / 3600);
  const bm = Math.floor((breakSeconds % 3600) / 60);

  sumStudy.textContent = sh + 'h ' + sm + 'm';
  sumBreak.textContent = bh + 'h ' + bm + 'm';

  window.api.getCount().then((c) => {
    sumProblems.textContent = c;
  });
}

btnMore.addEventListener('click', () => {
  optionsOpen = !optionsOpen;

  if (optionsOpen) {
    optPanel.style.display = 'flex';
    btnMore.textContent = '✕ Close';
    updateSummary();
    window.api.setHeight(400);
  } else {
    optPanel.style.display = 'none';
    btnMore.innerHTML = '&#8943; More';
    window.api.setHeight(260);
  }
});

document.getElementById('btn-reset-session').addEventListener('click', () => {
  if (!confirm('Reset all session timers? This cannot be undone.')) return;
  studySeconds = 0;
  breakSeconds = 0;
  consecutiveBreakSeconds = 0;
  streakIncrementedToday = false;
  updateTimerUI();
  updateFocusScore();
  updateWarningState();
  updateSummary();
});

document.getElementById('btn-reset-counter').addEventListener('click', async () => {
  if (!confirm('Reset the problem counter to 0?')) return;
  await window.api.resetCount();
  counterVal.textContent = 0;
  updateSummary();
});

document.getElementById('btn-reset-streak').addEventListener('click', async () => {
  if (!confirm('Reset your streak to 0 days?')) return;
  await window.api.resetStreak();
  updateStreakUI(0);
});

// ── Startup ────────────────────────────────────────────────────────────────

applyToggleUI();
startTicking();
updateFocusScore();
initCounter();
window.api.getStreak().then(updateStreakUI);
