/* ============================================================
   RPG Academy — Math Sprint   (game.js)
   ============================================================ */

// ──────────────── DATA ────────────────

const CLASS_DATA = {
  warrior: {
    icon: '\u2694',          // ⚔
    label: 'Warrior',
    statBias: { str: 3, dex: 2, int: 0, wis: 1 },
    subclasses: {
      'warrior-rogue':        { icon: '\uD83D\uDDE1', label: 'Rogue',        statBias: { str: 1, dex: 4, int: 1, wis: 0 } },
      'warrior-spiritborn':   { icon: '\uD83D\uDD25', label: 'Spiritborn',   statBias: { str: 2, dex: 1, int: 1, wis: 2 } },
      'warrior-battlemaster': { icon: '\uD83D\uDEE1', label: 'Battle Master', statBias: { str: 4, dex: 1, int: 0, wis: 1 } },
    },
  },
  mage: {
    icon: '\u2605',          // ★
    label: 'Mage',
    statBias: { str: 0, dex: 1, int: 3, wis: 2 },
    subclasses: {
      'mage-necromancer': { icon: '\uD83D\uDC80', label: 'Necromancer', statBias: { str: 0, dex: 0, int: 4, wis: 2 } },
      'mage-pyromancer':  { icon: '\uD83D\uDD25', label: 'Pyromancer',  statBias: { str: 1, dex: 1, int: 4, wis: 0 } },
      'mage-cryomancer':  { icon: '\u2744',       label: 'Cryomancer',  statBias: { str: 0, dex: 1, int: 3, wis: 2 } },
    },
  },
  cleric: {
    icon: '\u2624',          // ☤
    label: 'Cleric',
    statBias: { str: 1, dex: 0, int: 2, wis: 3 },
    subclasses: {
      'cleric-paladin': { icon: '\uD83D\uDEE1', label: 'Paladin', statBias: { str: 3, dex: 0, int: 1, wis: 2 } },
      'cleric-priest':  { icon: '\u2728',        label: 'Priest',  statBias: { str: 0, dex: 0, int: 2, wis: 4 } },
    },
  },
};

const SPRINT_DURATION = 30;           // seconds
const BASE_XP_PER_CORRECT = 10;
const STREAK_BONUS_XP = 2;           // extra XP per streak count
function xpForLevel(lvl) { return 80 + lvl * 20; }

// ──────────────── STATE ────────────────

let character = null;   // persisted to localStorage

/* character shape:
{
  name, className, subclassKey,
  level, xp,
  stats: { str, int, wis, dex },
  totalCorrect, totalWrong, bestStreak,
}
*/

// Sprint transient state
let sprint = null;

// ──────────────── DOM REFS ────────────────

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const screens = {
  title:   $('#screen-title'),
  create:  $('#screen-create'),
  hub:     $('#screen-hub'),
  sprint:  $('#screen-sprint'),
  results: $('#screen-results'),
};

// ──────────────── NAVIGATION ────────────────

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

// ──────────────── PERSISTENCE ────────────────

function saveCharacter() {
  localStorage.setItem('rpgAcademy_char', JSON.stringify(character));
}

function loadCharacter() {
  try {
    const raw = localStorage.getItem('rpgAcademy_char');
    if (raw) { character = JSON.parse(raw); return true; }
  } catch { /* ignore */ }
  return false;
}

// ──────────────── TITLE SCREEN ────────────────

$('#btn-new-game').addEventListener('click', () => showScreen('create'));
$('#btn-continue').addEventListener('click', () => { applyTheme(); refreshHub(); showScreen('hub'); });

function initTitle() {
  if (loadCharacter()) {
    $('#btn-continue').style.display = '';
  } else {
    $('#btn-continue').style.display = 'none';
  }
  showScreen('title');
}

// ──────────────── CHARACTER CREATION ────────────────

let selectedClass = null;
let selectedSubclass = null;

