/* =========================================================
   NUMBER HUNT Ver.2.1 - script.js
   Vanilla JS / 外部ライブラリなし
   ========================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     設定（数値はすべてここで管理）
     --------------------------------------------------------- */
  const CONFIG = Object.freeze({
    VERSION: '2.1',   // index.html の ?v= と揃える

    // モード（キー＝モードID、値＝制限秒数）
    GAME_DURATIONS: Object.freeze({ 30: 30, 60: 60 }),
    DEFAULT_MODE: 30,

    // カウントダウン秒数（0 にするとカウントダウンなしで即開始）
    COUNTDOWN_DURATION: 3,         // タイトルからの開始
    RETRY_COUNTDOWN_DURATION: 1,   // 「もう一度」からの開始
    COUNTDOWN_STEP_MS: 1000,
    COUNTDOWN_GO_MS: 500,          // "START!" の表示時間

    TIMEUP_DISPLAY_MS: 700,
    RESULT_INPUT_GUARD_MS: 400,    // 結果表示直後の誤タップ防止

    CORRECT_SCORE: 100,
    MISS_SCORE: 50,
    MISS_TIME_PENALTY: 1,          // 秒

    COMBO_BONUS_INTERVAL: 10,      // 10,20,30…コンボ到達で
    COMBO_BONUS_SCORE: 300,        // ボーナス加点

    GRID_SIZE: 9,
    NUM_MIN: 1,
    MIN_CORRECT: 2,                // 1問あたりの正解数（理想 2〜5）
    MAX_CORRECT: 5,
    MAX_GENERATE_ATTEMPTS: 60,
    LOWER_LEVEL_MIX_RATE: 0.35,    // 上位レベルで下位の条件を混ぜる確率

    QUESTION_TRANSITION_DELAY: 180, // 全正解→次の問題まで(ms) 150〜250推奨
    TICK_INTERVAL: 100,
    TIME_WARN: 10,
    TIME_DANGER: 5,                // この秒数から毎秒警告音

    SOUND_ENABLED_DEFAULT: true,
    HISTORY_LIMIT: 10,
    RECENT_SCORE_COUNT: 5,         // 結果画面の直近スコア本数
    VIBRATE_MS: 40,

    STORAGE_KEYS: Object.freeze({
      BEST_PREFIX: 'numberHuntBestScore',   // + モードID（例: numberHuntBestScore30）
      LEGACY_BEST: 'numberHuntBestScore',   // MVP版（60秒）のキー
      SOUND: 'numberHuntSoundEnabled',
    }),

    SOUND: Object.freeze({
      MASTER_VOLUME: 0.35,
      CORRECT_BASE_FREQ: 880,
      // コンボに応じた正解音の音程（半音）
      COMBO_PITCH_STEPS: [
        { minCombo: 15, semitones: 7 },
        { minCombo: 10, semitones: 4 },
        { minCombo: 5,  semitones: 2 },
        { minCombo: 0,  semitones: 0 },
      ],
    }),

    // 正解タップ数でレベル決定（MVPと同条件で比較するため据え置き）
    LEVELS: [
      { level: 1, minCorrect: 0,  numMax: 20 },
      { level: 2, minCorrect: 10, numMax: 20 },
      { level: 3, minCorrect: 20, numMax: 30 },
      { level: 4, minCorrect: 35, numMax: 30 },
    ],

    COMBO_MULTIPLIERS: [
      { minCombo: 20, rate: 2.5 },
      { minCombo: 15, rate: 2.0 },
      { minCombo: 10, rate: 1.5 },
      { minCombo: 5,  rate: 1.2 },
      { minCombo: 0,  rate: 1.0 },
    ],
  });

  const MODES = Object.keys(CONFIG.GAME_DURATIONS).map(Number);

  /* ---------------------------------------------------------
     ユーティリティ
     --------------------------------------------------------- */
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const sample = (arr, n) => shuffle(arr).slice(0, n);
  const range = (min, max) => Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const fmt = (n) => Number(n).toLocaleString('en-US');

  /* ---------------------------------------------------------
     問題条件の定義（新モードはここに追加する想定）
     --------------------------------------------------------- */
  const CONDITIONS = {
    1: [
      ({ min, max }) => {
        const t = randInt(min + 3, max - 5);
        return { text: `<b>${t}</b>より大きい数字`, test: (n) => n > t };
      },
      ({ min, max }) => {
        const t = randInt(min + 5, max - 3);
        return { text: `<b>${t}</b>より小さい数字`, test: (n) => n < t };
      },
    ],
    2: [
      () => ({ text: '<b>偶数</b>', test: (n) => n % 2 === 0 }),
      () => ({ text: '<b>奇数</b>', test: (n) => n % 2 === 1 }),
    ],
    3: [3, 4, 5].map((k) => () => ({
      text: `<b>${k}の倍数</b>`,
      test: (n) => n % k === 0,
    })),
    4: [
      ({ min, max }) => {
        const t = randInt(min + 3, max - 8);
        return { text: `<b>奇数</b>かつ<b>${t}以上</b>`, test: (n) => n % 2 === 1 && n >= t };
      },
      ({ min, max }) => {
        const t = randInt(min + 8, max - 3);
        return { text: `<b>偶数</b>かつ<b>${t}以下</b>`, test: (n) => n % 2 === 0 && n <= t };
      },
      ({ min, max }) => {
        const t = randInt(min + 8, max - 3);
        return { text: `<b>奇数</b>かつ<b>${t}以下</b>`, test: (n) => n % 2 === 1 && n <= t };
      },
      ({ min, max }) => {
        const t = randInt(min + 3, max - 8);
        return { text: `<b>偶数</b>かつ<b>${t}以上</b>`, test: (n) => n % 2 === 0 && n >= t };
      },
    ],
  };

  /* ---------------------------------------------------------
     ルール計算（純粋関数・テスト対象）
     --------------------------------------------------------- */
  function getDuration(mode) {
    return CONFIG.GAME_DURATIONS[mode] || CONFIG.GAME_DURATIONS[CONFIG.DEFAULT_MODE];
  }

  function getLevelConfig(level) {
    return CONFIG.LEVELS.find((l) => l.level === level) || CONFIG.LEVELS[0];
  }

  function getLevel(correctCount) {
    let lv = CONFIG.LEVELS[0].level;
    for (const l of CONFIG.LEVELS) if (correctCount >= l.minCorrect) lv = l.level;
    return lv;
  }

  function getMultiplier(combo) {
    for (const m of CONFIG.COMBO_MULTIPLIERS) if (combo >= m.minCombo) return m.rate;
    return 1;
  }

  function calcCorrectPoints(combo) {
    return Math.round(CONFIG.CORRECT_SCORE * getMultiplier(combo));
  }

  // prev→next のコンボ増加で「新たに到達した10の倍数」の数だけボーナス
  // （コンボは1ずつしか増えないので実質0か1回。二重加算は構造的に起きない）
  function calcComboBonus(prevCombo, nextCombo) {
    if (nextCombo <= prevCombo) return 0;
    const step = CONFIG.COMBO_BONUS_INTERVAL;
    const reached = Math.floor(nextCombo / step) - Math.floor(prevCombo / step);
    return Math.max(0, reached) * CONFIG.COMBO_BONUS_SCORE;
  }

  function calcAccuracyValue(correct, miss) {
    const total = correct + miss;
    if (!total) return 0;
    return Math.round((correct / total) * 1000) / 10;
  }

  function formatAccuracy(correct, miss) {
    const total = correct + miss;
    if (!total) return '0%';
    return ((correct / total) * 100).toFixed(1) + '%';
  }

  function getCountdownSteps(seconds) {
    if (!seconds || seconds <= 0) return [];
    const steps = [];
    for (let s = seconds; s >= 1; s--) steps.push(String(s));
    steps.push('START!');
    return steps;
  }

  // 直近 limit 件だけ残す（新しい配列を返す）
  function addHistory(list, entry, limit) {
    const next = list.concat([entry]);
    return next.length > limit ? next.slice(next.length - limit) : next;
  }

  // 結果画面のグラフ用：同じモードの直近 count 件（古い→新しい順）
  function getRecentScores(history, mode, count) {
    return history.filter((h) => h.mode === mode).slice(-count).map((h) => h.score);
  }

  // 棒の高さ（0〜1）。最大値0でも0除算しない
  function calcBarRatios(scores) {
    const max = Math.max(1, ...scores);
    return scores.map((v) => v / max);
  }

  // 直前（同じモード）との差分表示
  function formatDelta(current, previous) {
    if (previous === null || previous === undefined) return '';
    const d = current - previous;
    if (d > 0) return '↑ +' + fmt(d);
    if (d < 0) return '↓ -' + fmt(-d);
    return '±0';
  }

  /* ---------- セッション集計（セッション全体の累積値） ---------- */
  function createAggregate() {
    return {
      totalPlays: 0, retries: 0, titleStarts: 0, completedPlays: 0,
      totalScore: 0, totalCorrect: 0, totalMiss: 0,
      totalAccuracySum: 0, totalMaxComboSum: 0, totalMaxLevelSum: 0,
    };
  }

  function recordStart(agg, isRetry) {
    agg.totalPlays += 1;
    if (isRetry) agg.retries += 1;
    else agg.titleStarts += 1;
  }

  function recordResult(agg, r) {
    agg.completedPlays += 1;
    agg.totalScore += r.score;
    agg.totalCorrect += r.correct;
    agg.totalMiss += r.miss;
    agg.totalAccuracySum += r.accuracy;
    agg.totalMaxComboSum += r.maxCombo;
    agg.totalMaxLevelSum += r.maxLevel;
  }

  function summarizeAggregate(agg) {
    const round1 = (v) => Math.round(v * 10) / 10;
    const avg = (sum) => (agg.completedPlays ? round1(sum / agg.completedPlays) : 0);
    return {
      ...agg,
      totalAccuracySum: round1(agg.totalAccuracySum),
      retryRate: agg.totalPlays ? Math.round((agg.retries / agg.totalPlays) * 1000) / 1000 : 0,
      averageScore: avg(agg.totalScore),
      averageAccuracy: avg(agg.totalAccuracySum),          // 1プレイごとの正答率の平均
      overallAccuracy: calcAccuracyValue(agg.totalCorrect, agg.totalMiss), // 全タップ合算
      averageMaxCombo: avg(agg.totalMaxComboSum),
      averageMaxLevel: avg(agg.totalMaxLevelSum),
    };
  }

  /* ---------------------------------------------------------
     問題生成
     正解数kを先に決めて正解候補からk個・不正解候補から9-k個を選ぶ
     --------------------------------------------------------- */
  function pickCondition(level, numRange) {
    let tier = level;
    if (level > 1 && Math.random() < CONFIG.LOWER_LEVEL_MIX_RATE) tier = randInt(1, level - 1);
    const builders = CONDITIONS[tier];
    return builders[randInt(0, builders.length - 1)](numRange);
  }

  function buildQuestion(cond, hits, misses) {
    const cells = shuffle(hits.concat(misses)).map((value) => ({
      value,
      correct: cond.test(value),
      done: false,
    }));
    return { text: cond.text, cells, remaining: cells.filter((c) => c.correct).length };
  }

  function generateQuestion(level, prevText) {
    const numRange = { min: CONFIG.NUM_MIN, max: getLevelConfig(level).numMax };
    const pool = range(numRange.min, numRange.max);
    const size = CONFIG.GRID_SIZE;

    for (let i = 0; i < CONFIG.MAX_GENERATE_ATTEMPTS; i++) {
      const cond = pickCondition(level, numRange);
      if (cond.text === prevText) continue;

      const hitPool = pool.filter(cond.test);
      const missPool = pool.filter((n) => !cond.test(n));
      const maxK = Math.min(CONFIG.MAX_CORRECT, hitPool.length, size - 1);
      if (maxK < CONFIG.MIN_CORRECT) continue;

      const k = randInt(CONFIG.MIN_CORRECT, maxK);
      if (missPool.length < size - k) continue;

      return buildQuestion(cond, sample(hitPool, k), sample(missPool, size - k));
    }

    const t = Math.floor((numRange.min + numRange.max) / 2);
    const cond = { text: `<b>${t}</b>より大きい数字`, test: (n) => n > t };
    return buildQuestion(
      cond,
      sample(pool.filter(cond.test), 3),
      sample(pool.filter((n) => !cond.test(n)), size - 3)
    );
  }

  /* ---------------------------------------------------------
     localStorage（使えない環境でもゲームは止めない）
     --------------------------------------------------------- */
  // 使えない場合（プライベートモード・容量超過・無効化など）はメモリで代替
  const memoryStore = {};
  const storage = {
    get(key) {
      try {
        const v = window.localStorage.getItem(key);
        if (v !== null) return v;
      } catch (e) { /* メモリへ */ }
      return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null;
    },
    set(key, value) {
      memoryStore[key] = String(value);
      try { window.localStorage.setItem(key, String(value)); } catch (e) { /* メモリのみ */ }
    },
    getBest(mode) {
      const v = parseInt(this.get(CONFIG.STORAGE_KEYS.BEST_PREFIX + mode), 10);
      return Number.isFinite(v) && v > 0 ? v : 0;
    },
    setBest(mode, v) {
      this.set(CONFIG.STORAGE_KEYS.BEST_PREFIX + mode, v);
    },
    getSoundEnabled() {
      const v = this.get(CONFIG.STORAGE_KEYS.SOUND);
      if (v === null) return CONFIG.SOUND_ENABLED_DEFAULT;
      return v === '1';
    },
    setSoundEnabled(on) {
      this.set(CONFIG.STORAGE_KEYS.SOUND, on ? '1' : '0');
    },
    // MVP版の BEST（60秒）を 60秒モードへ引き継ぐ
    migrateLegacyBest() {
      const key60 = CONFIG.STORAGE_KEYS.BEST_PREFIX + 60;
      if (this.get(key60) !== null) return;
      const legacy = parseInt(this.get(CONFIG.STORAGE_KEYS.LEGACY_BEST), 10);
      if (Number.isFinite(legacy) && legacy > 0) this.set(key60, legacy);
    },
  };

  function vibrate(ms) {
    try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* 未対応は無視 */ }
  }

  /* ---------------------------------------------------------
     効果音（Web Audio API）
     AudioContext は1つだけ作り、最初のユーザー操作で初期化する。
     未対応・失敗時は無音で続行。
     --------------------------------------------------------- */
  function createSound(initialEnabled) {
    const S = CONFIG.SOUND;
    const AC = typeof window !== 'undefined'
      ? (window.AudioContext || window.webkitAudioContext)
      : null;
    let ctx = null;
    let master = null;
    let enabled = initialEnabled;

    function unlock() {
      if (!enabled || !AC) return;
      try {
        if (!ctx) {
          ctx = new AC();
          master = ctx.createGain();
          master.gain.value = S.MASTER_VOLUME;
          master.connect(ctx.destination);
        }
        if (ctx.state !== 'running' && ctx.state !== 'closed' && ctx.resume) {
          const p = ctx.resume();
          if (p && p.catch) p.catch(() => {});
        }
      } catch (e) {
        ctx = null;
      }
    }

    // 短い単音。ノードは使い捨て（Web Audio の標準的な使い方）
    function tone(freq, dur, opts) {
      if (!enabled || !ctx) return;
      const o = opts || {};
      try {
        if (ctx.state !== 'running') unlock();  // 復帰時（iOSのinterrupted等）に再開
        const t = ctx.currentTime + (o.delay || 0);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = o.type || 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t + dur);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(o.vol || 0.4, t + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(gain);
        gain.connect(master);
        osc.start(t);
        osc.stop(t + dur + 0.02);
      } catch (e) { /* 無音で続行 */ }
    }

    const semitone = (base, n) => base * Math.pow(2, n / 12);
    function arpeggio(base, steps, gap, dur, vol) {
      steps.forEach((n, i) => tone(semitone(base, n), dur, { delay: i * gap, vol }));
    }

    return {
      unlock,
      isEnabled: () => enabled,
      setEnabled(on) {
        enabled = on;
        if (on) unlock();
      },
      correct(combo) {
        let semi = 0;
        for (const s of S.COMBO_PITCH_STEPS) if (combo >= s.minCombo) { semi = s.semitones; break; }
        const f = semitone(S.CORRECT_BASE_FREQ, semi);
        tone(f, 0.07, { slideTo: f * 1.2, vol: 0.45 });
      },
      milestone() { arpeggio(1047, [0, 4, 7, 12], 0.05, 0.12, 0.45); },
      miss() { tone(210, 0.12, { slideTo: 150, vol: 0.5 }); },
      warn() { tone(1320, 0.05, { type: 'sine', vol: 0.35 }); },
      countdown(isGo) { tone(isGo ? 1320 : 660, isGo ? 0.16 : 0.08, { type: 'sine', vol: 0.35 }); },
      end() {
        tone(784, 0.14, { vol: 0.45 });
        tone(523, 0.3, { delay: 0.13, vol: 0.45 });
      },
      newBest() { arpeggio(784, [0, 4, 7, 12, 16], 0.07, 0.16, 0.4); },
    };
  }

  /* ---------------------------------------------------------
     ゲーム本体
     --------------------------------------------------------- */
  function createGame() {
    const $ = (id) => document.getElementById(id);
    const el = {
      titleScreen: $('screen-title'),
      gameScreen: $('screen-game'),
      countdown: $('overlay-countdown'),
      countdownNum: $('countdown-num'),
      timeup: $('overlay-timeup'),
      result: $('overlay-result'),
      titleBest: $('title-best'),
      modeButtons: Array.from(document.querySelectorAll('.mode-btn')),
      soundBtn: $('btn-sound'),
      soundLabel: $('sound-label'),
      score: $('hud-score'),
      scoreBox: $('hud-score-box'),
      time: $('hud-time'),
      timeBox: $('hud-time-box'),
      combo: $('hud-combo'),
      comboBox: $('hud-combo-box'),
      multi: $('hud-multi'),
      level: $('level-badge'),
      condition: $('condition-text'),
      remain: $('remain'),
      feedback: $('feedback'),
      grid: $('grid'),
      startBtn: $('btn-start'),
      retryBtn: $('btn-retry'),
      titleBtn: $('btn-title'),
      r: {
        mode: $('r-mode'), play: $('r-play'),
        score: $('r-score'), newBest: $('r-newbest'), bestGap: $('r-bestgap'),
        best: $('r-best'), level: $('r-level'), maxCombo: $('r-maxcombo'),
        correct: $('r-correct'), miss: $('r-miss'), acc: $('r-acc'),
        recent: $('r-recent'), recentMode: $('r-recent-mode'), delta: $('r-delta'),
      },
      version: $('version'),
    };

    storage.migrateLegacyBest();

    const cellButtons = [];
    const sound = createSound(storage.getSoundEnabled());

    // モード別BEST（localStorage不可でもセッション中は保持）
    const bestScores = {};
    MODES.forEach((m) => { bestScores[m] = storage.getBest(m); });

    // 検証用セッションデータ（将来Analyticsへ送る想定。画面表示なし）
    const sessionStats = createAggregate();
    const statsByMode = {};
    MODES.forEach((m) => { statsByMode[m] = createAggregate(); });
    let playHistory = [];

    let selectedMode = CONFIG.DEFAULT_MODE;
    let state = createInitialState();
    let resultShownAt = 0;

    const timers = { tickId: null, timeouts: new Set() };

    function createInitialState() {
      return {
        phase: 'title',   // title | countdown | playing | ended | result
        mode: selectedMode,
        duration: getDuration(selectedMode),
        playNumber: 0,
        isRetry: false,
        score: 0,
        combo: 0,
        maxCombo: 0,
        correct: 0,
        miss: 0,
        level: 1,
        maxLevel: 1,
        bonusCount: 0,
        endTime: 0,
        lastWarnSec: null,
        question: null,
        locked: false,
      };
    }

    function later(fn, ms) {
      const id = setTimeout(() => {
        timers.timeouts.delete(id);
        fn();
      }, ms);
      timers.timeouts.add(id);
    }

    function clearAllTimers() {
      if (timers.tickId !== null) clearInterval(timers.tickId);
      timers.tickId = null;
      timers.timeouts.forEach((id) => clearTimeout(id));
      timers.timeouts.clear();
    }

    function retrigger(node, cls) {
      node.classList.remove(cls);
      void node.offsetWidth;
      node.classList.add(cls);
    }

    const show = (node) => { node.hidden = false; };
    const hide = (node) => { node.hidden = true; };

    /* ---------- グリッド（1回だけ生成） ---------- */
    function buildGrid() {
      const usePointer = 'PointerEvent' in window;
      for (let i = 0; i < CONFIG.GRID_SIZE; i++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cell';
        btn.addEventListener(usePointer ? 'pointerdown' : 'click', (e) => {
          if (usePointer && e.button > 0) return;
          handleTap(i);
        });
        if (usePointer) {
          btn.addEventListener('click', (e) => { if (e.detail === 0) handleTap(i); });
        }
        el.grid.appendChild(btn);
        cellButtons.push(btn);
      }
      el.grid.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /* ---------- タイトル画面 ---------- */
    function renderTitle() {
      el.modeButtons.forEach((b) => {
        b.setAttribute('aria-pressed', String(Number(b.dataset.mode) === selectedMode));
      });
      el.titleBest.textContent = fmt(bestScores[selectedMode]);
      renderSoundButton();
    }

    function renderSoundButton() {
      const on = sound.isEnabled();
      el.soundBtn.setAttribute('aria-pressed', String(on));
      el.soundLabel.textContent = on ? 'ON' : 'OFF';
    }

    /* ---------- 描画 ---------- */
    function renderHud() {
      el.score.textContent = fmt(state.score);
      el.combo.textContent = state.combo;
      const rate = getMultiplier(state.combo);
      el.multi.textContent = '×' + rate.toFixed(1);
      el.multi.classList.toggle('boost', rate > 1);
    }

    function renderTime(ms) {
      const sec = Math.max(0, Math.ceil(ms / 1000));
      el.time.textContent = sec;
      el.timeBox.classList.toggle('warn', sec <= CONFIG.TIME_WARN && sec > CONFIG.TIME_DANGER);
      el.timeBox.classList.toggle('danger', sec <= CONFIG.TIME_DANGER);
      return sec;
    }

    function renderQuestion() {
      const q = state.question;
      el.condition.innerHTML = q.text;
      retrigger(el.condition, 'enter');
      el.level.textContent = 'LV ' + state.level;
      el.remain.textContent = q.remaining;
      q.cells.forEach((cell, i) => {
        const btn = cellButtons[i];
        btn.className = 'cell';
        btn.textContent = cell.value;
        btn.setAttribute('aria-label', String(cell.value));
      });
    }

    function showFeedback(text, type) {
      el.feedback.textContent = text;
      el.feedback.className = 'feedback ' + type;
      retrigger(el.feedback, 'show');
    }

    /* ---------- タイマー ---------- */
    function startTimer() {
      if (timers.tickId !== null) clearInterval(timers.tickId);   // 二重起動防止
      state.endTime = performance.now() + state.duration * 1000;
      timers.tickId = setInterval(tick, CONFIG.TICK_INTERVAL);
      tick();
    }

    function tick() {
      if (state.phase !== 'playing') return;
      const left = state.endTime - performance.now();
      const sec = renderTime(left);
      if (left <= 0) {
        endGame();
        return;
      }
      // 残り5秒から1秒ごとに警告音（同じ秒で二度鳴らさない）
      if (sec <= CONFIG.TIME_DANGER && sec !== state.lastWarnSec) {
        state.lastWarnSec = sec;
        sound.warn();
      }
    }

    /* ---------- ゲーム進行 ---------- */
    function startGame(isRetry) {
      sound.unlock();   // iOS: ユーザー操作内で AudioContext を初期化
      clearAllTimers();

      recordStart(sessionStats, isRetry);
      recordStart(statsByMode[selectedMode], isRetry);

      state = createInitialState();
      state.phase = 'countdown';
      state.isRetry = isRetry;
      state.playNumber = sessionStats.totalPlays;

      hide(el.titleScreen);
      hide(el.result);
      hide(el.timeup);
      show(el.gameScreen);

      state.question = generateQuestion(state.level, null);
      renderQuestion();
      renderHud();
      renderTime(state.duration * 1000);
      el.feedback.className = 'feedback';
      el.grid.classList.add('veiled');

      const seconds = isRetry ? CONFIG.RETRY_COUNTDOWN_DURATION : CONFIG.COUNTDOWN_DURATION;
      runCountdown(getCountdownSteps(seconds), 0);
    }

    function runCountdown(steps, index) {
      if (!steps.length) {
        beginPlay();
        return;
      }
      const isLast = index === steps.length - 1;
      show(el.countdown);
      el.countdownNum.textContent = steps[index];
      el.countdownNum.classList.toggle('go', isLast);
      retrigger(el.countdownNum, 'beat');
      sound.countdown(isLast);

      if (isLast) later(beginPlay, CONFIG.COUNTDOWN_GO_MS);
      else later(() => runCountdown(steps, index + 1), CONFIG.COUNTDOWN_STEP_MS);
    }

    function beginPlay() {
      if (state.phase !== 'countdown') return;
      hide(el.countdown);
      el.grid.classList.remove('veiled');
      state.phase = 'playing';
      startTimer();
    }

    function nextQuestion() {
      const newLevel = getLevel(state.correct);
      const leveledUp = newLevel > state.level;
      state.level = newLevel;
      state.maxLevel = Math.max(state.maxLevel, newLevel);
      state.question = generateQuestion(state.level, state.question.text);
      renderQuestion();
      if (leveledUp) {
        retrigger(el.level, 'up');
        showFeedback('LEVEL UP!', 'level');
      }
    }

    function handleTap(index) {
      if (state.phase !== 'playing' || state.locked) return;
      const q = state.question;
      const cell = q && q.cells[index];
      if (!cell || cell.done) return;   // 正解済みは無反応
      const btn = cellButtons[index];

      if (cell.correct) {
        // 状態更新 → 見た目 → 音 を同じ処理内で即時に行う
        cell.done = true;
        q.remaining -= 1;
        state.correct += 1;
        const prevCombo = state.combo;
        state.combo += 1;
        state.maxCombo = Math.max(state.maxCombo, state.combo);

        const pts = calcCorrectPoints(state.combo);
        const bonus = calcComboBonus(prevCombo, state.combo);
        state.score += pts + bonus;

        btn.classList.add('done');
        retrigger(btn, 'pop');
        el.remain.textContent = q.remaining;
        renderHud();

        if (bonus > 0) {
          state.bonusCount += 1;
          showFeedback(`COMBO BONUS +${bonus}`, 'bonus');
          retrigger(el.comboBox, 'milestone');
          retrigger(el.scoreBox, 'milestone');
          sound.milestone();
        } else {
          showFeedback('+' + pts, 'good');
          sound.correct(state.combo);
        }

        if (q.remaining === 0) {
          state.locked = true;
          later(() => {
            state.locked = false;
            if (state.phase === 'playing') nextQuestion();
          }, CONFIG.QUESTION_TRANSITION_DELAY);
        }
      } else {
        state.miss += 1;
        state.combo = 0;
        state.score = Math.max(0, state.score - CONFIG.MISS_SCORE);
        state.endTime -= CONFIG.MISS_TIME_PENALTY * 1000;

        retrigger(btn, 'miss');
        retrigger(el.timeBox, 'penalty');
        showFeedback(`-${CONFIG.MISS_SCORE}  TIME -${CONFIG.MISS_TIME_PENALTY}`, 'bad');
        sound.miss();
        vibrate(CONFIG.VIBRATE_MS);
        renderHud();
        tick();
      }
    }

    function endGame() {
      if (state.phase !== 'playing') return;
      state.phase = 'ended';
      clearAllTimers();
      renderTime(0);
      sound.end();

      const prevBest = bestScores[state.mode];
      const isNewBest = state.score > prevBest;
      if (isNewBest) {
        bestScores[state.mode] = state.score;
        storage.setBest(state.mode, state.score);
      }

      const record = {
        mode: state.mode,
        score: state.score,
        correct: state.correct,
        miss: state.miss,
        accuracy: calcAccuracyValue(state.correct, state.miss),
        maxCombo: state.maxCombo,
        maxLevel: state.maxLevel,
        playedAt: new Date().toISOString(),
        playNumber: state.playNumber,
        isRetry: state.isRetry,
      };
      playHistory = addHistory(playHistory, record, CONFIG.HISTORY_LIMIT);
      recordResult(sessionStats, record);
      recordResult(statsByMode[state.mode], record);

      show(el.timeup);
      later(() => showResult(isNewBest, prevBest), CONFIG.TIMEUP_DISPLAY_MS);
    }

    function showResult(isNewBest, prevBest) {
      state.phase = 'result';
      hide(el.timeup);

      el.r.mode.textContent = state.mode + ' SEC';
      el.r.play.textContent = state.playNumber;
      el.r.score.textContent = fmt(state.score);
      el.r.best.textContent = fmt(bestScores[state.mode]);
      el.r.level.textContent = state.maxLevel;
      el.r.maxCombo.textContent = state.maxCombo;
      el.r.correct.textContent = state.correct;
      el.r.miss.textContent = state.miss;
      el.r.acc.textContent = formatAccuracy(state.correct, state.miss);

      // NEW BEST の時は「BESTまで」を出さない
      el.r.newBest.hidden = !isNewBest;
      el.r.bestGap.hidden = isNewBest;
      if (isNewBest) {
        retrigger(el.r.newBest, 'pop-in');
        el.r.bestGap.textContent = '';
      } else if (prevBest === 0) {
        el.r.bestGap.textContent = '';
      } else if (state.score === prevBest) {
        el.r.bestGap.textContent = 'BESTタイ！';
      } else {
        el.r.bestGap.textContent = `BESTまで あと ${fmt(prevBest - state.score)}`;
      }

      renderRecent();
      show(el.result);
      resultShownAt = performance.now();
      if (isNewBest) later(() => sound.newBest(), 120);
    }

    // 直近スコア（同じモードのみ。30秒と60秒は比較できないため）
    const recentBars = [];
    function renderRecent() {
      if (!recentBars.length) {
        for (let i = 0; i < CONFIG.RECENT_SCORE_COUNT; i++) {
          const col = document.createElement('div');
          col.className = 'recent-col';
          col.innerHTML = '<div class="recent-track"><div class="recent-bar"></div></div><span class="recent-val"></span>';
          el.r.recent.appendChild(col);
          recentBars.push({
            col, bar: col.querySelector('.recent-bar'), val: col.querySelector('.recent-val'),
          });
        }
      }
      const scores = getRecentScores(playHistory, state.mode, CONFIG.RECENT_SCORE_COUNT);
      const ratios = calcBarRatios(scores);
      const offset = CONFIG.RECENT_SCORE_COUNT - scores.length;   // 右詰めで表示
      recentBars.forEach((b, i) => {
        const k = i - offset;
        const has = k >= 0;
        b.col.classList.toggle('empty', !has);
        b.col.classList.toggle('latest', has && k === scores.length - 1);
        b.bar.style.height = has ? Math.max(4, ratios[k] * 100) + '%' : '0';
        b.val.textContent = has ? fmt(scores[k]) : '';
      });
      el.r.recentMode.textContent = state.mode + ' SEC';
      const prev = scores.length >= 2 ? scores[scores.length - 2] : null;
      const delta = formatDelta(state.score, prev);
      el.r.delta.textContent = delta;
      el.r.delta.className = 'delta' + (delta.startsWith('↑') ? ' up' : delta.startsWith('↓') ? ' down' : '');
    }

    function goTitle() {
      clearAllTimers();
      state = createInitialState();
      hide(el.result);
      hide(el.timeup);
      hide(el.countdown);
      hide(el.gameScreen);
      renderTitle();
      show(el.titleScreen);
    }

    // 結果表示直後の連打で意図せず再開しないようにする
    const resultReady = () =>
      state.phase === 'result' && performance.now() - resultShownAt >= CONFIG.RESULT_INPUT_GUARD_MS;

    /* ---------- 初期化 ---------- */
    // 100dvh 非対応ブラウザ向け：実際の表示高さをCSS変数へ
    function syncAppHeight() {
      document.documentElement.style.setProperty('--app-height', window.innerHeight + 'px');
    }

    function init() {
      buildGrid();
      renderTitle();
      if (el.version) el.version.textContent = 'Ver ' + CONFIG.VERSION;
      syncAppHeight();
      window.addEventListener('resize', syncAppHeight);
      window.addEventListener('orientationchange', syncAppHeight);

      el.modeButtons.forEach((b) => {
        b.addEventListener('click', () => {
          if (state.phase !== 'title') return;
          selectedMode = Number(b.dataset.mode);
          renderTitle();
        });
      });

      el.soundBtn.addEventListener('click', () => {
        const on = !sound.isEnabled();
        sound.setEnabled(on);
        storage.setSoundEnabled(on);
        renderSoundButton();
        if (on) sound.countdown(false);   // ONにした合図
      });

      el.startBtn.addEventListener('click', () => {
        if (state.phase === 'title') startGame(false);
      });
      el.retryBtn.addEventListener('click', () => {
        if (resultReady()) startGame(true);   // モードは selectedMode のまま維持
      });
      el.titleBtn.addEventListener('click', () => {
        if (resultReady()) goTitle();
      });

      document.addEventListener('gesturestart', (e) => e.preventDefault());
    }

    // 検証・将来のAnalytics用（読み取り専用のコピーを返す）
    const inspect = {
      getSessionStats: () => {
        const byMode = {};
        MODES.forEach((m) => { byMode[m] = summarizeAggregate(statsByMode[m]); });
        return { ...summarizeAggregate(sessionStats), byMode, version: CONFIG.VERSION };
      },
      getPlayHistory: () => playHistory.map((h) => ({ ...h })),
    };

    return { init, inspect };
  }

  /* ---------------------------------------------------------
     起動 / テスト用エクスポート
     --------------------------------------------------------- */
  const api = {
    CONFIG, generateQuestion, getLevel, getMultiplier, calcCorrectPoints,
    calcComboBonus, calcAccuracyValue, formatAccuracy, getCountdownSteps, addHistory, getDuration,
    getRecentScores, calcBarRatios, formatDelta,
    createAggregate, recordStart, recordResult, summarizeAggregate,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;

  if (typeof document !== 'undefined') {
    const boot = () => {
      const game = createGame();
      game.init();
      window.NumberHunt = game.inspect;
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  }
})();
