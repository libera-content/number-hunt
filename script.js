/* =========================================================
   NUMBER HUNT Ver.3.0 - script.js
   Vanilla JS / 外部ライブラリなし
   Ver.2.1 の CONFIG構造・問題生成・タイマー・localStorage・
   Web Audio・sessionStats・playHistory・UI構造をベースに、
   FEVER / SPECIAL CHALLENGE / BONUS TARGET / DAILY CHALLENGE /
   RANK / MISSION / 実績 / 演出強化を追加。
   ========================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     設定（数値はすべてここで管理）
     --------------------------------------------------------- */
  const CONFIG = Object.freeze({
    VERSION: '3.0',   // index.html の ?v= と揃える

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
    VIBRATE_MS: 40,                // ミス
    VIBRATE_CORRECT_MS: 10,        // 正解
    VIBRATE_FEVER_PATTERN: [15, 40, 15],

    STORAGE_KEYS: Object.freeze({
      BEST_PREFIX: 'numberHuntBestScore',        // + モードID（例: numberHuntBestScore30）
      LEGACY_BEST: 'numberHuntBestScore',         // MVP版（60秒）のキー
      SOUND: 'numberHuntSoundEnabled',
      DAILY_BEST_PREFIX: 'numberHuntDailyBest_',  // + YYYY-MM-DD
      TUTORIAL_SEEN: 'numberHuntTutorialSeen',
      ACHIEVEMENTS: 'numberHuntAchievements',
      MISSION_STATE: 'numberHuntMissionState',
      MISSION_DATE: 'numberHuntMissionDate',
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
    // LEVEL UP演出：何が追加されたか一瞬で分かる表示
    LEVEL_UP_LABELS: { 2: 'EVEN / ODD', 3: 'MULTIPLES', 4: 'COMBINATION' },

    COMBO_MULTIPLIERS: [
      { minCombo: 20, rate: 2.5 },
      { minCombo: 15, rate: 2.0 },
      { minCombo: 10, rate: 1.5 },
      { minCombo: 5,  rate: 1.2 },
      { minCombo: 0,  rate: 1.0 },
    ],

    /* ---------- Ver.3 追加設定 ---------- */
    FEVER_MAX: 100,
    FEVER_GAIN_CORRECT: 4,
    FEVER_GAIN_COMBO5: 5,
    FEVER_GAIN_COMBO10: 10,
    FEVER_GAIN_SPECIAL: 20,
    FEVER_LOSS_MISS: 10,
    FEVER_DURATION: 5,             // 秒
    FEVER_SCORE_MULTIPLIER: 2,

    SPECIAL_TYPES: ['ONE_TARGET', 'SPEED', 'MEMORY', 'REVERSE'],
    SPECIAL_LABELS: { ONE_TARGET: 'ONE TARGET', SPEED: 'SPEED', MEMORY: 'MEMORY', REVERSE: 'REVERSE' },
    SPECIAL_SCORES: { ONE_TARGET: 500, SPEED: 500, MEMORY: 700, REVERSE: 600 },
    SPECIAL_INTERVAL_MIN: 8,
    SPECIAL_INTERVAL_MAX: 12,
    SPECIAL_INTRO_MS: 420,
    SPECIAL_SPEED_DURATION: 3,     // 秒（本体タイマーとは別管理）
    SPECIAL_MEMORY_SHOW_MS: 1000,
    SPECIAL_MEMORY_MAX_CORRECT: 3,

    BONUS_TARGET_RATE: 0.12,
    BONUS_TARGET_SCORE: 200,

    RANK_THRESHOLDS: [
      { rank: 'BRONZE',   min: 0 },
      { rank: 'SILVER',   min: 2000 },
      { rank: 'GOLD',     min: 4000 },
      { rank: 'PLATINUM', min: 6000 },
      { rank: 'DIAMOND',  min: 8000 },
      { rank: 'MASTER',   min: 10000 },
    ],
    RANK_MODE: 30,                 // ランクは30秒通常モードのみ対象

    DAILY_DURATION: 30,
    TUTORIAL_ENABLED: true,

    MISSIONS: [
      { id: 'combo10', label: '10 COMBO', check: (r) => r.maxCombo >= 10 },
      { id: 'noMiss',  label: 'NO MISS',  check: (r) => r.miss === 0 && r.correct > 0 },
      { id: 'level4',  label: 'LEVEL 4',  check: (r) => r.maxLevel >= 4 },
    ],

    ACHIEVEMENTS: [
      { id: 'FIRST_HUNT', label: 'FIRST HUNT', desc: '初プレイ' },
      { id: 'COMBO_20',   label: 'COMBO 20',   desc: '20コンボ' },
      { id: 'NO_MISS',    label: 'NO MISS',    desc: 'ノーミス完走' },
      { id: 'MASTER',     label: 'MASTER',     desc: 'MASTERランク' },
    ],
  });

  const MODES = Object.keys(CONFIG.GAME_DURATIONS).map(Number);

  /* ---------------------------------------------------------
     ユーティリティ（rng を渡すとDAILY等で決定的に生成できる）
     --------------------------------------------------------- */
  const defaultRng = () => Math.random();
  const randInt = (min, max, rng) => Math.floor((rng || defaultRng)() * (max - min + 1)) + min;

  function shuffle(arr, rng) {
    const r = rng || defaultRng;
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const sample = (arr, n, rng) => shuffle(arr, rng).slice(0, n);
  const range = (min, max) => Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const fmt = (n) => Number(n).toLocaleString('en-US');

  // 決定的PRNG（DAILY CHALLENGE用）。同じseedなら常に同じ数列を返す。
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashSeed(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return h >>> 0;
  }
  function getTodayDateStr(d) {
    d = d || new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function getDailyRng(dateStr) {
    return mulberry32(hashSeed('numberhunt-daily-' + dateStr));
  }

  /* ---------------------------------------------------------
     問題条件の定義（新モードはここに追加する想定）
     --------------------------------------------------------- */
  const CONDITIONS = {
    1: [
      ({ min, max }, rng) => {
        const t = randInt(min + 3, max - 5, rng);
        return { text: `<b>${t}</b>より大きい数字`, test: (n) => n > t };
      },
      ({ min, max }, rng) => {
        const t = randInt(min + 5, max - 3, rng);
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
      ({ min, max }, rng) => {
        const t = randInt(min + 3, max - 8, rng);
        return { text: `<b>奇数</b>かつ<b>${t}以上</b>`, test: (n) => n % 2 === 1 && n >= t };
      },
      ({ min, max }, rng) => {
        const t = randInt(min + 8, max - 3, rng);
        return { text: `<b>偶数</b>かつ<b>${t}以下</b>`, test: (n) => n % 2 === 0 && n <= t };
      },
      ({ min, max }, rng) => {
        const t = randInt(min + 8, max - 3, rng);
        return { text: `<b>奇数</b>かつ<b>${t}以下</b>`, test: (n) => n % 2 === 1 && n <= t };
      },
      ({ min, max }, rng) => {
        const t = randInt(min + 3, max - 8, rng);
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

  function calcCorrectPoints(combo, feverActive) {
    let pts = CONFIG.CORRECT_SCORE * getMultiplier(combo);
    if (feverActive) pts *= CONFIG.FEVER_SCORE_MULTIPLIER;
    return Math.round(pts);
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

  /* ---------- Ver.3: FEVER ---------- */
  function clampFever(v) {
    return Math.max(0, Math.min(CONFIG.FEVER_MAX, v));
  }
  // combo が 5 / 10 にちょうど到達した瞬間だけ加算（1ずつしか増えないため二重加算なし）
  function calcFeverComboGain(prevCombo, nextCombo) {
    let gain = 0;
    if (prevCombo < 5 && nextCombo >= 5) gain += CONFIG.FEVER_GAIN_COMBO5;
    if (prevCombo < 10 && nextCombo >= 10) gain += CONFIG.FEVER_GAIN_COMBO10;
    return gain;
  }

  /* ---------- Ver.3: コンボ節目テキスト（演出専用・加点はしない） ---------- */
  function getComboMilestoneText(prevCombo, nextCombo) {
    const marks = [
      { at: 30, text: '30 COMBO!!!' },
      { at: 20, text: '20 COMBO!!' },
      { at: 10, text: '10 COMBO!' },
      { at: 5,  text: '5 COMBO' },
    ];
    for (const m of marks) if (prevCombo < m.at && nextCombo >= m.at) return m.text;
    return null;
  }

  /* ---------- Ver.3: ランク ---------- */
  function getRank(score, thresholds) {
    thresholds = thresholds || CONFIG.RANK_THRESHOLDS;
    let r = thresholds[0];
    for (const t of thresholds) if (score >= t.min) r = t;
    return r.rank;
  }
  function getRankIndex(rank, thresholds) {
    thresholds = thresholds || CONFIG.RANK_THRESHOLDS;
    return thresholds.findIndex((t) => t.rank === rank);
  }
  // 次のランクまでの必要点。最上位ランクなら null
  function getNextRankGap(score, thresholds) {
    thresholds = thresholds || CONFIG.RANK_THRESHOLDS;
    const next = thresholds.find((t) => t.min > score);
    return next ? next.min - score : null;
  }

  /* ---------- Ver.3: ミッション / 実績（純粋判定関数） ---------- */
  function evaluateMissions(record, missions) {
    return (missions || CONFIG.MISSIONS).map((m) => ({
      id: m.id, label: m.label, cleared: !!m.check(record),
    }));
  }
  function evaluateAchievements(record, ctx, unlocked) {
    const has = (id) => unlocked.indexOf(id) !== -1;
    const newly = [];
    if (!has('FIRST_HUNT')) newly.push('FIRST_HUNT');
    if (!has('COMBO_20') && record.maxCombo >= 20) newly.push('COMBO_20');
    if (!has('NO_MISS') && record.miss === 0 && record.correct > 0) newly.push('NO_MISS');
    if (!has('MASTER') && ctx && ctx.rank === 'MASTER') newly.push('MASTER');
    return newly;
  }

  /* ---------- セッション集計（セッション全体の累積値） ---------- */
  function createAggregate() {
    return {
      totalPlays: 0, retries: 0, titleStarts: 0, completedPlays: 0,
      totalScore: 0, totalCorrect: 0, totalMiss: 0,
      totalAccuracySum: 0, totalMaxComboSum: 0, totalMaxLevelSum: 0,
      feverCount: 0, specialAttempts: 0, specialSuccesses: 0, dailyPlays: 0,
      rankDistribution: {},
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
    agg.feverCount += r.feverCount || 0;
    agg.specialAttempts += r.specialAttempts || 0;
    agg.specialSuccesses += r.specialSuccesses || 0;
    if (r.dailyMode) agg.dailyPlays += 1;
    if (r.rank) agg.rankDistribution[r.rank] = (agg.rankDistribution[r.rank] || 0) + 1;
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
      specialSuccessRate: agg.specialAttempts
        ? Math.round((agg.specialSuccesses / agg.specialAttempts) * 1000) / 1000 : 0,
    };
  }

  /* ---------------------------------------------------------
     問題生成
     正解数kを先に決めて正解候補からk個・不正解候補から9-k個を選ぶ
     --------------------------------------------------------- */
  function pickCondition(level, numRange, rng) {
    let tier = level;
    if (level > 1 && (rng || defaultRng)() < CONFIG.LOWER_LEVEL_MIX_RATE) tier = randInt(1, level - 1, rng);
    const builders = CONDITIONS[tier];
    return builders[randInt(0, builders.length - 1, rng)](numRange, rng);
  }

  function buildQuestion(cond, hits, misses, rng) {
    const cells = shuffle(hits.concat(misses), rng).map((value) => ({
      value,
      correct: cond.test(value),
      done: false,
    }));
    return { text: cond.text, cells, remaining: cells.filter((c) => c.correct).length, special: null };
  }

  // 通常問題の一定確率で正解セルの1つを BONUS TARGET（★）にする（不正解セルには絶対に付けない）
  function maybeTagBonusTarget(question, rng) {
    const r = rng || defaultRng;
    if (r() < CONFIG.BONUS_TARGET_RATE) {
      const correctIdx = question.cells.map((c, i) => (c.correct ? i : -1)).filter((i) => i >= 0);
      if (correctIdx.length) {
        question.cells[correctIdx[randInt(0, correctIdx.length - 1, rng)]].bonusTarget = true;
      }
    }
    return question;
  }

  function generateQuestion(level, prevText, rng) {
    const numRange = { min: CONFIG.NUM_MIN, max: getLevelConfig(level).numMax };
    const pool = range(numRange.min, numRange.max);
    const size = CONFIG.GRID_SIZE;

    for (let i = 0; i < CONFIG.MAX_GENERATE_ATTEMPTS; i++) {
      const cond = pickCondition(level, numRange, rng);
      if (cond.text === prevText) continue;

      const hitPool = pool.filter(cond.test);
      const missPool = pool.filter((n) => !cond.test(n));
      const maxK = Math.min(CONFIG.MAX_CORRECT, hitPool.length, size - 1);
      if (maxK < CONFIG.MIN_CORRECT) continue;

      const k = randInt(CONFIG.MIN_CORRECT, maxK, rng);
      if (missPool.length < size - k) continue;

      return maybeTagBonusTarget(
        buildQuestion(cond, sample(hitPool, k, rng), sample(missPool, size - k, rng), rng), rng
      );
    }

    const t = Math.floor((numRange.min + numRange.max) / 2);
    const cond = { text: `<b>${t}</b>より大きい数字`, test: (n) => n > t };
    return maybeTagBonusTarget(
      buildQuestion(
        cond,
        sample(pool.filter(cond.test), 3, rng),
        sample(pool.filter((n) => !cond.test(n)), size - 3, rng),
        rng
      ), rng
    );
  }

  /* ---------------------------------------------------------
     Ver.3: SPECIAL CHALLENGE 問題生成
     --------------------------------------------------------- */
  function pickSpecialType(rng) {
    const types = CONFIG.SPECIAL_TYPES;
    return types[randInt(0, types.length - 1, rng)];
  }

  // ONE TARGET: 9個の中から1つだけ選ぶ（最大 / 最小）
  function generateOneTargetQuestion(level, prevText, rng) {
    const numRange = { min: CONFIG.NUM_MIN, max: getLevelConfig(level).numMax };
    const pool = range(numRange.min, numRange.max);
    const variants = [
      { text: 'この中で<b>最大</b>の数字', pick: (vals) => Math.max(...vals) },
      { text: 'この中で<b>最小</b>の数字', pick: (vals) => Math.min(...vals) },
    ];
    for (let i = 0; i < CONFIG.MAX_GENERATE_ATTEMPTS; i++) {
      const values = sample(pool, CONFIG.GRID_SIZE, rng);
      const v = variants[randInt(0, variants.length - 1, rng)];
      if (v.text === prevText) continue;
      const target = v.pick(values);
      // 最大/最小が重複していると1つに絞れないため作り直す
      if (values.filter((x) => x === target).length !== 1) continue;
      const cells = shuffle(values, rng).map((value) => ({ value, correct: value === target, done: false }));
      return { text: v.text, cells, remaining: 1, special: 'ONE_TARGET' };
    }
    // フォールバック：重複のない値になるまでユニーク抽選
    const uniquePool = shuffle(pool, rng);
    const values = uniquePool.slice(0, CONFIG.GRID_SIZE);
    const target = Math.max(...values);
    const cells = shuffle(values, rng).map((value) => ({ value, correct: value === target, done: false }));
    return { text: 'この中で<b>最大</b>の数字', cells, remaining: 1, special: 'ONE_TARGET' };
  }

  // SPEED: 通常と同じ複数正解問題。制限時間3秒は本体タイマーとは別管理。
  function generateSpeedQuestion(level, prevText, rng) {
    const numRange = { min: CONFIG.NUM_MIN, max: getLevelConfig(level).numMax };
    const pool = range(numRange.min, numRange.max);
    const size = CONFIG.GRID_SIZE;
    for (let i = 0; i < CONFIG.MAX_GENERATE_ATTEMPTS; i++) {
      const cond = pickCondition(level, numRange, rng);
      if (cond.text === prevText) continue;
      const hitPool = pool.filter(cond.test);
      const missPool = pool.filter((n) => !cond.test(n));
      const maxK = Math.min(CONFIG.MAX_CORRECT, hitPool.length, size - 1);
      if (maxK < CONFIG.MIN_CORRECT) continue;
      const k = randInt(CONFIG.MIN_CORRECT, maxK, rng);
      if (missPool.length < size - k) continue;
      const q = buildQuestion(cond, sample(hitPool, k, rng), sample(missPool, size - k, rng), rng);
      q.special = 'SPEED';
      return q;
    }
    const q = generateQuestion(level, prevText, rng);
    q.special = 'SPEED';
    q.cells.forEach((c) => { delete c.bonusTarget; });
    return q;
  }

  // MEMORY: 1秒だけ数字を見せ、あとは位置だけを頼りにタップする。正解数を絞ってフェアにする。
  function generateMemoryQuestion(level, prevText, rng) {
    const numRange = { min: CONFIG.NUM_MIN, max: getLevelConfig(level).numMax };
    const pool = range(numRange.min, numRange.max);
    const size = CONFIG.GRID_SIZE;
    const memLevel = Math.min(level, 2); // MEMORYは条件を単純寄りにして理不尽さを防ぐ
    for (let i = 0; i < CONFIG.MAX_GENERATE_ATTEMPTS; i++) {
      const cond = pickCondition(memLevel, numRange, rng);
      if (cond.text === prevText) continue;
      const hitPool = pool.filter(cond.test);
      const missPool = pool.filter((n) => !cond.test(n));
      const maxK = Math.min(CONFIG.SPECIAL_MEMORY_MAX_CORRECT, hitPool.length, size - 1);
      if (maxK < 1) continue;
      const k = randInt(1, maxK, rng);
      if (missPool.length < size - k) continue;
      const q = buildQuestion(cond, sample(hitPool, k, rng), sample(missPool, size - k, rng), rng);
      q.special = 'MEMORY';
      return q;
    }
    const q = generateQuestion(level, prevText, rng);
    q.special = 'MEMORY';
    q.cells.forEach((c) => { delete c.bonusTarget; });
    return q;
  }

  // REVERSE: 通常条件を反転し「条件に合わない数字」を全部タップさせる
  function generateReverseQuestion(level, prevText, rng) {
    const numRange = { min: CONFIG.NUM_MIN, max: getLevelConfig(level).numMax };
    const pool = range(numRange.min, numRange.max);
    const size = CONFIG.GRID_SIZE;
    for (let i = 0; i < CONFIG.MAX_GENERATE_ATTEMPTS; i++) {
      const cond = pickCondition(level, numRange, rng);
      if (cond.text === prevText) continue;
      const invertedTest = (n) => !cond.test(n);
      const hitPool = pool.filter(invertedTest);
      const missPool = pool.filter(cond.test);
      const maxK = Math.min(CONFIG.MAX_CORRECT, hitPool.length, size - 1);
      if (maxK < CONFIG.MIN_CORRECT) continue;
      const k = randInt(CONFIG.MIN_CORRECT, maxK, rng);
      if (missPool.length < size - k) continue;
      const q = buildQuestion({ text: cond.text, test: invertedTest }, sample(hitPool, k, rng), sample(missPool, size - k, rng), rng);
      q.special = 'REVERSE';
      q.baseText = cond.text;
      return q;
    }
    const base = generateQuestion(level, prevText, rng);
    const invertedCells = base.cells.map((c) => ({ value: c.value, correct: !c.correct, done: false }));
    return { text: base.text, cells: invertedCells, remaining: invertedCells.filter((c) => c.correct).length, special: 'REVERSE', baseText: base.text };
  }

  function generateSpecialQuestion(type, level, prevText, rng) {
    switch (type) {
      case 'ONE_TARGET': return generateOneTargetQuestion(level, prevText, rng);
      case 'SPEED': return generateSpeedQuestion(level, prevText, rng);
      case 'MEMORY': return generateMemoryQuestion(level, prevText, rng);
      case 'REVERSE': return generateReverseQuestion(level, prevText, rng);
      default: return generateQuestion(level, prevText, rng);
    }
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
    getDailyBest(dateStr) {
      const v = parseInt(this.get(CONFIG.STORAGE_KEYS.DAILY_BEST_PREFIX + dateStr), 10);
      return Number.isFinite(v) && v > 0 ? v : 0;
    },
    setDailyBest(dateStr, v) {
      this.set(CONFIG.STORAGE_KEYS.DAILY_BEST_PREFIX + dateStr, v);
    },
    getSoundEnabled() {
      const v = this.get(CONFIG.STORAGE_KEYS.SOUND);
      if (v === null) return CONFIG.SOUND_ENABLED_DEFAULT;
      return v === '1';
    },
    setSoundEnabled(on) {
      this.set(CONFIG.STORAGE_KEYS.SOUND, on ? '1' : '0');
    },
    isTutorialSeen() {
      return this.get(CONFIG.STORAGE_KEYS.TUTORIAL_SEEN) === '1';
    },
    setTutorialSeen() {
      this.set(CONFIG.STORAGE_KEYS.TUTORIAL_SEEN, '1');
    },
    getAchievements() {
      try { return JSON.parse(this.get(CONFIG.STORAGE_KEYS.ACHIEVEMENTS)) || []; } catch (e) { return []; }
    },
    setAchievements(list) {
      this.set(CONFIG.STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(list));
    },
    loadMissionState(todayStr) {
      const savedDate = this.get(CONFIG.STORAGE_KEYS.MISSION_DATE);
      if (savedDate !== todayStr) {
        const fresh = {};
        CONFIG.MISSIONS.forEach((m) => { fresh[m.id] = false; });
        this.set(CONFIG.STORAGE_KEYS.MISSION_DATE, todayStr);
        this.set(CONFIG.STORAGE_KEYS.MISSION_STATE, JSON.stringify(fresh));
        return fresh;
      }
      try {
        const parsed = JSON.parse(this.get(CONFIG.STORAGE_KEYS.MISSION_STATE));
        return parsed && typeof parsed === 'object' ? parsed : {};
      } catch (e) { return {}; }
    },
    saveMissionState(ms) {
      this.set(CONFIG.STORAGE_KEYS.MISSION_STATE, JSON.stringify(ms));
    },
    // MVP版の BEST（60秒）を 60秒モードへ引き継ぐ
    migrateLegacyBest() {
      const key60 = CONFIG.STORAGE_KEYS.BEST_PREFIX + 60;
      if (this.get(key60) !== null) return;
      const legacy = parseInt(this.get(CONFIG.STORAGE_KEYS.LEGACY_BEST), 10);
      if (Number.isFinite(legacy) && legacy > 0) this.set(key60, legacy);
    },
  };

  function vibrate(pattern) {
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* 未対応は無視 */ }
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
      fever() { arpeggio(660, [0, 3, 7, 10, 12, 15], 0.045, 0.16, 0.4); },
      specialStart() { tone(1046, 0.1, { type: 'square', vol: 0.3 }); tone(1568, 0.12, { delay: 0.09, type: 'square', vol: 0.3 }); },
      specialSuccess() { arpeggio(880, [0, 5, 9, 12], 0.06, 0.14, 0.45); },
      rankUp() { arpeggio(523, [0, 4, 7, 12, 16, 19], 0.08, 0.2, 0.45); },
      missionClear() { arpeggio(988, [0, 5, 9], 0.07, 0.14, 0.4); },
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
      special: $('overlay-special'),
      specialIntroType: $('special-intro-type'),
      timeup: $('overlay-timeup'),
      result: $('overlay-result'),
      titleBest: $('title-best'),
      titleRank: $('title-rank'),
      titleDailyBest: $('title-daily-best'),
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
      specialBadge: $('special-badge'),
      specialBadgeText: $('special-badge-text'),
      condition: $('condition-text'),
      remain: $('remain'),
      feedback: $('feedback'),
      comboMilestone: $('combo-milestone'),
      tutorialHint: $('tutorial-hint'),
      grid: $('grid'),
      scanSweep: $('scan-sweep'),
      scorePopLayer: $('score-pop-layer'),
      feverWrap: $('fever-wrap'),
      feverBar: $('fever-bar'),
      feverTime: $('fever-time'),
      achievementToast: $('achievement-toast'),
      achievementToastText: $('achievement-toast-text'),
      startBtn: $('btn-start'),
      dailyBtn: $('btn-daily'),
      retryBtn: $('btn-retry'),
      titleBtn: $('btn-title'),
      r: {
        mode: $('r-mode'), play: $('r-play'),
        score: $('r-score'), newBest: $('r-newbest'), bestGap: $('r-bestgap'),
        rankRow: $('r-rank-row'), rank: $('r-rank'), rankUp: $('r-rankup'), nextRank: $('r-nextrank'),
        best: $('r-best'), level: $('r-level'), maxCombo: $('r-maxcombo'),
        correct: $('r-correct'), miss: $('r-miss'), acc: $('r-acc'),
        recent: $('r-recent'), recentMode: $('r-recent-mode'), delta: $('r-delta'),
        recentBlock: $('recent-block'),
        dailyBestRow: $('daily-best-row'), dailyBest: $('r-daily-best'),
        missions: $('r-missions'),
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

    let unlockedAchievements = storage.getAchievements();

    let selectedMode = CONFIG.DEFAULT_MODE;
    let state = createInitialState();
    let resultShownAt = 0;

    const timers = { tickId: null, timeouts: new Set() };

    function createInitialState() {
      return {
        phase: 'title',   // title | countdown | special-intro | playing | ended | result
        mode: selectedMode,
        duration: getDuration(selectedMode),
        playNumber: 0,
        isRetry: false,
        dailyMode: false,
        dailyDateStr: null,
        rng: defaultRng,
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
        // Ver.3
        feverGauge: 0,
        feverActive: false,
        feverEndTime: 0,
        feverCount: 0,
        specialActive: false,
        specialType: null,
        specialEndTime: 0,
        specialAttempts: 0,
        specialSuccesses: 0,
        questionsCompleted: 0,
        nextSpecialAt: 0,
        memoryHidden: false,
        tutorialActive: false,
        tutorialHintIndex: -1,
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
      const rank = getRank(bestScores[CONFIG.RANK_MODE] || 0);
      setRankBadge(el.titleRank, rank);
      const todayStr = getTodayDateStr();
      el.titleDailyBest.textContent = 'BEST ' + fmt(storage.getDailyBest(todayStr));
      renderSoundButton();
    }

    function setRankBadge(node, rank) {
      node.textContent = rank;
      node.className = 'rank-badge rank-' + rank.toLowerCase();
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

    function renderFever() {
      const pct = state.feverActive ? 100 : state.feverGauge;
      el.feverBar.style.width = pct + '%';
      el.feverWrap.classList.toggle('active', state.feverActive);
      if (state.feverActive) {
        const left = Math.max(0, Math.ceil((state.feverEndTime - performance.now()) / 1000));
        el.feverTime.textContent = left + 's';
      } else {
        el.feverTime.textContent = '';
      }
    }

    function renderTime(ms) {
      const sec = Math.max(0, Math.ceil(ms / 1000));
      el.time.textContent = sec;
      el.timeBox.classList.toggle('warn', sec <= CONFIG.TIME_WARN && sec > CONFIG.TIME_DANGER);
      el.timeBox.classList.toggle('danger', sec <= CONFIG.TIME_DANGER);
      return sec;