// Class cards
$$('#class-picker .class-card').forEach(card => {
  card.addEventListener('click', () => {
    $$('#class-picker .class-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    selectedClass = card.dataset.class;
    selectedSubclass = null;
    renderSubclasses();
    validateCreate();
  });
});

function renderSubclasses() {
  const picker = $('#subclass-picker');
  picker.innerHTML = '';
  if (!selectedClass) return;
  const subs = CLASS_DATA[selectedClass].subclasses;
  for (const [key, data] of Object.entries(subs)) {
    const btn = document.createElement('button');
    btn.className = 'class-card subclass-card';
    btn.dataset.subclass = key;
    btn.innerHTML = `<span class="class-icon">${data.icon}</span><span class="class-name">${data.label}</span>`;
    btn.addEventListener('click', () => {
      $$('#subclass-picker .class-card').forEach(c => c.classList.remove('selected'));
      btn.classList.add('selected');
      selectedSubclass = key;
      validateCreate();
    });
    picker.appendChild(btn);
  }
}

$('#char-name').addEventListener('input', validateCreate);

function validateCreate() {
  const nameOk = $('#char-name').value.trim().length > 0;
  $('#btn-start-adventure').disabled = !(nameOk && selectedClass && selectedSubclass);
}

$('#btn-start-adventure').addEventListener('click', () => {
  const subData = CLASS_DATA[selectedClass].subclasses[selectedSubclass];
  character = {
    name: $('#char-name').value.trim(),
    className: selectedClass,
    subclassKey: selectedSubclass,
    level: 1,
    xp: 0,
    stats: { str: subData.statBias.str, int: subData.statBias.int, wis: subData.statBias.wis, dex: subData.statBias.dex },
    totalCorrect: 0,
    totalWrong: 0,
    bestStreak: 0,
  };
  saveCharacter();
  applyTheme();
  refreshHub();
  showScreen('hub');
});

// ──────────────── HUB ────────────────

function applyTheme() {
  document.body.className = '';
  if (character) document.body.classList.add('theme-' + character.className);
}

function refreshHub() {
  if (!character) return;
  const cls = CLASS_DATA[character.className];
  const sub = cls.subclasses[character.subclassKey];

  $('#hub-icon').textContent = sub.icon;
  $('#hub-name').textContent = character.name;
  $('#hub-class').textContent = `${sub.label} (${cls.label})`;
  $('#hub-level').textContent = character.level;

  const needed = xpForLevel(character.level);
  const pct = Math.min(100, (character.xp / needed) * 100);
  $('#xp-fill').style.width = pct + '%';
  $('#xp-text').textContent = `${character.xp} / ${needed} XP`;

  $('#stat-str').textContent = character.stats.str;
  $('#stat-int').textContent = character.stats.int;
  $('#stat-wis').textContent = character.stats.wis;
  $('#stat-dex').textContent = character.stats.dex;
}

// Sprint buttons
$$('.sprint-card').forEach(card => {
  card.addEventListener('click', () => startSprint(card.dataset.op));
});

// Reset
$('#btn-reset').addEventListener('click', () => {
  if (confirm('Delete your character? This cannot be undone.')) {
    localStorage.removeItem('rpgAcademy_char');
    character = null;
    selectedClass = null;
    selectedSubclass = null;
    $('#char-name').value = '';
    $('#subclass-picker').innerHTML = '';
    $$('#class-picker .class-card').forEach(c => c.classList.remove('selected'));
    $('#btn-start-adventure').disabled = true;
    initTitle();
  }
});

// ──────────────── MATH PROBLEM GENERATOR ────────────────

function generateProblem(op, level) {
  // Difficulty scales with character level
  const maxNum = Math.min(10 + level * 3, 100);
  let a, b, answer, text;

  const pick = () => Math.floor(Math.random() * maxNum) + 1;

  switch (op) {
    case 'addition':
      a = pick(); b = pick();
      text = `${a} + ${b}`;
      answer = a + b;
      break;
    case 'subtraction':
      a = pick(); b = pick();
      if (b > a) [a, b] = [b, a];      // keep non-negative
      text = `${a} − ${b}`;
      answer = a - b;
      break;
    case 'multiplication':
      a = Math.floor(Math.random() * Math.min(12, 4 + level)) + 1;
      b = Math.floor(Math.random() * Math.min(12, 4 + level)) + 1;
      text = `${a} × ${b}`;
      answer = a * b;
      break;
    case 'division':
      b = Math.floor(Math.random() * Math.min(12, 4 + level)) + 1;
      answer = Math.floor(Math.random() * Math.min(12, 4 + level)) + 1;
      a = b * answer;                    // always clean division
      text = `${a} ÷ ${b}`;
      break;
    case 'mixed':
    default: {
      const ops = ['addition', 'subtraction', 'multiplication', 'division'];
      return generateProblem(ops[Math.floor(Math.random() * ops.length)], level);
    }
  }
  return { text, answer };
}

// ──────────────── SPRINT ────────────────

function startSprint(op) {
  sprint = {
    op,
    correct: 0,
    wrong: 0,
    streak: 0,
    bestStreak: 0,
    timeLeft: SPRINT_DURATION,
    timer: null,
    currentProblem: null,
  };

  $('#sprint-score').textContent = '0';
  $('#sprint-streak').textContent = '0';
  $('#sprint-timer').textContent = SPRINT_DURATION;
  $('#answer-input').value = '';
  $('#answer-feedback').textContent = '';
  $('#answer-feedback').className = 'answer-feedback';
  $('#answer-input').className = 'answer-input';

  showScreen('sprint');
  nextProblem();
  $('#answer-input').focus();

  sprint.timer = setInterval(() => {
    sprint.timeLeft--;
    $('#sprint-timer').textContent = sprint.timeLeft;
    if (sprint.timeLeft <= 0) endSprint();
  }, 1000);
}

function nextProblem() {
  sprint.currentProblem = generateProblem(sprint.op, character.level);
  $('#problem-text').textContent = sprint.currentProblem.text;
  $('#answer-input').value = '';
  $('#answer-input').className = 'answer-input';
  $('#answer-feedback').textContent = '';
  $('#answer-feedback').className = 'answer-feedback';
}

function submitAnswer() {
  const input = $('#answer-input');
  const val = input.value.trim();
  if (val === '') return;

  const userAnswer = parseInt(val, 10);
  if (isNaN(userAnswer)) return;

  if (userAnswer === sprint.currentProblem.answer) {
    sprint.correct++;
    sprint.streak++;
    if (sprint.streak > sprint.bestStreak) sprint.bestStreak = sprint.streak;
    input.className = 'answer-input correct';
    $('#answer-feedback').textContent = 'Correct!';
    $('#answer-feedback').className = 'answer-feedback correct';
  } else {
    sprint.wrong++;
    sprint.streak = 0;
    input.className = 'answer-input wrong';
    $('#answer-feedback').textContent = `Wrong — ${sprint.currentProblem.answer}`;
    $('#answer-feedback').className = 'answer-feedback wrong';
  }

  $('#sprint-score').textContent = sprint.correct;
  $('#sprint-streak').textContent = sprint.streak;

  setTimeout(() => nextProblem(), 350);
}

$('#btn-submit-answer').addEventListener('click', submitAnswer);
$('#answer-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') submitAnswer();
});
$('#btn-quit-sprint').addEventListener('click', () => endSprint());

function endSprint() {
  clearInterval(sprint.timer);

  // Calculate XP
  const xpEarned = sprint.correct * BASE_XP_PER_CORRECT
                  + sprint.bestStreak * STREAK_BONUS_XP;

  // Apply XP & check level up
  character.xp += xpEarned;
  character.totalCorrect += sprint.correct;
  character.totalWrong += sprint.wrong;
  if (sprint.bestStreak > character.bestStreak) character.bestStreak = sprint.bestStreak;

  let levelsGained = 0;
  while (character.xp >= xpForLevel(character.level)) {
    character.xp -= xpForLevel(character.level);
    character.level++;
    levelsGained++;
    // Grant stat points based on subclass bias
    const bias = CLASS_DATA[character.className].subclasses[character.subclassKey].statBias;
    const total = bias.str + bias.int + bias.wis + bias.dex;
    // Give 2 stat points per level, weighted by bias
    const pool = 2;
    let remaining = pool;
    const stats = ['str', 'int', 'wis', 'dex'];
    // Weighted random distribution
    for (let i = 0; i < pool; i++) {
      const roll = Math.random() * total;
      let cumulative = 0;
      for (const s of stats) {
        cumulative += bias[s];
        if (roll < cumulative) {
          character.stats[s]++;
          remaining--;
          break;
        }
      }
    }
    // Fallback: if rounding left remaining, give to highest bias
    if (remaining > 0) {
      const best = stats.reduce((a, b) => bias[a] >= bias[b] ? a : b);
      character.stats[best] += remaining;
    }
  }

  saveCharacter();

  // Show results
  $('#results-correct').textContent = sprint.correct;
  $('#results-wrong').textContent = sprint.wrong;
  $('#results-streak').textContent = sprint.bestStreak;
  $('#results-xp').textContent = '+' + xpEarned;

  if (levelsGained > 0) {
    $('#level-up-banner').style.display = '';
    $('#level-up-detail').textContent = `You reached Level ${character.level}!`;
  } else {
    $('#level-up-banner').style.display = 'none';
  }

  showScreen('results');
}

$('#btn-back-hub').addEventListener('click', () => {
  refreshHub();
  showScreen('hub');
});

// ──────────────── INIT ────────────────
initTitle();
