/* =========================================================================
   NIGHTWOOD · 黑林夜行
   A hand-built, dependency-free night forest survival game.
   ========================================================================= */
(() => {
  'use strict';

  const TAU = Math.PI * 2;
  const WORLD_W = 3000;
  const WORLD_H = 7600;
  const START = { x: 1440, y: 7140 };
  const GOAL = { x: 1280, y: 300 };
  const WIN_Y = 352;
  const RAVINE_Y = 3900;
  const RAVINE_HALF = 55;
  const PLAYER_BASE_SPEED = 178;
  const PLAYER_SPRINT_SPEED = 292;
  const KNIFE_RANGE = 76;
  const KNIFE_ARC = 1.02;
  const LEVEL_COUNT = 30;
  const LEVEL_GOAL_START = 1900;
  const CHAPTER_SIZE = 5;

  const CHAPTERS = [
    { name: '黑森林', goal: '北侧峡谷', tag: 'BLACKWOOD', tint: 'rgba(24,54,42,.045)', darkness: 0, marsh: null, extra: [] },
    { name: '蛇沼', goal: '蛇沼彼岸', tag: 'SERPENT MIRE', tint: 'rgba(28,64,48,.08)', darkness: .012, marsh: [5600, 4300], extra: ['snake', 'snake', 'snake'] },
    { name: '石林', goal: '石林尽头', tag: 'STONE MAZE', tint: 'rgba(62,73,64,.07)', darkness: .008, marsh: null, extra: ['boar', 'wolf'] },
    { name: '灰烬林', goal: '灰烬边界', tag: 'ASHEN WOOD', tint: 'rgba(92,52,30,.06)', darkness: .015, marsh: null, extra: ['wolf', 'wolf'] },
    { name: '长夜', goal: '长夜尽头', tag: 'THE LONG NIGHT', tint: 'rgba(10,26,32,.10)', darkness: .03, marsh: null, extra: ['wolf', 'snake', 'boar'] },
    { name: '北坡', goal: '北坡林道', tag: 'NORTH SLOPE', tint: 'rgba(34,50,58,.09)', darkness: .02, marsh: null, extra: ['wolf', 'wolf', 'wolf'] }
  ];

  const WEATHER_TYPES = {
    clear: { rain: 0, snow: 0, fog: .08, wind: .28, ash: 0, storm: 0, tint: 'rgba(38,72,58,.025)', visibility: 1, speed: 1, sense: 1, stamina: 1 },
    mist: { rain: 0, snow: 0, fog: .44, wind: .18, ash: 0, storm: 0, tint: 'rgba(98,124,107,.06)', visibility: .88, speed: 1, sense: .92, stamina: 1 },
    drizzle: { rain: .36, snow: 0, fog: .25, wind: .35, ash: 0, storm: 0, tint: 'rgba(42,76,74,.06)', visibility: .9, speed: .98, sense: .86, stamina: 1.04 },
    fog: { rain: 0, snow: 0, fog: .82, wind: .08, ash: 0, storm: 0, tint: 'rgba(126,142,132,.09)', visibility: .7, speed: .97, sense: .78, stamina: 1 },
    wind: { rain: 0, snow: 0, fog: .16, wind: .92, ash: 0, storm: 0, tint: 'rgba(52,78,70,.04)', visibility: .96, speed: .96, sense: 1, stamina: 1.14 },
    marsh: { rain: .12, snow: 0, fog: .66, wind: .12, ash: 0, storm: 0, tint: 'rgba(35,86,66,.1)', visibility: .74, speed: .94, sense: .8, stamina: 1.04 },
    rain: { rain: .7, snow: 0, fog: .3, wind: .55, ash: 0, storm: 0, tint: 'rgba(38,68,78,.08)', visibility: .82, speed: .94, sense: .78, stamina: 1.08 },
    storm: { rain: .95, snow: 0, fog: .38, wind: .85, ash: 0, storm: .85, tint: 'rgba(34,50,65,.11)', visibility: .72, speed: .9, sense: .66, stamina: 1.12 },
    ash: { rain: 0, snow: 0, fog: .3, wind: .42, ash: .8, storm: 0, tint: 'rgba(103,60,35,.08)', visibility: .78, speed: .95, sense: .86, stamina: 1.04 },
    snow: { rain: 0, snow: .62, fog: .24, wind: .26, ash: 0, storm: 0, tint: 'rgba(114,140,155,.08)', visibility: .84, speed: .92, sense: .8, stamina: 1.03 },
    blizzard: { rain: 0, snow: 1, fog: .46, wind: .9, ash: 0, storm: 0, tint: 'rgba(134,160,174,.12)', visibility: .64, speed: .82, sense: .7, stamina: 1.18 },
    sleet: { rain: .38, snow: .42, fog: .36, wind: .6, ash: 0, storm: 0, tint: 'rgba(98,126,138,.1)', visibility: .74, speed: .88, sense: .76, stamina: 1.1 }
  };
  const WEATHER_NAMES = [
    '晴夜', '薄雾', '细雨', '浓雾', '山风', '蛇沼瘴气', '闷热雨', '蛙鸣雾', '湿冷雾', '雷雨',
    '石尘风', '冷月', '穿林风', '石雾', '石林雷雨', '灰烬风', '余烬雨', '烟霾', '热风', '火星夜',
    '静夜', '寒露', '霜雾', '极暗', '北风', '雪粒', '暴雪', '冰雾', '冻雨', '黎明雪'
  ];
  const WEATHER_TYPE_SEQ = [
    'clear', 'mist', 'drizzle', 'fog', 'wind', 'marsh', 'rain', 'marsh', 'fog', 'storm',
    'wind', 'clear', 'wind', 'fog', 'storm', 'ash', 'rain', 'ash', 'wind', 'ash',
    'clear', 'mist', 'fog', 'clear', 'wind', 'snow', 'blizzard', 'fog', 'sleet', 'snow'
  ];
  const WEATHERS = WEATHER_NAMES.map((name, i) => ({
    name,
    ...WEATHER_TYPES[WEATHER_TYPE_SEQ[i]],
    intensity: .7 + (i % 4) * .1
  }));

  const LEVEL_NAMES = [
    '林缘', '鹿径', '蕨谷', '低语', '雾洼', '枯木坡', '狼渡', '石脊', '暗溪', '断枝林',
    '蛇影', '旧营地', '黑苔', '风坳', '月影', '兽径', '深窟', '倒木谷', '断崖', '雾桥',
    '北坡', '冷杉', '石阵', '灰烬地', '长夜', '林道', '风声', '无灯', '最后一段', '黎明'
  ];
  const LEVEL_SUBTITLES = [
    '天光刚熄，林缘还很安静', '鹿蹄印通向更深的黑暗', '蕨叶擦过裤脚，像有人在跟',
    '低语藏在每一阵风里', '雾贴着地面，路只剩一条线', '枯木横斜，踩上去会响',
    '这里叫狼渡。名字不是白来的', '石脊裸露，脚下没有软土', '水声很近，却看不见溪',
    '断枝像肋骨一样支向天空', '蛇影盘在暗处，别伸手', '有人在这里生过火，又匆匆离开',
    '苔藓吞掉了所有脚印', '风从坳口灌下来，带着腥气', '月亮被树冠切成碎片',
    '兽径上的爪印还是新的', '窟口很深，呼吸声有回音', '倒木叠成一道又一道墙',
    '断崖横在面前，绳索只剩一次机会', '雾从桥下漫上来，看不见底',
    '北坡更冷，野兽也更饿', '冷杉针叶落满肩头', '石阵里的眼睛会跟着你转',
    '灰烬地还留着余温', '长夜最深的一段，连风都停了', '林道在前，但不会轻易放你走',
    '风声里混进了脚步', '灯灭了，只剩耳朵和刀', '最后一段路，别回头', '黎明就在林道尽头'
  ];

  const DEFAULT_MODS = {
    speed: 0, sprint: 0, armor: 0, knife: 0, atkSpeed: 0, staminaCost: 0,
    stamRegen: 0, stamMax: 0, maxHp: 0, bleed: 0, light: 0, detect: 0,
    noise: 0, meds: 0, ropes: 0, shield: 0
  };

  const LEVEL_ITEMS = [
    { name: '强光电池', icon: 'flashlight', desc: '手电照射范围 +18%，更容易看清前路。', mods: { light: .18 } },
    { name: '疾行绑腿', icon: 'foot', desc: '移动速度 +6%，赶路更轻快。', mods: { speed: .06 } },
    { name: '防割护臂', icon: 'shield', desc: '受到野兽伤害 -8%。', mods: { armor: .08 } },
    { name: '磨刀石', icon: 'knife', desc: '猎刀伤害 +12%，更容易逼退野兽。', mods: { knife: .12 } },
    { name: '静音软底鞋', icon: 'foot', desc: '动物的警觉范围 -8%。', mods: { detect: .08 } },
    { name: '急救绷带', icon: 'medkit', desc: '最大生命 +15。', mods: { maxHp: 15 } },
    { name: '止血草药', icon: 'drop', desc: '失血速度 -18%，伤口不再那么致命。', mods: { bleed: .18 } },
    { name: '轻便水壶', icon: 'bolt', desc: '体力恢复速度 +25%。', mods: { stamRegen: .25 } },
    { name: '铜制护符', icon: 'shield', desc: '每关抵挡一次野兽伤害。', mods: { shield: 1 } },
    { name: '远光透镜', icon: 'flashlight', desc: '手电照射范围 +15%。', mods: { light: .15 } },
    { name: '备用电池组', icon: 'flashlight', desc: '手电范围 +10%，警觉范围 -3%。', mods: { light: .10, detect: .03 } },
    { name: '兽骨哨', icon: 'leaf', desc: '动物警觉范围 -10%。', mods: { detect: .10 } },
    { name: '铁皮护胸', icon: 'shield', desc: '受到野兽伤害 -10%。', mods: { armor: .10 } },
    { name: '猎刀配重', icon: 'knife', desc: '挥刀速度 +12%。', mods: { atkSpeed: .12 } },
    { name: '软皮手套', icon: 'leaf', desc: '挥刀体力消耗 -20%。', mods: { staminaCost: .20 } },
    { name: '蛇药', icon: 'drop', desc: '受到伤害 -6%，失血速度 -6%。', mods: { armor: .06, bleed: .06 } },
    { name: '狼牙项链', icon: 'shield', desc: '受到野兽伤害 -8%。', mods: { armor: .08 } },
    { name: '野猪皮甲', icon: 'shield', desc: '受到野兽伤害 -10%。', mods: { armor: .10 } },
    { name: '星光罗盘', icon: 'compass', desc: '手电范围 +10%，动物警觉 -3%。', mods: { light: .10, detect: .03 } },
    { name: '静音斗篷', icon: 'leaf', desc: '奔跑时产生的噪音 -25%。', mods: { noise: .25 } },
    { name: '备用刀鞘', icon: 'knife', desc: '挥刀速度 +10%。', mods: { atkSpeed: .10 } },
    { name: '急救药箱', icon: 'medkit', desc: '每关额外携带 1 支急救药。', mods: { meds: 1 } },
    { name: '护心镜', icon: 'shield', desc: '每关抵挡一次伤害，受到伤害 -4%。', mods: { shield: 1, armor: .04 } },
    { name: '猎手靴', icon: 'foot', desc: '奔跑速度 +8%。', mods: { sprint: .08 } },
    { name: '蜂蜜干粮', icon: 'bolt', desc: '最大体力 +20，体力恢复 +10%。', mods: { stamMax: 20, stamRegen: .10 } },
    { name: '银制刀锋', icon: 'knife', desc: '猎刀伤害 +15%。', mods: { knife: .15 } },
    { name: '夜行者披风', icon: 'eye', desc: '动物警觉 -10%，奔跑噪音 -10%。', mods: { detect: .10, noise: .10 } },
    { name: '强心剂', icon: 'heart', desc: '最大生命 +20。', mods: { maxHp: 20 } },
    { name: '黎明护符', icon: 'shield', desc: '受到伤害 -12%，最大生命 +10。', mods: { armor: .12, maxHp: 10 } },
    { name: '林道徽章', icon: 'torch', desc: '穿越者徽章。移速 +5%，生命 +10，每关抵挡一次伤害。', mods: { speed: .05, maxHp: 10, shield: 1 } }
  ];

  const LEVELS = LEVEL_NAMES.map((name, i) => {
    const chapterIndex = Math.floor(i / CHAPTER_SIZE);
    return {
      num: i + 1,
      name,
      subtitle: LEVEL_SUBTITLES[i],
      chapterIndex,
      chapter: CHAPTERS[chapterIndex],
      goalY: LEVEL_GOAL_START - chapterIndex * 240 - (i % CHAPTER_SIZE) * 40,
      reward: LEVEL_ITEMS[i]
    };
  });

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
  const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  const dist2 = (x1, y1, x2, y2) => (x2 - x1) ** 2 + (y2 - y1) ** 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const choose = (arr) => arr[(Math.random() * arr.length) | 0];
  const smoothstep = (a, b, x) => {
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  function angleDiff(a, b) {
    let d = (a - b + Math.PI) % TAU;
    if (d < 0) d += TAU;
    return d - Math.PI;
  }
  function angleLerp(a, b, t) {
    return a + angleDiff(b, a) * t;
  }
  function pointSegDist2(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) return dist2(px, py, x1, y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / l2;
    t = clamp(t, 0, 1);
    return dist2(px, py, x1 + t * dx, y1 + t * dy);
  }
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function randomSeed() {
    const c = globalThis.crypto;
    if (c && c.getRandomValues) {
      const a = new Uint32Array(1);
      c.getRandomValues(a);
      return a[0] || 123456789;
    }
    return (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
  }
  function formatTime(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  }
  function formatNumber(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // -------------------------------------------------------------------------
  // DOM + canvas
  // -------------------------------------------------------------------------
  const canvas = document.getElementById('world');
  const ctx = canvas.getContext('2d', { alpha: false });
  const lightCanvas = document.createElement('canvas');
  const lctx = lightCanvas.getContext('2d');
  let viewW = 1;
  let viewH = 1;
  let DPR = 1;

  const ui = {
    hud: document.getElementById('hud'),
    menu: document.getElementById('menu'),
    pause: document.getElementById('pause'),
    death: document.getElementById('death'),
    victory: document.getElementById('victory'),
    howModal: document.getElementById('howModal'),
    startBtn: document.getElementById('startBtn'),
    howBtn: document.getElementById('howBtn'),
    howClose: document.getElementById('howClose'),
    howStart: document.getElementById('howStart'),
    pauseBtn: document.getElementById('pauseBtn'),
    resumeBtn: document.getElementById('resumeBtn'),
    pauseRestartBtn: document.getElementById('pauseRestartBtn'),
    pauseMenuBtn: document.getElementById('pauseMenuBtn'),
    retryBtn: document.getElementById('retryBtn'),
    deathMenuBtn: document.getElementById('deathMenuBtn'),
    againBtn: document.getElementById('againBtn'),
    victoryMenuBtn: document.getElementById('victoryMenuBtn'),
    soundBtn: document.getElementById('soundBtn'),
    distance: document.getElementById('distance'),
    levelNum: document.getElementById('levelNum'),
    levelName: document.getElementById('levelName'),
    objectiveText: document.getElementById('objectiveText'),
    progressFill: document.getElementById('progressFill'),
    progressGlow: document.getElementById('progressGlow'),
    compassArrow: document.getElementById('compassArrow'),
    itemCount: document.getElementById('itemCount'),
    inventoryItems: document.getElementById('inventoryItems'),
    hpValue: document.getElementById('hpValue'),
    hpMax: document.getElementById('hpMax'),
    hpFill: document.getElementById('hpFill'),
    staminaFill: document.getElementById('staminaFill'),
    bleedLabel: document.getElementById('bleedLabel'),
    bleedPips: document.getElementById('bleedPips'),
    medCount: document.getElementById('medCount'),
    ropeCount: document.getElementById('ropeCount'),
    lightState: document.getElementById('lightState'),
    prompt: document.getElementById('prompt'),
    promptTitle: document.getElementById('promptTitle'),
    promptSub: document.getElementById('promptSub'),
    toasts: document.getElementById('toasts'),
    sceneTitle: document.getElementById('sceneTitle'),
    sceneEyebrow: document.getElementById('sceneEyebrow'),
    sceneName: document.getElementById('sceneName'),
    sceneSub: document.getElementById('sceneSub'),
    damageFlash: document.getElementById('damageFlash'),
    bleedEdge: document.getElementById('bleedEdge'),
    dangerPulse: document.getElementById('dangerPulse'),
    pauseStats: document.getElementById('pauseStats'),
    deathReason: document.getElementById('deathReason'),
    deathStats: document.getElementById('deathStats'),
    victoryTitle: document.getElementById('victoryTitle'),
    victoryCopy: document.getElementById('victoryCopy'),
    victoryStats: document.getElementById('victoryStats'),
    victoryHint: document.getElementById('victoryHint'),
    rewardCard: document.getElementById('rewardCard'),
    rewardIcon: document.getElementById('rewardIcon'),
    rewardName: document.getElementById('rewardName'),
    rewardDesc: document.getElementById('rewardDesc'),
    rewardCount: document.getElementById('rewardCount'),
    touchStick: document.getElementById('touchStick'),
    stickKnob: document.getElementById('stickKnob'),
    touchMed: document.querySelector('[data-touch="med"]'),
    slots: Array.from(document.querySelectorAll('[data-slot]')),
    touchAttack: document.querySelector('[data-touch="attack"]')
  };

  function resizeCanvas() {
    viewW = Math.max(320, window.innerWidth);
    viewH = Math.max(320, window.innerHeight);
    DPR = Math.min(window.devicePixelRatio || 1, 1.75);
    canvas.width = Math.round(viewW * DPR);
    canvas.height = Math.round(viewH * DPR);
    canvas.style.width = viewW + 'px';
    canvas.style.height = viewH + 'px';
    lightCanvas.width = Math.round(viewW * DPR);
    lightCanvas.height = Math.round(viewH * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    lctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  // -------------------------------------------------------------------------
  // Audio — all sounds synthesized at runtime, no assets
  // -------------------------------------------------------------------------
  class AudioEngine {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.muted = false;
      this.paused = false;
      this.started = false;
      this.danger = 0;
      this.cricketTimer = 2.8;
      this.heartTimer = 1.2;
      this.growlTimer = 3;
      this.lastStep = 0;
      this.sprintAmount = 0;
      this.pantTimer = .8;
      this.rainGain = null;
      this.snowGain = null;
      this.ashGain = null;
    }
    init() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
      } catch (e) {
        return;
      }
      const c = this.ctx;
      this.master = c.createGain();
      this.master.gain.value = 0.72;
      this.master.connect(c.destination);
      this.noiseBuffer = this.makeNoise(3.2);
      this.buildWind();
      this.buildDrone();
      this.started = true;
      this.applyMaster();
    }
    makeNoise(seconds) {
      const c = this.ctx;
      const len = Math.floor(c.sampleRate * seconds);
      const buffer = c.createBuffer(1, len, c.sampleRate);
      const data = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 2.4;
      }
      return buffer;
    }
    buildWind() {
      const c = this.ctx;
      const src = c.createBufferSource();
      src.buffer = this.noiseBuffer;
      src.loop = true;
      const filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 380;
      filter.Q.value = 0.7;
      const gain = c.createGain();
      gain.gain.value = 0.041;
      const lfo = c.createOscillator();
      const lfoGain = c.createGain();
      lfo.frequency.value = 0.075;
      lfoGain.gain.value = 120;
      lfo.connect(lfoGain).connect(filter.frequency);
      src.connect(filter).connect(gain).connect(this.master);
      src.start();
      lfo.start();
      this.windFilter = filter;
      this.windGain = gain;

      // A separate rushing-air layer for sprinting. It is silent until the
      // player actually breaks into a run, then opens up with speed.
      const sprintSrc = c.createBufferSource();
      sprintSrc.buffer = this.noiseBuffer;
      sprintSrc.loop = true;
      const sprintFilter = c.createBiquadFilter();
      sprintFilter.type = 'bandpass';
      sprintFilter.frequency.value = 520;
      sprintFilter.Q.value = .75;
      const sprintGain = c.createGain();
      sprintGain.gain.value = .0001;
      sprintSrc.connect(sprintFilter).connect(sprintGain).connect(this.master);
      sprintSrc.start();
      this.sprintFilter = sprintFilter;
      this.sprintGain = sprintGain;

      const weatherLayer = (type, freq, q, gainValue) => {
        const src = c.createBufferSource();
        src.buffer = this.noiseBuffer;
        src.loop = true;
        const filter = c.createBiquadFilter();
        filter.type = type;
        filter.frequency.value = freq;
        filter.Q.value = q;
        const gain = c.createGain();
        gain.gain.value = .0001;
        src.connect(filter).connect(gain).connect(this.master);
        src.start();
        return { gain, filter, src };
      };
      this.rainLayer = weatherLayer('highpass', 1500, .6, 0);
      this.snowLayer = weatherLayer('lowpass', 340, .7, 0);
      this.ashLayer = weatherLayer('bandpass', 1800, 1.1, 0);
      this.rainGain = this.rainLayer.gain;
      this.snowGain = this.snowLayer.gain;
      this.ashGain = this.ashLayer.gain;
    }
    setWeather(w) {
      if (!this.ctx || !this.rainGain) return;
      const t = this.ctx.currentTime;
      const rain = w ? (w.rain || 0) : 0;
      const snow = w ? (w.snow || 0) : 0;
      const ash = w ? (w.ash || 0) : 0;
      this.rainGain.gain.setTargetAtTime(.0001 + rain * .038, t, 1.4);
      this.snowGain.gain.setTargetAtTime(.0001 + snow * .012, t, 2.0);
      this.ashGain.gain.setTargetAtTime(.0001 + ash * .015, t, 1.8);
      if (this.windGain) {
        const wind = w ? (w.wind || 0) : .3;
        this.windGain.gain.setTargetAtTime(.0001 + wind * .045, t, 1.8);
      }
    }
    thunder(strength = 1) {
      if (!this.ctx) return;
      const v = clamp(strength, .2, 1);
      this.noise(1.8, { gain: .035 * v, freq: 90, toFreq: 38, filter: 'lowpass', delay: .12 });
      this.tone(44, 2.1, { gain: .04 * v, type: 'sine', to: 25, delay: .1 });
      this.noise(.5, { gain: .018 * v, freq: 600, toFreq: 120, filter: 'lowpass', delay: .35 });
    }
    buildDrone() {
      const c = this.ctx;
      const droneGain = c.createGain();
      droneGain.gain.value = 0.018;
      const filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 260;
      const o1 = c.createOscillator();
      const o2 = c.createOscillator();
      o1.type = 'sine';
      o2.type = 'triangle';
      o1.frequency.value = 49;
      o2.frequency.value = 73.5;
      o1.connect(filter);
      o2.connect(filter);
      filter.connect(droneGain).connect(this.master);
      o1.start();
      o2.start();
      const dangerGain = c.createGain();
      dangerGain.gain.value = 0.0001;
      const dangerFilter = c.createBiquadFilter();
      dangerFilter.type = 'lowpass';
      dangerFilter.frequency.value = 520;
      const d1 = c.createOscillator();
      const d2 = c.createOscillator();
      d1.type = 'sawtooth';
      d2.type = 'sine';
      d1.frequency.value = 46.5;
      d2.frequency.value = 93;
      d1.connect(dangerFilter);
      d2.connect(dangerFilter);
      dangerFilter.connect(dangerGain).connect(this.master);
      d1.start();
      d2.start();
      this.dangerGain = dangerGain;
      this.droneGain = droneGain;
    }
    applyMaster() {
      if (!this.ctx || !this.master) return;
      const target = this.muted ? 0.0001 : (this.paused ? 0.18 : 0.72);
      this.master.gain.setTargetAtTime(target, this.ctx.currentTime, 0.12);
    }
    setMuted(v) {
      this.muted = !!v;
      document.body.classList.toggle('is-muted', this.muted);
      this.applyMaster();
    }
    toggleMute() {
      this.setMuted(!this.muted);
      return this.muted;
    }
    setPaused(v) {
      this.paused = !!v;
      this.applyMaster();
    }
    setSprint(v) {
      this.sprintAmount = clamp(v || 0, 0, 1);
      if (!this.ctx || !this.sprintGain) return;
      const t = this.ctx.currentTime;
      this.sprintGain.gain.setTargetAtTime(.0001 + this.sprintAmount * .052, t, .09);
      if (this.sprintFilter) {
        this.sprintFilter.frequency.setTargetAtTime(460 + this.sprintAmount * 980, t, .12);
      }
    }
    sprintWhoosh() {
      this.noise(.46, { gain: .055, freq: 280, toFreq: 1450, filter: 'bandpass', q: 1.1 });
      this.noise(.24, { gain: .026, freq: 1600, toFreq: 260, filter: 'highpass', delay: .07 });
      this.tone(84, .34, { gain: .026, type: 'sine', to: 48 });
    }
    setDanger(v) {
      this.danger = clamp(v, 0, 1);
      if (!this.ctx || !this.dangerGain) return;
      const t = this.ctx.currentTime;
      this.dangerGain.gain.setTargetAtTime(0.0001 + this.danger * 0.035, t, 0.4);
    }
    tone(freq, dur, opts = {}) {
      if (!this.ctx || this.muted) return;
      const c = this.ctx;
      const t = c.currentTime + (opts.delay || 0);
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = opts.type || 'sine';
      osc.frequency.setValueAtTime(freq, t);
      if (opts.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.to), t + dur);
      const peak = opts.gain == null ? 0.03 : opts.gain;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      let node = osc;
      if (opts.filter) {
        const f = c.createBiquadFilter();
        f.type = opts.filter;
        f.frequency.value = opts.cutoff || 800;
        node.connect(f);
        node = f;
      }
      if (opts.pan != null && c.createStereoPanner) {
        const pan = c.createStereoPanner();
        pan.pan.value = clamp(opts.pan, -1, 1);
        node.connect(gain).connect(pan).connect(this.master);
      } else {
        node.connect(gain).connect(this.master);
      }
      osc.start(t);
      osc.stop(t + dur + 0.03);
    }
    noise(dur, opts = {}) {
      if (!this.ctx || this.muted) return;
      const c = this.ctx;
      const t = c.currentTime + (opts.delay || 0);
      const src = c.createBufferSource();
      src.buffer = this.noiseBuffer;
      src.loop = true;
      const filter = c.createBiquadFilter();
      filter.type = opts.filter || 'lowpass';
      filter.frequency.setValueAtTime(opts.freq || 500, t);
      if (opts.toFreq) filter.frequency.exponentialRampToValueAtTime(Math.max(40, opts.toFreq), t + dur);
      filter.Q.value = opts.q || 0.8;
      const gain = c.createGain();
      const peak = opts.gain == null ? 0.035 : opts.gain;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      if (opts.pan != null && c.createStereoPanner) {
        const pan = c.createStereoPanner();
        pan.pan.value = clamp(opts.pan, -1, 1);
        src.connect(filter).connect(gain).connect(pan).connect(this.master);
      } else {
        src.connect(filter).connect(gain).connect(this.master);
      }
      src.start(t, Math.random() * 1.5);
      src.stop(t + dur + 0.03);
    }
    step(sprint) {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      if (now - this.lastStep < 0.075) return;
      this.lastStep = now;
      this.noise(0.085, { gain: sprint ? 0.052 : 0.021, freq: sprint ? 720 : 390, toFreq: 110, filter: 'lowpass' });
      this.tone(sprint ? 64 : 60, 0.09, { gain: sprint ? 0.022 : 0.012, type: 'sine', to: 38 });
      if (sprint) {
        this.noise(0.055, { gain: .018, freq: 2300, toFreq: 620, filter: 'highpass' });
        this.tone(132, .045, { gain: .009, type: 'triangle', to: 74, delay: .016 });
      }
    }
    knife() {
      this.noise(0.15, { gain: 0.055, freq: 2600, toFreq: 380, filter: 'bandpass', q: 0.9 });
      this.tone(880, 0.08, { gain: 0.017, type: 'triangle', to: 260 });
    }
    hitFlesh() {
      this.noise(0.17, { gain: 0.085, freq: 420, toFreq: 90, filter: 'lowpass' });
      this.tone(95, 0.2, { gain: 0.07, type: 'sine', to: 42 });
    }
    hurt() {
      this.noise(0.22, { gain: 0.075, freq: 700, toFreq: 120, filter: 'lowpass' });
      this.tone(130, 0.3, { gain: 0.06, type: 'sawtooth', to: 63, filter: 'lowpass', cutoff: 520 });
    }
    growl(close = false) {
      this.tone(close ? 84 : 68, 0.55, { gain: close ? 0.075 : 0.038, type: 'sawtooth', to: 38, filter: 'lowpass', cutoff: close ? 480 : 320 });
      this.noise(0.5, { gain: close ? 0.028 : 0.013, freq: 240, toFreq: 80, filter: 'lowpass' });
    }
    wolfHowl(pan = 0, vol = 1) {
      const v = clamp(vol, 0, 1);
      // a thin, wavering fundamental with a breathy upper harmonic
      this.tone(196 + Math.random() * 22, 1.55, { gain: .052 * v, type: 'sine', to: 328, filter: 'bandpass', cutoff: 740, pan });
      this.tone(294, 1.2, { gain: .018 * v, type: 'triangle', to: 410, delay: .18, filter: 'bandpass', cutoff: 950, pan });
      this.noise(1.35, { gain: .011 * v, freq: 680, toFreq: 340, filter: 'bandpass', q: 2.2, pan });
    }
    wolfSnarl(pan = 0, vol = 1) {
      const v = clamp(vol, 0, 1);
      this.tone(112, .34, { gain: .055 * v, type: 'sawtooth', to: 62, filter: 'lowpass', cutoff: 430, pan });
      this.noise(.4, { gain: .032 * v, freq: 720, toFreq: 190, filter: 'bandpass', q: 1.6, pan });
      this.tone(188, .19, { gain: .018 * v, type: 'square', to: 118, filter: 'lowpass', cutoff: 540, delay: .16, pan });
    }
    boarGrunt(pan = 0, vol = 1) {
      const v = clamp(vol, 0, 1);
      this.tone(74, .22, { gain: .07 * v, type: 'sawtooth', to: 46, filter: 'lowpass', cutoff: 300, pan });
      this.noise(.24, { gain: .042 * v, freq: 240, toFreq: 90, filter: 'lowpass', pan });
      this.tone(61, .17, { gain: .038 * v, type: 'square', to: 38, filter: 'lowpass', cutoff: 260, delay: .18, pan });
    }
    boarSnort(pan = 0, vol = 1) {
      const v = clamp(vol, 0, 1);
      this.noise(.18, { gain: .05 * v, freq: 680, toFreq: 220, filter: 'bandpass', q: 1.2, pan });
      this.noise(.13, { gain: .032 * v, freq: 420, toFreq: 150, filter: 'lowpass', delay: .16, pan });
    }
    snakeHiss(pan = 0, vol = 1) {
      const v = clamp(vol, 0, 1);
      this.noise(.58, { gain: .028 * v, freq: 5200, toFreq: 2600, filter: 'highpass', pan });
      this.noise(.4, { gain: .011 * v, freq: 3800, toFreq: 2200, filter: 'bandpass', q: 2.4, delay: .12, pan });
    }
    animalAlert(type, pan = 0, vol = 1) {
      if (type === 'wolf') {
        if (Math.random() < .42) this.wolfHowl(pan, vol);
        else this.wolfSnarl(pan, vol);
      } else if (type === 'boar') {
        if (Math.random() < .38) this.boarSnort(pan, vol);
        else this.boarGrunt(pan, vol);
      } else {
        this.snakeHiss(pan, vol);
      }
    }
    animalStep(type, pan = 0, vol = 1) {
      const v = clamp(vol, 0, 1);
      if (type === 'snake') {
        this.noise(.16, { gain: .008 * v, freq: 2800, toFreq: 1600, filter: 'highpass', pan });
        return;
      }
      if (type === 'boar') {
        this.tone(52, .12, { gain: .018 * v, type: 'sine', to: 30, pan });
        this.noise(.12, { gain: .012 * v, freq: 500, toFreq: 140, filter: 'lowpass', pan });
      } else {
        this.tone(68, .08, { gain: .008 * v, type: 'sine', to: 42, pan });
        this.noise(.09, { gain: .01 * v, freq: 1600, toFreq: 500, filter: 'bandpass', pan });
      }
    }
    heal() {
      [392, 523.25, 659.25].forEach((f, i) => this.tone(f, 0.65, { gain: 0.033, delay: i * 0.075, type: 'sine' }));
      this.noise(0.3, { gain: 0.015, freq: 1200, filter: 'bandpass', q: 1.2 });
    }
    bridge() {
      this.noise(0.8, { gain: 0.046, freq: 320, toFreq: 95, filter: 'bandpass', q: 1.5 });
      this.tone(140, 0.65, { gain: 0.035, type: 'sawtooth', to: 72, filter: 'lowpass', cutoff: 480 });
    }
    pickup() {
      this.tone(740, 0.18, { gain: 0.025, type: 'sine' });
      this.tone(988, 0.32, { gain: 0.02, type: 'sine', delay: 0.08 });
    }
    alert() {
      this.tone(220, 0.16, { gain: 0.05, type: 'square', filter: 'lowpass', cutoff: 600 });
      this.tone(165, 0.35, { gain: 0.035, type: 'sine', to: 110, delay: 0.11 });
    }
    victory() {
      [261.63, 329.63, 392, 523.25, 659.25].forEach((f, i) => {
        this.tone(f, 1.8, { gain: 0.044, delay: i * 0.16, type: 'sine' });
      });
      this.noise(2.5, { gain: 0.012, freq: 900, filter: 'lowpass' });
    }
    death() {
      this.tone(92, 2.2, { gain: 0.08, type: 'sawtooth', to: 31, filter: 'lowpass', cutoff: 260 });
      this.noise(2, { gain: 0.03, freq: 280, toFreq: 50, filter: 'lowpass' });
    }
    click() {
      this.noise(0.04, { gain: 0.018, freq: 1800, filter: 'highpass' });
      this.tone(380, 0.055, { gain: 0.013, type: 'square' });
    }
    heartbeat() {
      this.tone(56, 0.13, { gain: 0.055, type: 'sine', to: 38 });
      this.tone(50, 0.17, { gain: 0.04, type: 'sine', to: 34, delay: 0.17 });
    }
    update(dt) {
      if (!this.ctx) return;
      this.cricketTimer -= dt;
      if (this.cricketTimer <= 0) {
        this.cricketTimer = rand(1.6, 4.4);
        const base = rand(2300, 3300);
        for (let i = 0; i < 3; i++) {
          this.tone(base + i * 90, 0.07, { gain: 0.007, delay: i * 0.09, type: 'square', filter: 'highpass', cutoff: 1400 });
        }
      }
      this.heartTimer -= dt;
      if (this.heartTimer <= 0) {
        this.heartTimer = this.danger > 0.65 ? 0.62 : 0.96;
        if (this.danger > 0.25) this.heartbeat();
      }
      this.growlTimer -= dt;
      if (this.growlTimer <= 0 && this.danger > 0.3) {
        this.growlTimer = rand(2.8, 5.8);
        // a far-off animal answer, panned away from the player
        this.animalAlert(Math.random() < .72 ? 'wolf' : 'boar', rand(-.75, .75), .22 + this.danger * .25);
      }
      this.pantTimer -= dt;
      if (this.pantTimer <= 0) {
        this.pantTimer = (G.player && G.player.stamina < 24) ? .72 : 1.25;
        if (G.state === 'playing' && G.player && (G.player.sprintBlend > .3 || G.player.stamina < 24)) {
          this.noise(.32, { gain: .013 + (G.player.sprintBlend || 0) * .012, freq: 620, toFreq: 260, filter: 'bandpass', q: 1.1 });
          this.tone(118, .18, { gain: .005, type: 'sine', to: 78, delay: .09 });
        }
      }
    }
  }

  const audio = new AudioEngine();

  // -------------------------------------------------------------------------
  // World data
  // -------------------------------------------------------------------------
  const TRAIL_CONTROL = [
    { x: 1420, y: 7500 }, { x: 1470, y: 7200 }, { x: 1430, y: 6880 },
    { x: 1290, y: 6580 }, { x: 1190, y: 6280 }, { x: 1290, y: 5960 },
    { x: 1450, y: 5660 }, { x: 1460, y: 5340 }, { x: 1320, y: 5050 },
    { x: 1150, y: 4750 }, { x: 1080, y: 4440 }, { x: 1180, y: 4140 },
    { x: 1350, y: 3820 }, { x: 1280, y: 3500 }, { x: 1130, y: 3180 },
    { x: 1120, y: 2860 }, { x: 1230, y: 2560 }, { x: 1180, y: 2280 },
    { x: 1040, y: 1980 }, { x: 1060, y: 1660 }, { x: 1190, y: 1360 },
    { x: 1360, y: 1050 }, { x: 1400, y: 760 }, { x: 1320, y: 530 },
    { x: 1280, y: 300 }
  ];

  const ANIMAL_TYPES = {
    wolf: {
      name: '夜狼', hp: 34, speed: 194, radius: 16, detect: 350, lose: 1000,
      damage: 10, bleed: 1, reach: 54, color: '#7e8580', eye: '#e6b86e'
    },
    boar: {
      name: '獠牙野猪', hp: 74, speed: 118, radius: 22, detect: 285, lose: 880,
      damage: 16, bleed: 1, reach: 61, color: '#665548', eye: '#e08b53'
    },
    snake: {
      name: '黑蝰蛇', hp: 17, speed: 108, radius: 10, detect: 155, lose: 620,
      damage: 7, bleed: 2, reach: 48, color: '#455044', eye: '#d1b65e'
    }
  };

  const SPAWN_ZONES = [
    { y1: 6550, y2: 5900, types: ['wolf', 'wolf', 'snake'] },
    { y1: 5720, y2: 5040, types: ['wolf', 'boar', 'wolf', 'snake'] },
    { y1: 4920, y2: 4220, types: ['wolf', 'boar', 'snake', 'wolf'] },
    { y1: 3680, y2: 3000, types: ['boar', 'wolf', 'snake', 'wolf'] },
    { y1: 2900, y2: 2220, types: ['wolf', 'wolf', 'boar', 'snake'] },
    { y1: 2100, y2: 1380, types: ['wolf', 'boar', 'snake', 'wolf'] },
    { y1: 1280, y2: 620, types: ['wolf', 'boar', 'snake'] }
  ];

  function buildTrail() {
    const c = TRAIL_CONTROL;
    const out = [];
    for (let i = 0; i < c.length - 1; i++) {
      const p0 = c[Math.max(0, i - 1)];
      const p1 = c[i];
      const p2 = c[i + 1];
      const p3 = c[Math.min(c.length - 1, i + 2)];
      const steps = 16;
      for (let j = 0; j < steps; j++) {
        const t = j / steps;
        const t2 = t * t;
        const t3 = t2 * t;
        const x = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
        const y = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
        out.push({ x, y });
      }
    }
    out.push({ x: c[c.length - 1].x, y: c[c.length - 1].y });
    return out;
  }

  function distToTrailSq(x, y, trail) {
    let best = Infinity;
    for (let i = 0; i < trail.length; i += 2) {
      const p = trail[i];
      const d = dist2(x, y, p.x, p.y);
      if (d < best) best = d;
    }
    return best;
  }

  function trailXAt(trail, y) {
    let best = trail[0];
    let bestD = Math.abs(trail[0].y - y);
    for (let i = 1; i < trail.length; i++) {
      const d = Math.abs(trail[i].y - y);
      if (d < bestD) { bestD = d; best = trail[i]; }
    }
    return best.x;
  }

  function makeGroundTile(seed) {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const g = c.getContext('2d');
    const rng = mulberry32(seed ^ 0x9e3779b9);
    g.fillStyle = '#22372a';
    g.fillRect(0, 0, 512, 512);
    const blobs = [
      'rgba(47, 74, 52, .55)', 'rgba(25, 45, 33, .5)', 'rgba(58, 79, 53, .32)',
      'rgba(18, 35, 26, .55)', 'rgba(76, 91, 55, .16)'
    ];
    for (let i = 0; i < 220; i++) {
      const x = rng() * 512;
      const y = rng() * 512;
      const r = 6 + rng() * 46;
      g.fillStyle = blobs[(rng() * blobs.length) | 0];
      g.beginPath();
      g.ellipse(x, y, r, r * (.35 + rng() * .65), rng() * TAU, 0, TAU);
      g.fill();
    }
    for (let i = 0; i < 420; i++) {
      const x = rng() * 512;
      const y = rng() * 512;
      const l = 1 + rng() * 3.5;
      g.strokeStyle = rng() < .4 ? 'rgba(74, 85, 49, .2)' : 'rgba(48, 67, 43, .22)';
      g.lineWidth = .6 + rng();
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + l * (rng() - .5), y + l);
      g.stroke();
    }
    for (let i = 0; i < 100; i++) {
      const x = rng() * 512;
      const y = rng() * 512;
      g.fillStyle = rng() < .5 ? 'rgba(100, 95, 57, .13)' : 'rgba(36, 57, 37, .2)';
      g.beginPath();
      g.ellipse(x, y, 1 + rng() * 3, .6 + rng() * 1.3, rng() * TAU, 0, TAU);
      g.fill();
    }
    return c;
  }

  function createTree(rng, x, y) {
    const dead = rng() < .055;
    const pine = !dead && rng() < .36;
    const scale = .72 + rng() * .95;
    const tree = {
      x, y, scale,
      type: dead ? 'dead' : (pine ? 'pine' : 'broad'),
      shade: rng(),
      phase: rng() * TAU,
      collider: (7 + scale * 6.5) * .92,
      trunkH: (16 + scale * 19),
      canopyLift: (24 + scale * 24),
      canopyR: (40 + scale * 36),
      clusters: [],
      speckles: [],
      roots: []
    };
    const count = 8 + ((rng() * 5) | 0);
    for (let i = 0; i < count; i++) {
      const a = rng() * TAU;
      const rr = rng() * tree.canopyR * .58;
      tree.clusters.push({
        dx: Math.cos(a) * rr,
        dy: Math.sin(a) * rr * .62 - rng() * 12,
        rx: tree.canopyR * (.42 + rng() * .46),
        ry: tree.canopyR * (.22 + rng() * .25),
        rot: rng() * TAU,
        shade: rng()
      });
    }
    for (let i = 0; i < 14; i++) {
      const a = rng() * TAU;
      const rr = rng() * tree.canopyR * .7;
      tree.speckles.push({
        dx: Math.cos(a) * rr,
        dy: Math.sin(a) * rr * .55 - rng() * 10,
        r: .7 + rng() * 2.1,
        shade: rng()
      });
    }
    const rootCount = 3 + ((rng() * 3) | 0);
    for (let i = 0; i < rootCount; i++) {
      const a = rng() * TAU;
      tree.roots.push({
        a,
        len: 10 + scale * (12 + rng() * 17),
        bend: (rng() - .5) * 8
      });
    }
    return tree;
  }

  function createRock(rng, x, y) {
    const r = 9 + rng() * 20;
    const points = [];
    const n = 6 + ((rng() * 4) | 0);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const rr = r * (.72 + rng() * .38);
      points.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr * .66 });
    }
    return { x, y, r, points, shade: rng(), moss: rng() < .55, mossSpots: [] };
  }

  function collides(world, x, y, r, opts = {}) {
    if (x < 18 + r || x > WORLD_W - 18 - r) return true;
    if (y < 35 + r || y > WORLD_H - 20 - r) return true;
    for (const t of world.trees) {
      if (dist2(x, y, t.x, t.y) < (t.collider + r) ** 2) return true;
    }
    for (const rock of world.rocks) {
      if (dist2(x, y, rock.x, rock.y) < (rock.r * .9 + r) ** 2) return true;
    }
    for (const log of world.logs) {
      if (pointSegDist2(x, y, log.x1, log.y1, log.x2, log.y2) < (log.r + r) ** 2) return true;
    }
    if (!opts.ignoreRavine) {
      const top = RAVINE_Y - RAVINE_HALF;
      const bottom = RAVINE_Y + RAVINE_HALF;
      if (y + r > top && y - r < bottom) {
        if (!world.bridge.secured) return true;
        if (x - r < world.bridge.x - world.bridge.half || x + r > world.bridge.x + world.bridge.half) return true;
      }
    }
    return false;
  }

  function findFreeSpot(world, x, y, r, tries = 28) {
    if (!collides(world, x, y, r)) return { x, y };
    for (let i = 0; i < tries; i++) {
      const a = Math.random() * TAU;
      const d = 30 + Math.random() * (80 + i * 5);
      const nx = clamp(x + Math.cos(a) * d, 60, WORLD_W - 60);
      const ny = clamp(y + Math.sin(a) * d, 80, WORLD_H - 80);
      if (!collides(world, nx, ny, r)) return { x: nx, y: ny };
    }
    return null;
  }

  function generateWorld(seed) {
    const rng = mulberry32(seed);
    const trail = buildTrail();
    const bridgeX = trailXAt(trail, RAVINE_Y);
    const world = {
      seed, trail,
      trees: [], rocks: [], logs: [], ferns: [], tufts: [], bushes: [], fireflies: [],
      animals: [], particles: [], decals: [], effects: [], pickups: [],
      bridge: {
        x: bridgeX, y: RAVINE_Y, half: 82,
        secured: false,
        anchorX: bridgeX + 16,
        anchorY: RAVINE_Y + RAVINE_HALF + 26
      },
      campfire: { x: START.x + 138, y: START.y + 28, phase: rng() * TAU },
      tent: { x: START.x + 238, y: START.y + 8, angle: -.22 },
      cache: null,
      groundPattern: null,
      startSign: { x: trailXAt(trail, 7010) - 78, y: 7010, angle: -.08 },
      bridgeSign: { x: bridgeX - 135, y: RAVINE_Y + RAVINE_HALF + 62 },
      goalSign: { x: GOAL.x + 144, y: 368 },
      goals: {
        x: GOAL.x, y: GOAL.y,
        gateX: trailXAt(trail, 330)
      },
      ravineEdges: [],
      fogSeed: rng() * 9999
    };

    // Ground pattern
    const tile = makeGroundTile(seed);
    world.groundPattern = ctx.createPattern(tile, 'repeat');

    // Trees — each chapter has a different density and silhouette mix.
    const ch = chapterData(G.level);
    const targetTrees = ch.name === '石林' ? 760 : ch.name === '蛇沼' ? 920 : ch.name === '灰烬林' ? 980 : 1040;
    let attempts = 0;
    while (world.trees.length < targetTrees && attempts < 7600) {
      attempts++;
      const x = 55 + rng() * (WORLD_W - 110);
      const y = 150 + rng() * (WORLD_H - 240);
      if (dist2(x, y, START.x, START.y) < 255 ** 2) continue;
      if (dist2(x, y, GOAL.x, GOAL.y) < 350 ** 2) continue;
      if (Math.abs(y - RAVINE_Y) < RAVINE_HALF + 64) continue;
      if (dist2(x, y, world.campfire.x, world.campfire.y) < 240 ** 2) continue;
      if (distToTrailSq(x, y, trail) < 72 ** 2) continue;
      if (world.trees.some(t => dist2(x, y, t.x, t.y) < 25 ** 2)) continue;
      world.trees.push(createTree(rng, x, y));
    }

    // Rocks — the Stone Maze is noticeably denser.
    const targetRocks = ch.name === '石林' ? 280 : 140;
    attempts = 0;
    while (world.rocks.length < targetRocks && attempts < 1500) {
      attempts++;
      const x = 50 + rng() * (WORLD_W - 100);
      const y = 170 + rng() * (WORLD_H - 260);
      if (dist2(x, y, START.x, START.y) < 210 ** 2) continue;
      if (dist2(x, y, GOAL.x, GOAL.y) < 300 ** 2) continue;
      if (Math.abs(y - RAVINE_Y) < RAVINE_HALF + 80) continue;
      if (distToTrailSq(x, y, trail) < 43 ** 2) continue;
      if (collides(world, x, y, 8, { ignoreRavine: true })) continue;
      world.rocks.push(createRock(rng, x, y));
    }

    // Fallen logs
    for (let i = 0; i < 26; i++) {
      for (let k = 0; k < 16; k++) {
        const x = 100 + rng() * (WORLD_W - 200);
        const y = 240 + rng() * (WORLD_H - 500);
        if (dist2(x, y, START.x, START.y) < 240 ** 2) continue;
        if (dist2(x, y, GOAL.x, GOAL.y) < 300 ** 2) continue;
        if (Math.abs(y - RAVINE_Y) < RAVINE_HALF + 100) continue;
        if (distToTrailSq(x, y, trail) < 58 ** 2) continue;
        const angle = rng() * TAU;
        const len = 70 + rng() * 90;
        const log = {
          x, y, angle, length: len, r: 7 + rng() * 5,
          x1: x - Math.cos(angle) * len / 2, y1: y - Math.sin(angle) * len / 2,
          x2: x + Math.cos(angle) * len / 2, y2: y + Math.sin(angle) * len / 2,
          shade: rng(), moss: rng() < .6
        };
        if (collides(world, x, y, log.r + 3, { ignoreRavine: true })) continue;
        world.logs.push(log);
        break;
      }
    }

    // Ferns & ground tufts
    for (let i = 0; i < 1080; i++) {
      const x = 30 + rng() * (WORLD_W - 60);
      const y = 80 + rng() * (WORLD_H - 100);
      if (Math.abs(y - RAVINE_Y) < RAVINE_HALF + 10) continue;
      if (distToTrailSq(x, y, trail) < 32 ** 2) continue;
      world.ferns.push({
        x, y, scale: .55 + rng() * 1.25, angle: rng() * TAU,
        shade: rng(), phase: rng() * TAU
      });
    }
    for (let i = 0; i < 1500; i++) {
      const x = 20 + rng() * (WORLD_W - 40);
      const y = 80 + rng() * (WORLD_H - 100);
      if (Math.abs(y - RAVINE_Y) < RAVINE_HALF + 6) continue;
      world.tufts.push({
        x, y, size: 3 + rng() * 7, angle: rng() * TAU,
        shade: rng(), blades: 2 + ((rng() * 4) | 0)
      });
    }

    // Low broadleaf scrub fills the gaps between trunks
    for (let i = 0; i < 300; i++) {
      const x = 35 + rng() * (WORLD_W - 70);
      const y = 90 + rng() * (WORLD_H - 140);
      if (Math.abs(y - RAVINE_Y) < RAVINE_HALF + 20) continue;
      if (dist2(x, y, START.x, START.y) < 140 ** 2) continue;
      const size = 12 + rng() * 24;
      const leaves = [];
      for (let k = 0; k < 5; k++) {
        leaves.push({
          dx: (rng() - .5) * size * 1.2,
          dy: (rng() - .5) * size * .6,
          rx: size * (.35 + rng() * .45),
          ry: size * (.2 + rng() * .25),
          rot: rng() * TAU,
          shade: rng()
        });
      }
      world.bushes.push({ x, y, size, leaves, shade: rng() });
    }

    // Assign cached undergrowth sprites
    for (const f of world.ferns) {
      f.spriteIndex = Math.floor(rng() * fernSprites.length) % fernSprites.length;
      f.flip = rng() < .5 ? -1 : 1;
    }
    for (const b of world.bushes) {
      b.spriteIndex = Math.floor(rng() * bushSprites.length) % bushSprites.length;
      b.flip = rng() < .5 ? -1 : 1;
    }
    for (const t of world.tufts) {
      t.spriteIndex = Math.floor(rng() * tuftSprites.length) % tuftSprites.length;
      t.flip = rng() < .5 ? -1 : 1;
    }

    // Fireflies: a few more near the camp and along the trail
    for (let i = 0; i < 205; i++) {
      let x, y;
      if (i < 25) {
        x = world.campfire.x + (rng() - .5) * 480;
        y = world.campfire.y + (rng() - .5) * 340;
      } else {
        x = 40 + rng() * (WORLD_W - 80);
        y = 100 + rng() * (WORLD_H - 160);
      }
      world.fireflies.push({
        x, y, phase: rng() * TAU, speed: .16 + rng() * .4,
        radius: 2 + rng() * 9, drift: 8 + rng() * 26
      });
    }

    // Optional cache with an extra emergency dose
    const cacheY = 5480;
    const cacheX = trailXAt(trail, cacheY) + 174;
    world.cache = {
      x: cacheX, y: cacheY, opened: false, radius: 90,
      phase: rng() * TAU
    };

    // Hidden supply pickup
    const pickupY = 4680;
    const pickupSpot = findFreeSpot(world, trailXAt(trail, pickupY) - 236, pickupY, 15);
    if (pickupSpot) {
      world.pickups.push({ type: 'med', x: pickupSpot.x, y: pickupSpot.y, taken: false, phase: rng() * TAU });
    }

    // Precompute ravine edges
    for (let x = -20; x <= WORLD_W + 20; x += 34) {
      world.ravineEdges.push({
        x,
        top: Math.sin(x * .017 + seed * .001) * 7 + Math.sin(x * .051) * 4 + (rng() - .5) * 6,
        bottom: Math.sin(x * .021 + 2.3) * 8 + Math.cos(x * .047) * 4 + (rng() - .5) * 6
      });
    }

    // Assign baked tree variants
    for (const t of world.trees) {
      t.spriteIndex = Math.floor(rng() * treeSprites.length) % treeSprites.length;
      const sp = treeSprites[t.spriteIndex];
      t.spriteScale = clamp(t.scale / (sp ? sp.baseScale : 1.1), .7, 1.38);
      t.spriteFlip = rng() < .5 ? -1 : 1;
    }
    world.trees.sort((a, b) => a.y - b.y);

    // Predators
    for (const zone of SPAWN_ZONES) {
      for (const type of zone.types) {
        let placed = null;
        for (let attempt = 0; attempt < 40; attempt++) {
          const y = zone.y1 - rng() * (zone.y1 - zone.y2);
          const side = rng() < .5 ? -1 : 1;
          const x = clamp(trailXAt(trail, y) + side * (105 + rng() * 470), 90, WORLD_W - 90);
          if (dist2(x, y, START.x, START.y) < 500 ** 2) continue;
          if (dist2(x, y, GOAL.x, GOAL.y) < 320 ** 2) continue;
          if (Math.abs(y - RAVINE_Y) < RAVINE_HALF + 90) continue;
          const spot = findFreeSpot(world, x, y, ANIMAL_TYPES[type].radius + 4, 10);
          if (spot) { placed = spot; break; }
        }
        if (!placed) continue;
        const cfg = ANIMAL_TYPES[type];
        const levelMul = 1 + (G.level - 1) * .018;
        world.animals.push({
          id: world.animals.length + 1,
          type, x: placed.x, y: placed.y, homeX: placed.x, homeY: placed.y,
          hp: cfg.hp * levelMul, maxHp: cfg.hp * levelMul, radius: cfg.radius,
          damage: cfg.damage * (1 + (G.level - 1) * .012),
          angle: rng() * TAU, face: rng() * TAU,
          state: 'idle', stateT: 0, aggro: false, met: false,
          cooldown: rng() * .8, stun: 0, hitFlash: 0, dead: false, deadT: 0,
          wanderAngle: rng() * TAU, wanderT: rng() * 2,
          phase: rng() * TAU, alertT: 0, hitDone: false,
          fleeT: 0, growlCd: 0, chargeAngle: 0,
          legacy: 0
        });
      }
    }

    // Chapter-specific wanderers make each region feel different.
    for (const type of ch.extra) {
      let placed = null;
      for (let attempt = 0; attempt < 50; attempt++) {
        const y = G.levelGoalY + 360 + rng() * Math.max(300, 6200 - G.levelGoalY);
        const side = rng() < .5 ? -1 : 1;
        const x = clamp(trailXAt(trail, y) + side * (110 + rng() * 420), 90, WORLD_W - 90);
        if (Math.abs(y - RAVINE_Y) < RAVINE_HALF + 100) continue;
        const spot = findFreeSpot(world, x, y, ANIMAL_TYPES[type].radius + 4, 10);
        if (spot) { placed = spot; break; }
      }
      if (!placed) continue;
      const cfg = ANIMAL_TYPES[type];
      const levelMul = 1 + (G.level - 1) * .018;
      world.animals.push({
        id: world.animals.length + 1,
        type, x: placed.x, y: placed.y, homeX: placed.x, homeY: placed.y,
        hp: cfg.hp * levelMul, maxHp: cfg.hp * levelMul, radius: cfg.radius,
        damage: cfg.damage * (1 + (G.level - 1) * .012),
        angle: rng() * TAU, face: rng() * TAU,
        state: 'idle', stateT: 0, aggro: false, met: false,
        cooldown: rng() * .8, stun: 0, hitFlash: 0, dead: false, deadT: 0,
        wanderAngle: rng() * TAU, wanderT: rng() * 2,
        phase: rng() * TAU, alertT: 0, hitDone: false,
        fleeT: 0, growlCd: 0, chargeAngle: 0,
        legacy: 0
      });
    }

    return world;
  }

  // -------------------------------------------------------------------------
  // Game state
  // -------------------------------------------------------------------------
  const G = {
    state: 'menu',
    world: null,
    player: null,
    envTime: 0,
    runTime: 0,
    totalTime: 0,
    totalKills: 0,
    level: 1,
    levelStartY: START.y,
    levelGoalY: LEVELS[0].goalY,
    weather: WEATHERS[0],
    weatherTime: 0,
    weatherTimer: 2,
    lightning: 0,
    items: [],
    mods: { ...DEFAULT_MODS },
    ghosts: [],
    lastFrame: 0,
    seed: 0,
    camera: {
      x: 0, y: 0, targetX: 0, targetY: 0,
      shake: 0, shakeX: 0, shakeY: 0, menuX: 0, menuY: 0
    },
    keys: Object.create(null),
    mouse: { x: 0, y: 0, has: false },
    touchMode: false,
    touch: { active: false, dx: 0, dy: 0, pointerId: null, attackHeld: false, stickMag: 0 },
    stats: null,
    flags: null,
    tutorial: [],
    interaction: null,
    promptSignature: '',
    hudT: 0,
    danger: 0,
    endTimeout: null,
    deathSource: 'bleed',
    titleTimeout: null,
    lastAimSource: 'mouse'
  };

  function computeMods() {
    const mods = { ...DEFAULT_MODS };
    for (const item of G.items) {
      if (!item || !item.mods) continue;
      for (const key in item.mods) {
        if (key in mods) mods[key] += item.mods[key];
      }
    }
    mods.armor = clamp(mods.armor, 0, .72);
    mods.bleed = clamp(mods.bleed, 0, .65);
    mods.detect = clamp(mods.detect, 0, .55);
    mods.noise = clamp(mods.noise, 0, .65);
    mods.staminaCost = clamp(mods.staminaCost, 0, .45);
    mods.shield = Math.max(0, Math.round(mods.shield));
    G.mods = mods;
    return mods;
  }

  function levelData(level = G.level) {
    return LEVELS[clamp(level || 1, 1, LEVEL_COUNT) - 1];
  }

  function chapterData(level = G.level) {
    return CHAPTERS[levelData(level).chapterIndex] || CHAPTERS[0];
  }

  function weatherData(level = G.level) {
    return WEATHERS[clamp(level || 1, 1, LEVEL_COUNT) - 1];
  }

  function makePlayer() {
    const m = G.mods || DEFAULT_MODS;
    const maxHp = 100 + m.maxHp;
    const maxStamina = 100 + m.stamMax;
    return {
      x: START.x,
      y: START.y,
      radius: 12,
      hp: maxHp,
      maxHp,
      bleeding: 0,
      stamina: maxStamina,
      maxStamina,
      aim: -Math.PI / 2,
      face: -Math.PI / 2,
      lastMoveAngle: -Math.PI / 2,
      lightOn: true,
      meds: 2 + (m.meds || 0),
      ropes: 1 + (m.ropes || 0),
      shield: m.shield || 0,
      invuln: 0,
      attackCd: 0,
      attackT: 0,
      attackAngle: -Math.PI / 2,
      walk: 0,
      moving: false,
      sprinting: false,
      sprintBlend: 0,
      stepT: 0,
      ghostT: 0,
      dead: false,
      won: false,
      healT: 0,
      hurtT: 0,
      lightFlicker: 0,
      trailing: 0
    };
  }

  function resetWorld(seed, menu = false, level = G.level) {
    if (G.endTimeout) {
      clearTimeout(G.endTimeout);
      G.endTimeout = null;
    }
    G.level = clamp(level || 1, 1, LEVEL_COUNT);
    G.levelStartY = START.y;
    G.levelGoalY = levelData(G.level).goalY;
    G.weather = weatherData(G.level);
    G.weatherTime = 0;
    G.weatherTimer = 2.5 + Math.random() * 4;
    G.lightning = 0;
    computeMods();
    G.seed = seed;
    G.world = generateWorld(seed);
    const goalX = trailXAt(G.world.trail, G.levelGoalY);
    G.world.goals = { x: goalX, y: G.levelGoalY, gateX: goalX };
    G.world.goalSign = { x: goalX + 128, y: G.levelGoalY + 64, angle: -.08 };
    G.player = makePlayer();
    G.runTime = 0;
    G.danger = 0;
    G.interaction = null;
    G.promptSignature = '';
    G.ghosts = [];
    G.flags = {
      firstAggro: false, firstBleed: false, firstKill: false,
      ms1: false, ms2: false, ms3: false, ms4: false, bridgeUsed: false
    };
    G.stats = {
      kills: 0, hits: 0, medsUsed: 0, maxBleed: 0,
      encounterSet: new Set(), startTime: 0, finishedAt: 0
    };
    G.tutorial = [];
    G.touch.attackHeld = false;
    document.documentElement.style.setProperty('--bleed', 0);
    ui.damageFlash.style.opacity = '0';
    ui.dangerPulse.classList.remove('is-danger');
    if (menu) {
      G.state = 'menu';
      G.player.aim = -1.92;
      G.player.face = -1.92;
      const camp = G.world.campfire;
      const camX = clamp(camp.x - viewW * 0.70, 0, Math.max(0, WORLD_W - viewW));
      const camY = clamp(camp.y - viewH * 0.58, 0, Math.max(0, WORLD_H - viewH));
      G.camera.x = camX;
      G.camera.y = camY;
      G.camera.menuX = camX;
      G.camera.menuY = camY;
      G.camera.targetX = camX;
      G.camera.targetY = camY;
    } else {
      G.state = 'playing';
      const tx = clamp(G.player.x - viewW / 2, 0, Math.max(0, WORLD_W - viewW));
      const ty = clamp(G.player.y - viewH / 2, 0, Math.max(0, WORLD_H - viewH));
      G.camera.x = tx;
      G.camera.y = ty;
      G.camera.targetX = tx;
      G.camera.targetY = ty;
      G.camera.shake = 0;
      G.stats.startTime = performance.now();
    }
    updateHUD(true);
  }

  function progress() {
    if (!G.player) return 0;
    return clamp((G.levelStartY - G.player.y) / Math.max(1, G.levelStartY - G.levelGoalY), 0, 1);
  }

  function currentDistance() {
    if (!G.player) return 1234;
    return Math.max(0, (G.player.y - G.levelGoalY) / 5.5);
  }

  // -------------------------------------------------------------------------
  // Toasts, screens, and run flow
  // -------------------------------------------------------------------------
  function showToast(title, text, icon = 'leaf', kind = '', duration = 4300) {
    if (!ui.toasts) return;
    if (G.touchMode) ui.toasts.innerHTML = '';
    while (ui.toasts.children.length >= 3) ui.toasts.firstElementChild.remove();
    const el = document.createElement('div');
    el.className = 'toast ' + kind;
    el.innerHTML = `<span class="toast-icon"><svg><use href="#i-${icon}"/></svg></span><div class="toast-copy"><b>${title}</b><span>${text}</span></div>`;
    ui.toasts.appendChild(el);
    setTimeout(() => {
      if (!el.isConnected) return;
      el.classList.add('is-out');
      setTimeout(() => el.remove(), 420);
    }, duration);
  }

  function showSceneTitle() {
    if (G.titleTimeout) clearTimeout(G.titleTimeout);
    const lv = levelData();
    if (ui.sceneEyebrow) ui.sceneEyebrow.textContent = `第 ${lv.num} 关 / 30 · ${lv.chapter.name} · ${G.weather.name}`;
    if (ui.sceneName) ui.sceneName.textContent = lv.name.length >= 4 ? lv.name : lv.name.split('').join(' ');
    if (ui.sceneSub) ui.sceneSub.textContent = lv.subtitle;
    ui.sceneTitle.classList.remove('is-visible');
    void ui.sceneTitle.offsetWidth;
    ui.sceneTitle.classList.add('is-visible');
    G.titleTimeout = setTimeout(() => {
      ui.sceneTitle.classList.remove('is-visible');
    }, 5200);
  }

  function renderInventory(newItem = null) {
    if (!ui.inventoryItems) return;
    const total = G.items.length;
    if (ui.itemCount) ui.itemCount.textContent = String(total);
    if (!total) {
      ui.inventoryItems.innerHTML = '<span class="inventory-empty">尚未获得物品</span>';
      return;
    }
    const recent = G.items.slice(-8);
    ui.inventoryItems.innerHTML = recent.map((item) => {
      const fresh = newItem && item === newItem ? ' is-new' : '';
      return `<span class="item-chip${fresh}" title="${item.name}：${item.desc}"><svg><use href="#i-${item.icon}"/></svg>${item.name}</span>`;
    }).join('');
  }

  function startLevel(level, newRun = false) {
    if (G.endTimeout) { clearTimeout(G.endTimeout); G.endTimeout = null; }
    hideAllScreens();
    G.level = clamp(level || 1, 1, LEVEL_COUNT);
    computeMods();
    resetWorld(randomSeed(), false, G.level);
    document.body.classList.add('is-playing');
    document.body.classList.remove('is-dead-screen');
    ui.hud.classList.remove('is-hidden');
    ui.menu.classList.add('is-hidden');
    ui.pause.classList.add('is-hidden');
    ui.death.classList.add('is-hidden');
    ui.victory.classList.add('is-hidden');
    ui.victory.classList.remove('is-final');
    const victoryCard = ui.victory.querySelector('.end-card');
    if (victoryCard) victoryCard.classList.remove('is-final');
    ui.howModal.classList.add('is-hidden');
    ui.toasts.innerHTML = '';
    audio.init();
    audio.setPaused(false);
    audio.setMuted(audio.muted);
    audio.setDanger(0);
    audio.setSprint(0);
    audio.setWeather(G.weather);
    audio.click();
    if (document.activeElement && typeof document.activeElement.blur === 'function') document.activeElement.blur();
    if (newRun) {
      G.tutorial = G.touchMode ? [
        { at: 6.2, title: '向北，别停', text: '推动左侧摇杆移动，推到底会奔跑。沿小径向北。', icon: 'foot', kind: '' },
        { at: 14, title: '光柱之外', text: '靠近威胁时点按右下猎刀。手电照得越远，也越容易被盯上。', icon: 'eye', kind: '' },
        { at: 27, title: '伤口与药', text: '被咬伤后会持续失血。点按药箱按钮立即止血。', icon: 'medkit', kind: '' }
      ] : [
        { at: 6.2, title: '向北，别停', text: 'WASD 移动，按住 Shift 奔跑。小径会带你穿过森林。', icon: 'foot', kind: '' },
        { at: 14, title: '光柱之外', text: '鼠标瞄准，左键挥刀。手电照得越远，也越容易被盯上。', icon: 'eye', kind: '' },
        { at: 27, title: '伤口与药', text: '被咬伤后会持续失血。按 2 使用急救药物，先止血再赶路。', icon: 'medkit', kind: '' }
      ];
    } else {
      G.tutorial = [];
    }
    renderInventory();
    showSceneTitle();
    updateHUD(true);
    updatePrompt();
    const lv = levelData();
    showToast(`第 ${lv.num} 关 · ${lv.name}`, lv.subtitle, 'compass', '', 3800);
  }

  function startRun() {
    G.level = 1;
    G.items = [];
    G.totalTime = 0;
    G.totalKills = 0;
    computeMods();
    startLevel(1, true);
  }

  function retryLevel() {
    startLevel(G.level, false);
  }

  function advanceLevel() {
    if (G.state !== 'won') return;
    if (G.level < LEVEL_COUNT) startLevel(G.level + 1, false);
    else startRun();
  }

  function hideAllScreens() {
    ui.howModal.classList.add('is-hidden');
    ui.pause.classList.add('is-hidden');
    ui.death.classList.add('is-hidden');
    ui.victory.classList.add('is-hidden');
  }

  function goToMenu() {
    if (G.endTimeout) { clearTimeout(G.endTimeout); G.endTimeout = null; }
    hideAllScreens();
    ui.menu.classList.remove('is-hidden');
    ui.hud.classList.add('is-hidden');
    ui.toasts.innerHTML = '';
    ui.prompt.classList.remove('is-visible');
    document.body.classList.remove('is-playing', 'is-dead-screen');
    ui.damageFlash.style.opacity = '0';
    ui.dangerPulse.classList.remove('is-danger');
    G.items = [];
    G.level = 1;
    G.totalTime = 0;
    G.totalKills = 0;
    computeMods();
    resetWorld(randomSeed(), true, 1);
    renderInventory();
    audio.setPaused(true);
    audio.setSprint(0);
    audio.setWeather(null);
    G.state = 'menu';
  }

  function pauseGame() {
    if (G.state !== 'playing') return;
    G.state = 'paused';
    const lv = levelData();
    ui.pauseStats.innerHTML = `<span>第 <b>${lv.num}</b> / 30 关</span><span>本关进度 <b>${Math.round(progress() * 100)}%</b></span><span>物品 <b>${G.items.length}</b> 件</span>`;
    ui.pause.classList.remove('is-hidden');
    ui.prompt.classList.remove('is-visible');
    G.touch.attackHeld = false;
    audio.setSprint(0);
    audio.setPaused(true);
    audio.click();
    setTimeout(() => ui.resumeBtn.focus(), 60);
  }

  function resumeGame() {
    if (G.state !== 'paused') return;
    G.state = 'playing';
    ui.pause.classList.add('is-hidden');
    audio.setPaused(false);
    audio.click();
    if (document.activeElement && typeof document.activeElement.blur === 'function') document.activeElement.blur();
    updatePrompt();
  }

  function statHTML(label, value, unit = '') {
    return `<div class="stat"><span>${label}</span><b>${value}${unit ? `<small>${unit}</small>` : ''}</b></div>`;
  }

  function deathReasonText(source) {
    if (source === 'wolf') return '狼群的最后一次扑咬扯开了伤口。你跪倒在落叶间，血慢慢冷下来。';
    if (source === 'boar') return '獠牙撞碎了最后一点力气。黑暗里只剩粗重的喘息，然后连喘息也停了。';
    if (source === 'snake') return '毒液顺着血液蔓延。你听见自己的心跳越来越慢，直到森林把它盖住。';
    return '伤口一直没能止住。血在落叶间洇开，森林重新安静下来。';
  }

  function showDeathScreen() {
    if (G.state !== 'dead') return;
    document.body.classList.remove('is-playing');
    document.body.classList.add('is-dead-screen');
    ui.hud.classList.add('is-hidden');
    ui.prompt.classList.remove('is-visible');
    const lv = levelData();
    ui.deathReason.textContent = deathReasonText(G.deathSource);
    ui.deathStats.innerHTML =
      statHTML('关卡', `${lv.num} / 30`) +
      statHTML('本关用时', formatTime(G.runTime)) +
      statHTML('被咬伤', G.stats.hits, '次');
    const retryText = ui.retryBtn.querySelector('span');
    if (retryText) retryText.textContent = `重试第 ${lv.num} 关`;
    ui.death.classList.remove('is-hidden');
    setTimeout(() => ui.retryBtn.focus(), 80);
  }

  function showVictoryScreen() {
    if (G.state !== 'won') return;
    document.body.classList.remove('is-playing');
    ui.hud.classList.add('is-hidden');
    ui.prompt.classList.remove('is-visible');
    const lv = levelData();
    const item = lv.reward;
    const final = G.level >= LEVEL_COUNT;
    ui.victory.classList.toggle('is-final', final);
    const victoryCard = ui.victory.querySelector('.end-card');
    if (victoryCard) victoryCard.classList.toggle('is-final', final);
    ui.victoryTitle.textContent = final ? '林道尽头 · 黎明' : `第 ${lv.num} 关 · 已穿越`;
    ui.victoryCopy.textContent = final
      ? '三十段林路都留在了身后。晨雾从林道尽头漫过来，你把最后一盏灯留在界碑上，走了出去。'
      : G.player.meds > 0
        ? `你穿过${lv.chapter.name}，抵达${lv.chapter.goal}。口袋里的药还剩着，身后的树影很深，但再没有东西跟上来。`
        : `你穿过${lv.chapter.name}，抵达${lv.chapter.goal}。药已经用尽，但这一次，森林没能留下你。`;
    if (ui.rewardCard) ui.rewardCard.style.display = '';
    if (ui.rewardIcon) ui.rewardIcon.setAttribute('href', `#i-${item.icon}`);
    if (ui.rewardName) ui.rewardName.textContent = item.name;
    if (ui.rewardDesc) ui.rewardDesc.textContent = item.desc;
    if (ui.rewardCount) ui.rewardCount.textContent = final ? '徽章' : '+1';
    ui.victoryStats.innerHTML = final
      ? statHTML('总用时', formatTime(G.totalTime)) +
        statHTML('击退野兽', G.totalKills, '只') +
        statHTML('随身物品', G.items.length, '件')
      : statHTML('本关用时', formatTime(G.runTime)) +
        statHTML('击退野兽', G.stats.kills, '只') +
        statHTML('随身物品', G.items.length, '件');
    if (ui.victoryHint) ui.victoryHint.textContent = final ? '30 / 30 · 你走完了整片黑森林' : `下一关：第 ${lv.num + 1} 关 · ${LEVELS[lv.num].name}`;
    const nextText = ui.againBtn.querySelector('span');
    if (nextText) nextText.textContent = final ? '重新穿越 30 关' : `进入第 ${lv.num + 1} 关`;
    ui.victory.classList.remove('is-hidden');
    setTimeout(() => ui.againBtn.focus(), 80);
  }

  function die(source) {
    if (G.state !== 'playing') return;
    G.deathSource = source || 'bleed';
    G.player.dead = true;
    G.player.hp = 0;
    G.state = 'dead';
    G.stats.finishedAt = performance.now();
    G.camera.shake = 14;
    ui.damageFlash.style.opacity = '.85';
    ui.bleedEdge.style.opacity = '.9';
    audio.death();
    audio.setDanger(0);
    audio.setSprint(0);
    G.touch.attackHeld = false;
    ui.prompt.classList.remove('is-visible');
    if (G.endTimeout) clearTimeout(G.endTimeout);
    G.endTimeout = setTimeout(showDeathScreen, 950);
  }

  function winGame() {
    if (G.state !== 'playing') return;
    G.state = 'won';
    G.player.won = true;
    G.stats.finishedAt = performance.now();
    G.touch.attackHeld = false;
    G.totalTime += G.runTime;
    G.totalKills += G.stats.kills;
    const reward = levelData().reward;
    if (!G.items.includes(reward)) G.items.push(reward);
    computeMods();
    renderInventory(reward);
    audio.victory();
    audio.setDanger(0);
    audio.setSprint(0);
    ui.prompt.classList.remove('is-visible');
    if (G.endTimeout) clearTimeout(G.endTimeout);
    G.endTimeout = setTimeout(showVictoryScreen, 1100);
  }

  // -------------------------------------------------------------------------
  // Local player actions
  // -------------------------------------------------------------------------
  function toggleLight() {
    if (G.state !== 'playing' || !G.player) return;
    G.player.lightOn = !G.player.lightOn;
    G.player.lightFlicker = .18;
    audio.click();
    if (!G.player.lightOn && !G.flags?.lightTipShown) {
      G.flags.lightTipShown = true;
      showToast('熄灯', '黑暗会藏住你，也会藏住它们。循着脚步声走。', 'eye', '', 3400);
    }
  }

  function useMed() {
    if (G.state !== 'playing' || !G.player || G.player.dead) return;
    const p = G.player;
    if (p.meds <= 0) {
      showToast('药盒空了', '急救药物已经用完。别再让自己受伤。', 'medkit', 'is-danger');
      audio.click();
      return;
    }
    if (p.hp >= 99.4 && p.bleeding === 0) {
      showToast('现在不需要用药', '把药留给真正流血的时候。', 'medkit', '', 2600);
      audio.click();
      return;
    }
    p.meds--;
    p.bleeding = 0;
    p.hp = Math.min(p.maxHp, p.hp + 40);
    p.healT = 1.5;
    G.stats.medsUsed++;
    G.stats.maxBleed = Math.max(G.stats.maxBleed, p.bleeding);
    audio.heal();
    for (let i = 0; i < 22; i++) {
      const a = Math.random() * TAU;
      const sp = 20 + Math.random() * 55;
      G.world.particles.push({
        type: 'heal', x: p.x + rand(-5, 5), y: p.y + rand(-5, 5),
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20,
        r: 1.2 + Math.random() * 2.2, life: .7 + Math.random() * .6,
        maxLife: 1.3, color: '#aac98d'
      });
    }
    showToast('伤口已包扎', '失血止住了，生命恢复 40 点。', 'medkit', 'is-good');
    updateHUD(true);
  }

  function useRope() {
    if (G.state !== 'playing' || !G.player) return;
    const p = G.player;
    const b = G.world.bridge;
    if (b.secured) {
      showToast('绳索已经固定', '桥就在那儿。稳一点，别往下看。', 'rope', '', 2600);
      return;
    }
    const near = dist(p.x, p.y, b.anchorX, b.anchorY) < 215;
    if (!near) {
      showToast('这里没有固定点', '断崖南侧亮着一盏旧灯。到那儿再使用绳索。', 'rope', '', 3600);
      return;
    }
    if (p.ropes <= 0) {
      showToast('没有绳索', '你翻遍了背包，什么也没找到。', 'rope', 'is-danger');
      return;
    }
    p.ropes--;
    b.secured = true;
    G.flags.bridgeUsed = true;
    audio.bridge();
    G.camera.shake = 4;
    for (let i = 0; i < 30; i++) {
      G.world.particles.push({
        type: 'dust', x: b.anchorX + rand(-70, 70), y: b.y + rand(-10, 24),
        vx: rand(-28, 28), vy: rand(-26, 2),
        r: 1 + Math.random() * 2.4, life: .8 + Math.random() * .9,
        maxLife: 1.7, color: '#aca27c'
      });
    }
    showToast('渡桥固定', '绳索绷紧了。穿过断崖，别停。', 'rope', 'is-good');
    updateHUD(true);
    updatePrompt();
  }

  function attack() {
    if (G.state !== 'playing' || !G.player || G.player.dead) return;
    const p = G.player;
    if (p.attackCd > 0) return;
    if (p.stamina < 9) {
      showToast('力气不够', '停下来喘口气，再挥刀。', 'bolt', 'is-danger', 2300);
      audio.click();
      return;
    }
    if (G.touchMode) {
      const target = nearestEnemy(150, false);
      if (target) p.aim = Math.atan2(target.y - p.y, target.x - p.x);
    }
    p.attackCd = .4 / (1 + G.mods.atkSpeed);
    p.attackT = .23;
    p.attackAngle = p.aim;
    p.stamina = Math.max(0, p.stamina - 10 * (1 - G.mods.staminaCost));
    audio.knife();
    let hit = false;
    for (const a of G.world.animals) {
      if (a.dead) continue;
      const d = dist(p.x, p.y, a.x, a.y);
      if (d > KNIFE_RANGE + a.radius) continue;
      const to = Math.atan2(a.y - p.y, a.x - p.x);
      if (Math.abs(angleDiff(to, p.aim)) > KNIFE_ARC) continue;
      damageAnimal(a, 23 * (1 + G.mods.knife), p.x, p.y, p.aim);
      hit = true;
    }
    G.world.effects.push({
      type: 'slash', x: p.x, y: p.y, angle: p.aim, t: 0, life: .22, hit
    });
    if (hit) {
      G.camera.shake = Math.max(G.camera.shake, 3.2);
      p.stamina = Math.min(p.maxStamina, p.stamina + 2);
    }
  }

  function nearestEnemy(maxDist, onlyAggro) {
    if (!G.world) return null;
    let best = null;
    let bestD = maxDist * maxDist;
    for (const a of G.world.animals) {
      if (a.dead) continue;
      if (onlyAggro && !a.aggro) continue;
      const d = dist2(G.player.x, G.player.y, a.x, a.y);
      if (d < bestD) { bestD = d; best = a; }
    }
    return best;
  }

  function interact() {
    if (G.state !== 'playing') return;
    const it = G.interaction;
    if (!it) {
      showToast('没什么可做的', '沿小径继续向北。', 'compass', '', 1600);
      return;
    }
    if (it.type === 'bridge') useRope();
    else if (it.type === 'cache') openCache();
  }

  function openCache() {
    const c = G.world.cache;
    if (!c || c.opened) return;
    c.opened = true;
    G.player.meds++;
    audio.pickup();
    for (let i = 0; i < 18; i++) {
      G.world.particles.push({
        type: 'leaf', x: c.x + rand(-12, 12), y: c.y + rand(-10, 10),
        vx: rand(-35, 35), vy: rand(-45, -10),
        r: 1 + Math.random() * 2.5, life: .7 + Math.random() * .8,
        maxLife: 1.5, color: '#6f8055'
      });
    }
    showToast('补给：急救药物 +1', '藤蔓下面压着一只旧药盒。有人比你更早来过这里。', 'medkit', 'is-good');
    updateHUD(true);
    updatePrompt();
  }

  function damageAnimal(a, amount, fromX, fromY, angle) {
    a.hp -= amount;
    a.hitFlash = .18;
    a.stun = Math.max(a.stun, .26);
    a.aggro = true;
    if (!a.met) markMet(a);
    const away = Math.atan2(a.y - fromY, a.x - fromX);
    const nx = a.x + Math.cos(away) * 20;
    const ny = a.y + Math.sin(away) * 20;
    if (!collides(G.world, nx, ny, a.radius)) { a.x = nx; a.y = ny; }
    spawnBlood(a.x, a.y, away, 10);
    audio.hitFlesh();
    if (a.hp <= 0) killAnimal(a);
    else if ((a.type === 'wolf' || a.type === 'snake') && a.hp < a.maxHp * .35) {
      a.state = 'flee';
      a.fleeT = 4.2;
      a.aggro = false;
    }
  }

  function killAnimal(a) {
    if (a.dead) return;
    a.dead = true;
    a.deadT = 0;
    a.state = 'dead';
    G.stats.kills++;
    spawnBlood(a.x, a.y, Math.random() * TAU, 22);
    for (let i = 0; i < 5; i++) {
      G.world.decals.push({
        x: a.x + rand(-22, 22), y: a.y + rand(-14, 14),
        r: rand(4, 13), rot: rand(0, TAU), alpha: rand(.15, .35)
      });
    }
    while (G.world.decals.length > 90) G.world.decals.shift();
    audio.growl(true);
    if (!G.flags.firstKill) {
      G.flags.firstKill = true;
      showToast('它不动了', '你的手在抖。别停下来，血腥味会引来别的东西。', 'knife', '', 3900);
    }
  }

  function markMet(a) {
    a.met = true;
    G.stats.encounterSet.add(a.id);
    if (!G.flags.firstAggro) {
      G.flags.firstAggro = true;
      showToast('你被盯上了', '光照出了它的眼睛。关灯退开，或者握紧刀。', 'eye', 'is-danger');
      audio.alert();
    }
  }

  function hurtPlayer(amount, bleedAmount, source, sourceAngle) {
    if (!G.player || G.state !== 'playing' || G.player.dead) return;
    const p = G.player;
    if (p.invuln > 0) return;
    if (p.shield > 0) {
      p.shield--;
      p.invuln = 1.15;
      p.hurtT = .16;
      G.camera.shake = Math.max(G.camera.shake, 6);
      audio.tone(760, .5, { gain: .028, type: 'sine', to: 1180, filter: 'highpass', cutoff: 800 });
      showToast('护符替你挡下了一击', `还剩 ${p.shield} 次护符抵挡。`, 'shield', 'is-good', 2800);
      updateHUD(true);
      return;
    }
    amount *= (1 - G.mods.armor);
    p.hp -= amount;
    p.bleeding = clamp(p.bleeding + bleedAmount, 0, 3);
    p.invuln = .92;
    p.hurtT = .32;
    G.stats.hits++;
    G.stats.maxBleed = Math.max(G.stats.maxBleed, p.bleeding);
    G.deathSource = source || 'bleed';
    G.camera.shake = 10;
    ui.damageFlash.style.opacity = '.65';
    document.documentElement.style.setProperty('--bleed', p.bleeding / 3);
    audio.hurt();
    spawnBlood(p.x, p.y, sourceAngle == null ? Math.random() * TAU : sourceAngle + Math.PI, 18);
    for (let i = 0; i < 4; i++) {
      const distBack = 14 + i * 5;
      const nx = p.x + Math.cos(sourceAngle || 0) * distBack;
      const ny = p.y + Math.sin(sourceAngle || 0) * distBack;
      if (!collides(G.world, nx, ny, p.radius)) { p.x = nx; p.y = ny; }
    }
    if (!G.flags.firstBleed) {
      G.flags.firstBleed = true;
      showToast('你流血了', '失血会持续消耗生命。按 2 使用急救药物止血。', 'drop', 'is-danger');
    }
    if (p.hp <= 0) {
      p.hp = 0;
      die(source || 'bleed');
    }
    updateHUD(true);
  }

  function spawnBlood(x, y, angle, count) {
    for (let i = 0; i < count; i++) {
      const a = angle + rand(-.9, .9);
      const sp = 18 + Math.random() * 105;
      G.world.particles.push({
        type: 'blood', x: x + rand(-4, 4), y: y + rand(-4, 4),
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        r: 1 + Math.random() * 2.8, life: .35 + Math.random() * .7,
        maxLife: 1.05, color: Math.random() < .25 ? '#7d2724' : '#5f1d1b'
      });
    }
    for (let i = 0; i < 2; i++) {
      G.world.decals.push({
        x: x + rand(-16, 16), y: y + rand(-10, 10),
        r: rand(3, 10), rot: rand(0, TAU), alpha: rand(.14, .32)
      });
    }
    while (G.world.decals.length > 90) G.world.decals.shift();
  }

  // -------------------------------------------------------------------------
  // Input
  // -------------------------------------------------------------------------
  function getMoveInput() {
    let x = 0, y = 0;
    const k = G.keys;
    if (k.KeyA || k.ArrowLeft) x -= 1;
    if (k.KeyD || k.ArrowRight) x += 1;
    if (k.KeyW || k.ArrowUp) y -= 1;
    if (k.KeyS || k.ArrowDown) y += 1;
    x += G.touch.dx;
    y += G.touch.dy;
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    return { x, y, len: Math.min(1, len) };
  }

  function updateAim(dt, moveAngle, hasMove) {
    const p = G.player;
    if (!p) return;
    if (G.touchMode) {
      const target = nearestEnemy(320, false);
      if (target && (G.touch.attackHeld || target.aggro || dist(p.x, p.y, target.x, target.y) < 170)) {
        p.aim = angleLerp(p.aim, Math.atan2(target.y - p.y, target.x - p.x), 1 - Math.exp(-12 * dt));
      } else if (hasMove) {
        p.aim = angleLerp(p.aim, moveAngle, 1 - Math.exp(-9 * dt));
      }
    } else if (G.mouse.has) {
      const wx = G.mouse.x + G.camera.x;
      const wy = G.mouse.y + G.camera.y;
      p.aim = Math.atan2(wy - p.y, wx - p.x);
    } else if (hasMove) {
      p.aim = moveAngle;
    }
  }

  function moveActor(actor, dx, dy) {
    let movedX = false, movedY = false;
    if (dx !== 0) {
      const nx = actor.x + dx;
      if (!collides(G.world, nx, actor.y, actor.radius)) {
        actor.x = nx;
        movedX = true;
      }
    }
    if (dy !== 0) {
      const ny = actor.y + dy;
      if (!collides(G.world, actor.x, ny, actor.radius)) {
        actor.y = ny;
        movedY = true;
      }
    }
    return movedX || movedY;
  }

  function updatePlayer(dt) {
    const p = G.player;
    if (!p || p.dead) return;
    const input = getMoveInput();
    const hasMove = Math.hypot(input.x, input.y) > .08;
    const moveAngle = Math.atan2(input.y, input.x);
    updateAim(dt, moveAngle, hasMove);

    p.invuln = Math.max(0, p.invuln - dt);
    p.attackCd = Math.max(0, p.attackCd - dt);
    p.attackT = Math.max(0, p.attackT - dt);
    p.healT = Math.max(0, p.healT - dt);
    p.hurtT = Math.max(0, p.hurtT - dt);
    p.lightFlicker = Math.max(0, p.lightFlicker - dt);

    let wantSprint = !!(G.keys.ShiftLeft || G.keys.ShiftRight) || (G.touchMode && G.touch.stickMag > .93);
    if (p.stamina <= 1) wantSprint = false;
    const wasSprinting = p.sprinting;
    const sprinting = hasMove && wantSprint && p.stamina > 0;
    p.sprinting = sprinting;
    if (sprinting && !wasSprinting) audio.sprintWhoosh();
    p.sprintBlend = damp(p.sprintBlend || 0, sprinting ? 1 : 0, sprinting ? 11 : 7, dt);
    audio.setSprint(p.sprintBlend);
    const weatherStamina = G.weather ? G.weather.stamina : 1;
    if (sprinting) {
      p.stamina = Math.max(0, p.stamina - 25 * weatherStamina * dt);
    } else {
      p.stamina = Math.min(p.maxStamina, p.stamina + (hasMove ? 13 : 19) * (1 + G.mods.stamRegen) / weatherStamina * dt);
    }

    const bleedSlow = 1 - Math.min(.18, p.bleeding * .045);
    const healthSlow = p.hp < 30 ? .9 : 1;
    let targetSpeed = (sprinting ? PLAYER_SPRINT_SPEED * (1 + G.mods.sprint) : PLAYER_BASE_SPEED * (1 + G.mods.speed)) * bleedSlow * healthSlow;
    const chapter = chapterData();
    const marsh = chapter.marsh;
    if (marsh && p.y >= marsh[0] && p.y <= marsh[1]) targetSpeed *= .72;
    targetSpeed *= G.weather ? G.weather.speed : 1;
    // A short acceleration/deceleration makes starts, stops and turns read as body weight.
    p.currentSpeed = damp(p.currentSpeed || 0, hasMove ? targetSpeed : 0, hasMove ? 9 : 15, dt);
    const speed = Math.max(hasMove ? 18 : 0, p.currentSpeed);
    p.moving = false;
    if (hasMove) {
      const len = Math.hypot(input.x, input.y);
      const dx = (input.x / len) * speed * dt;
      const dy = (input.y / len) * speed * dt;
      const moved = moveActor(p, dx, dy);
      p.moving = moved;
      if (moved) {
        p.walk += speed * dt * .046;
        p.lastMoveAngle = moveAngle;
        p.stepT -= dt;
        if (p.stepT <= 0) {
          p.stepT = sprinting ? .215 : .37;
          p.stepSide = -(p.stepSide || 1);
          audio.step(sprinting);
          const sideX = Math.cos(p.face + Math.PI / 2) * p.stepSide * 5;
          const sideY = Math.sin(p.face + Math.PI / 2) * p.stepSide * 5;
          spawnFootstep(p.x + sideX - Math.cos(p.face) * 5, p.y + sideY - Math.sin(p.face) * 5, sprinting);
          if (sprinting) {
            G.world.effects.push({ type: 'noise', x: p.x, y: p.y, t: 0, life: .8, radius: 210 });
          }
        }
        if (sprinting) {
          p.ghostT = (p.ghostT || 0) - dt;
          if (p.ghostT <= 0) {
            p.ghostT = .055;
            G.ghosts.push({ x: p.x, y: p.y, face: p.face, walk: p.walk, life: .38, maxLife: .38 });
            if (G.ghosts.length > 18) G.ghosts.shift();
          }
          if (Math.random() < dt * 22) {
            G.world.particles.push({
              type: 'leaf', x: p.x + rand(-10, 10), y: p.y + rand(0, 10),
              vx: rand(-35, 35), vy: rand(-55, -8), rot: rand(0, TAU),
              spin: rand(-7, 7), r: rand(1.4, 3.2), life: rand(.35, .8),
              maxLife: .8, color: Math.random() < .5 ? '#8d8b5e' : '#5d714c'
            });
          }
        }
      }
    } else {
      p.walk += dt * .9;
    }
    // The body follows the direction of travel; the head, flashlight and knife
    // keep tracking the aim direction. This makes running look like running,
    // instead of the character moon-walking toward the cursor.
    const desiredFace = hasMove ? moveAngle : p.aim;
    const previousFace = p.face;
    p.face = angleLerp(p.face, desiredFace, 1 - Math.exp(-(hasMove ? 8.5 : 5.5) * dt));
    const turnRate = angleDiff(p.face, previousFace) / Math.max(dt, .001);
    p.bank = damp(p.bank || 0, clamp(turnRate * .028, -.16, .16), 8, dt);
    p.moveBlend = damp(p.moveBlend || 0, hasMove && p.moving ? 1 : 0, 9, dt);

    // Persistent blood loss
    if (p.bleeding > 0) {
      const rates = [0, .58, 1.34, 2.32];
      const rate = rates[p.bleeding] * (p.moving ? 1.11 : .92) * (1 - G.mods.bleed);
      p.hp -= rate * dt;
      if (p.hp <= 0) {
        p.hp = 0;
        die('bleed');
        return;
      }
    }

    if (G.touchMode && G.touch.attackHeld) attack();

    // Automatic pickups
    for (const item of G.world.pickups) {
      if (item.taken) continue;
      if (dist(p.x, p.y, item.x, item.y) < 30) {
        item.taken = true;
        p.meds++;
        audio.pickup();
        showToast('找到补给：急救药物 +1', '有人把药盒遗落在了这里。运气不错。', 'medkit', 'is-good');
        for (let i = 0; i < 14; i++) {
          const a = Math.random() * TAU;
          G.world.particles.push({
            type: 'heal', x: item.x + rand(-6, 6), y: item.y + rand(-6, 6),
            vx: Math.cos(a) * rand(15, 55), vy: Math.sin(a) * rand(15, 55) - 12,
            r: 1 + Math.random() * 2, life: .6 + Math.random() * .5,
            maxLife: 1.1, color: '#c0cf92'
          });
        }
        updateHUD(true);
      }
    }

    if (p.y < G.levelGoalY + 6 && G.state === 'playing') winGame();

    updateMilestones();
  }

  function spawnFootstep(x, y, sprint) {
    const count = sprint ? 10 : 2;
    for (let i = 0; i < count; i++) {
      G.world.particles.push({
        type: 'dust', x: x + rand(-7, 7), y: y + rand(-3, 9),
        vx: rand(sprint ? -42 : -18, sprint ? 42 : 18), vy: rand(sprint ? -32 : -16, 4),
        r: .8 + Math.random() * (sprint ? 3.4 : 2), life: .35 + Math.random() * .4,
        maxLife: .75, color: sprint ? 'rgba(139,132,91,.72)' : 'rgba(114,105,73,.55)'
      });
    }
    if (sprint) {
      for (let i = 0; i < 4; i++) {
        G.world.particles.push({
          type: 'leaf', x: x + rand(-12, 12), y: y + rand(-2, 8),
          vx: rand(-60, 60), vy: rand(-70, -12), rot: rand(0, TAU), spin: rand(-8, 8),
          r: rand(1.4, 3), life: rand(.35, .75), maxLife: .8,
          color: Math.random() < .5 ? '#9c9764' : '#607b52'
        });
      }
    }
  }

  // -------------------------------------------------------------------------
  // Forest life
  // -------------------------------------------------------------------------
  function inFlashCone(x, y, tolerance = .52, range = 720) {
    const p = G.player;
    if (!p || !p.lightOn) return false;
    const d = dist(p.x, p.y, x, y);
    if (d > range * (1 + (G.mods.light || 0)) * (G.weather ? G.weather.visibility : 1)) return false;
    return Math.abs(angleDiff(Math.atan2(y - p.y, x - p.x), p.aim)) < tolerance;
  }

  function updateMilestones() {
    const p = progress();
    const lv = levelData();
    if (!G.flags.ms1 && p > .22) {
      G.flags.ms1 = true;
      showToast(`${lv.name} · 深入`, '回头看时，来路已经被黑暗合上了。', 'leaf', '', 3800);
    }
    if (!G.flags.ms2 && p > .58) {
      G.flags.ms2 = true;
      const nearBridge = G.levelGoalY < RAVINE_Y && G.player.y > RAVINE_Y - 300;
      showToast(nearBridge ? '断崖在前' : '它们闻到你了', nearBridge ? '南侧锚点亮着一盏旧灯。用绳索固定一条生路。' : '省点体力，别把最后一段路跑丢。', nearBridge ? 'rope' : 'eye', nearBridge ? '' : 'is-danger', 4300);
    }
    if (!G.flags.ms4 && p > .86) {
      G.flags.ms4 = true;
      showToast('本关林道在前', `穿过${lv.name}，下一件随身物品就在界碑后。`, 'torch', 'is-good', 4000);
    }
  }

  function updateAnimals(dt) {
    const p = G.player;
    const noise = p.sprinting && p.moving;
    for (const a of G.world.animals) {
      if (a.dead) {
        a.deadT += dt;
        continue;
      }
      const cfg = ANIMAL_TYPES[a.type];
      a.hitFlash = Math.max(0, a.hitFlash - dt);
      a.stun = Math.max(0, a.stun - dt);
      a.cooldown = Math.max(0, a.cooldown - dt);
      a.growlCd = Math.max(0, a.growlCd - dt);
      a.alertT = Math.max(0, a.alertT - dt);
      const d = dist(a.x, a.y, p.x, p.y);
      const pan = clamp((a.x - p.x) / 420, -1, 1);
      const voiceVol = clamp(1 - d / 950, .08, 1);
      a.stepCd = (a.stepCd || 0) - dt;
      if (a.stepCd <= 0 && d < 620 && (a.state === 'chase' || a.state === 'charge' || a.state === 'wander')) {
        a.stepCd = a.type === 'snake' ? rand(.75, 1.5) : a.type === 'boar' ? rand(.36, .56) : rand(.26, .42);
        audio.animalStep(a.type, pan, voiceVol * (a.aggro ? 1 : .55));
      }
      const lit = inFlashCone(a.x, a.y, .6, 760);
      const levelSense = 1 + (G.level - 1) * .012;
      const sense = (cfg.detect * levelSense + (lit ? 185 : 0) + (noise ? 185 * (1 - G.mods.noise) : 0)) * (1 - G.mods.detect) * (G.weather ? G.weather.sense : 1);
      const homeDist = dist(a.x, a.y, a.homeX, a.homeY);

      if (!a.aggro) {
        if (d < sense) {
          a.aggro = true;
          a.state = 'alert';
          a.stateT = .34;
          a.face = Math.atan2(p.y - a.y, p.x - a.x);
          markMet(a);
          if (a.type === 'wolf') alertNearbyWolves(a, 310);
          if (d < 620 && a.growlCd <= 0) {
            a.growlCd = rand(2.2, 4.5);
            audio.animalAlert(a.type, pan, voiceVol);
          }
        } else {
          // quiet wandering
          a.wanderT -= dt;
          if (a.wanderT <= 0) {
            a.wanderT = rand(1.2, 3.6);
            a.wanderAngle = Math.random() * TAU;
          }
          if (dist(a.x, a.y, a.homeX, a.homeY) > 220) {
            a.wanderAngle = Math.atan2(a.homeY - a.y, a.homeX - a.x);
          }
          const wSpeed = a.type === 'snake' ? 8 : cfg.speed * .17;
          const moved = moveAnimalToward(a, a.x + Math.cos(a.wanderAngle) * 40, a.y + Math.sin(a.wanderAngle) * 40, wSpeed, dt);
          if (moved) a.face = angleLerp(a.face, a.wanderAngle, 1 - Math.exp(-4 * dt));
          a.state = 'idle';
          continue;
        }
      }

      if (a.aggro) {
        if (d > cfg.lose || homeDist > 1300) {
          a.aggro = false;
          a.state = 'idle';
          a.stateT = 0;
          a.cooldown = .8;
          continue;
        }
        if (!a.met) markMet(a);
        if (d < 660 && a.growlCd <= 0) {
          a.growlCd = rand(3.5, 7);
          audio.animalAlert(a.type, pan, voiceVol * .7);
        }
      }

      if (a.aggro) {
        a.face = angleLerp(a.face, Math.atan2(p.y - a.y, p.x - a.x), 1 - Math.exp(-9 * dt));
      }

      if (a.stun > 0) continue;

      if (a.state === 'alert') {
        a.stateT -= dt;
        if (a.stateT <= 0) { a.state = 'chase'; a.stateT = 0; }
        continue;
      }

      if (a.state === 'flee') {
        a.fleeT -= dt;
        const away = Math.atan2(a.y - p.y, a.x - p.x);
        moveAnimalToward(a, a.x + Math.cos(away) * 80, a.y + Math.sin(away) * 80, cfg.speed * 1.25, dt);
        a.face = angleLerp(a.face, away, 1 - Math.exp(-7 * dt));
        if (a.fleeT <= 0) {
          a.aggro = false;
          a.state = 'idle';
          a.hp = Math.min(a.maxHp, a.hp + 8);
        }
        continue;
      }

      if (a.state === 'chargeWind') {
        a.stateT -= dt;
        if (a.stateT <= 0) {
          a.state = 'charge';
          a.stateT = .56;
          a.chargeAngle = Math.atan2(p.y - a.y, p.x - a.x);
          a.hitDone = false;
          a.face = a.chargeAngle;
          audio.animalAlert(a.type, pan, Math.max(.6, voiceVol));
        }
        continue;
      }

      if (a.state === 'charge') {
        a.stateT -= dt;
        const beforeX = a.x, beforeY = a.y;
        const moved = moveAnimalToward(a, a.x + Math.cos(a.chargeAngle) * 100, a.y + Math.sin(a.chargeAngle) * 100, 510, dt);
        a.face = a.chargeAngle;
        if (!moved && (Math.abs(a.x - beforeX) < .3 || Math.abs(a.y - beforeY) < .3)) {
          a.stun = .6;
          a.state = 'recover';
          a.stateT = .8;
          a.cooldown = 2.2;
          G.camera.shake = Math.max(G.camera.shake, 3);
          continue;
        }
        if (!a.hitDone && d < a.radius + p.radius + 12) {
          a.hitDone = true;
          hurtPlayer(a.damage || cfg.damage, cfg.bleed, a.type, a.chargeAngle);
        }
        if (a.stateT <= 0) {
          a.state = 'recover';
          a.stateT = .75;
          a.cooldown = 2.30;
        }
        continue;
      }

      if (a.state === 'windup') {
        a.stateT -= dt;
        if (a.type === 'wolf') {
          const lunge = 70 * dt;
          moveAnimalToward(a, a.x + Math.cos(a.face) * lunge, a.y + Math.sin(a.face) * lunge, cfg.speed, dt);
        }
        if (a.stateT <= 0) {
          if (dist(a.x, a.y, p.x, p.y) < cfg.reach + p.radius + 10) {
            hurtPlayer(a.damage || cfg.damage, cfg.bleed, a.type, Math.atan2(p.y - a.y, p.x - a.x));
          }
          a.state = 'recover';
          a.stateT = a.type === 'boar' ? .7 : .4;
          a.cooldown = a.type === 'snake' ? 2.1 : 1.25;
        }
        continue;
      }

      if (a.state === 'recover') {
        a.stateT -= dt;
        if (a.type === 'snake') {
          const away = Math.atan2(a.y - p.y, a.x - p.x);
          moveAnimalToward(a, a.x + Math.cos(away) * 50, a.y + Math.sin(away) * 50, cfg.speed * .8, dt);
        }
        if (a.stateT <= 0) a.state = 'chase';
        continue;
      }

      // chase / approach
      if (a.state === 'idle') a.state = 'chase';
      if (a.type === 'boar') {
        if (a.cooldown <= 0 && d < 315 && d > 80) {
          a.state = 'chargeWind';
          a.stateT = .52;
          a.face = Math.atan2(p.y - a.y, p.x - a.x);
          audio.animalAlert(a.type, pan, voiceVol);
          for (let i = 0; i < 8; i++) {
            G.world.particles.push({
              type: 'dust', x: a.x + rand(-12, 12), y: a.y + 14,
              vx: rand(-35, 35), vy: rand(-16, 6),
              r: 1 + Math.random() * 2, life: .5 + Math.random() * .4,
              maxLife: .9, color: 'rgba(119,99,70,.55)'
            });
          }
          continue;
        }
        if (d < cfg.reach + p.radius && a.cooldown <= 0) {
          a.state = 'windup';
          a.stateT = .3;
          continue;
        }
        moveAnimalToward(a, p.x, p.y, cfg.speed * (d < 150 ? .75 : 1), dt);
      } else if (a.type === 'wolf') {
        if (d < cfg.reach + p.radius + 8 && a.cooldown <= 0) {
          a.state = 'windup';
          a.stateT = .24;
          continue;
        }
        if (d < 135 && a.cooldown > .7) {
          const orbit = Math.atan2(a.y - p.y, a.x - p.x) + .75;
          moveAnimalToward(a, p.x + Math.cos(orbit) * 105, p.y + Math.sin(orbit) * 105, cfg.speed * .72, dt);
        } else {
          moveAnimalToward(a, p.x, p.y, cfg.speed, dt);
        }
      } else {
        if (d < cfg.reach + p.radius + 4 && a.cooldown <= 0) {
          a.state = 'windup';
          a.stateT = .16;
          continue;
        }
        if (d > 55) moveAnimalToward(a, p.x, p.y, cfg.speed * .9, dt);
      }
    }

    separateAnimals(dt);
  }

  function alertNearbyWolves(source, radius) {
    for (const other of G.world.animals) {
      if (other === source || other.dead || other.type !== 'wolf' || other.aggro) continue;
      if (dist(source.x, source.y, other.x, other.y) < radius) {
        other.aggro = true;
        other.state = 'alert';
        other.stateT = .5;
        other.face = Math.atan2(G.player.y - other.y, G.player.x - other.x);
        markMet(other);
      }
    }
  }

  function moveAnimalToward(a, tx, ty, speed, dt) {
    const ang = Math.atan2(ty - a.y, tx - a.x);
    const step = speed * dt;
    const beforeX = a.x, beforeY = a.y;
    const dx = Math.cos(ang) * step;
    const dy = Math.sin(ang) * step;
    if (!collides(G.world, a.x + dx, a.y, a.radius)) a.x += dx;
    if (!collides(G.world, a.x, a.y + dy, a.radius)) a.y += dy;
    if (Math.abs(a.x - beforeX) < .01 && Math.abs(a.y - beforeY) < .01) {
      const alt = ang + (a.phase > Math.PI ? 1 : -1) * .9;
      const ax = Math.cos(alt) * step;
      const ay = Math.sin(alt) * step;
      if (!collides(G.world, a.x + ax, a.y, a.radius)) a.x += ax;
      if (!collides(G.world, a.x, a.y + ay, a.radius)) a.y += ay;
    }
    a.face = angleLerp(a.face, ang, 1 - Math.exp(-8 * dt));
    a.phase += dt * (speed / 40);
    return Math.abs(a.x - beforeX) + Math.abs(a.y - beforeY) > .03;
  }

  function separateAnimals() {
    const arr = G.world.animals;
    for (let i = 0; i < arr.length; i++) {
      const a = arr[i];
      if (a.dead) continue;
      for (let j = i + 1; j < arr.length; j++) {
        const b = arr[j];
        if (b.dead) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const min = a.radius + b.radius + 4;
        const d2 = dx * dx + dy * dy;
        if (d2 > 0 && d2 < min * min) {
          const d = Math.sqrt(d2);
          const push = (min - d) * .5;
          const nx = dx / d, ny = dy / d;
          if (!collides(G.world, a.x - nx * push, a.y - ny * push, a.radius)) {
            a.x -= nx * push; a.y -= ny * push;
          }
          if (!collides(G.world, b.x + nx * push, b.y + ny * push, b.radius)) {
            b.x += nx * push; b.y += ny * push;
          }
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Interaction, danger, camera
  // -------------------------------------------------------------------------
  function computeInteraction() {
    if (!G.player || !G.world || G.state !== 'playing') return null;
    const p = G.player, w = G.world;
    if (!w.bridge.secured && dist(p.x, p.y, w.bridge.anchorX, w.bridge.anchorY) < 190) {
      return {
        type: 'bridge',
        title: '固定绳索',
        sub: '跨过断崖 · 消耗绳索 ×1'
      };
    }
    if (!w.cache.opened && dist(p.x, p.y, w.cache.x, w.cache.y) < 92) {
      return {
        type: 'cache',
        title: '割开藤蔓',
        sub: '里面似乎压着一只旧药盒'
      };
    }
    return null;
  }

  function updatePrompt() {
    const it = computeInteraction();
    G.interaction = it;
    if (!it) {
      if (G.promptSignature !== '') {
        G.promptSignature = '';
        ui.prompt.classList.remove('is-visible');
      }
      return;
    }
    const sig = it.type + '|' + it.title;
    if (sig !== G.promptSignature) {
      G.promptSignature = sig;
      ui.promptTitle.textContent = it.title;
      ui.promptSub.textContent = it.sub;
      ui.prompt.classList.add('is-visible');
    }
  }

  function updateDanger(dt) {
    let nearest = Infinity;
    for (const a of G.world.animals) {
      if (a.dead || !a.aggro) continue;
      const d = dist(a.x, a.y, G.player.x, G.player.y);
      if (d < nearest) nearest = d;
    }
    const threat = nearest < Infinity ? smoothstep(700, 180, nearest) : 0;
    const bleedThreat = G.player.bleeding * .12;
    G.danger = clamp(Math.max(threat, bleedThreat + (G.player.hp < 32 ? .22 : 0)), 0, 1);
    audio.setDanger(G.danger);
    audio.update(dt);
    ui.dangerPulse.classList.toggle('is-danger', nearest < 420 || G.player.bleeding >= 3);
  }

  function updateCamera(dt) {
    const p = G.player;
    const sp = p.sprintBlend || 0;
    const look = 56 + sp * 44;
    const moveLeadX = Math.cos(p.lastMoveAngle || p.aim) * sp * 16;
    const moveLeadY = Math.sin(p.lastMoveAngle || p.aim) * sp * 16;
    const tx = clamp(p.x + Math.cos(p.aim) * look + moveLeadX - viewW / 2, 0, Math.max(0, WORLD_W - viewW));
    const ty = clamp(p.y + Math.sin(p.aim) * look + moveLeadY - viewH / 2, 0, Math.max(0, WORLD_H - viewH));
    G.camera.x = damp(G.camera.x, tx, 6.5 + sp * 3.5, dt);
    G.camera.y = damp(G.camera.y, ty, 6.5 + sp * 3.5, dt);
    G.camera.shake = Math.max(0, G.camera.shake - 28 * dt);
    const s = G.camera.shake + sp * .55;
    G.camera.shakeX = (Math.random() * 2 - 1) * s;
    G.camera.shakeY = (Math.random() * 2 - 1) * s + Math.sin(p.walk * 2) * .7 * (p.moveBlend || 0);
  }

  function snapCameraToPlayer() {
    const p = G.player;
    G.camera.x = clamp(p.x - viewW / 2, 0, Math.max(0, WORLD_W - viewW));
    G.camera.y = clamp(p.y - viewH / 2, 0, Math.max(0, WORLD_H - viewH));
    G.camera.targetX = G.camera.x;
    G.camera.targetY = G.camera.y;
  }

  // -------------------------------------------------------------------------
  // Frame updates
  // -------------------------------------------------------------------------
  function updateMenu(dt) {
    G.envTime += dt;
    const p = G.player;
    if (!p || !G.world) return;
    p.aim = -1.88 + Math.sin(G.envTime * .14) * .12;
    p.face = angleLerp(p.face, p.aim, 1 - Math.exp(-2 * dt));
    p.walk += dt * .7;
    const driftX = Math.sin(G.envTime * .07) * 16;
    const driftY = Math.cos(G.envTime * .055) * 7;
    G.camera.x = damp(G.camera.x, clamp(G.camera.menuX + driftX, 0, Math.max(0, WORLD_W - viewW)), 1.6, dt);
    G.camera.y = damp(G.camera.y, clamp(G.camera.menuY + driftY, 0, Math.max(0, WORLD_H - viewH)), 1.6, dt);
    G.camera.shakeX = 0;
    G.camera.shakeY = 0;
    updateParticles(dt);
  }

  function updateWeather(dt) {
    if (!G.weather) return;
    G.weatherTime += dt;
    G.lightning = Math.max(0, G.lightning - dt * 2.1);
    if (G.weather.storm > 0) {
      G.weatherTimer -= dt;
      if (G.weatherTimer <= 0) {
        G.weatherTimer = rand(4.5, 10) / G.weather.storm;
        G.lightning = 1;
        audio.thunder(G.weather.storm);
      }
    }
  }

  function updateGame(dt) {
    G.envTime += dt;
    G.runTime += dt;
    updateWeather(dt);
    updatePlayer(dt);
    for (let i = G.ghosts.length - 1; i >= 0; i--) {
      G.ghosts[i].life -= dt;
      if (G.ghosts[i].life <= 0) G.ghosts.splice(i, 1);
    }
    if (G.state !== 'playing') {
      updateParticles(dt);
      return;
    }
    updateAnimals(dt);
    updateParticles(dt);
    updateCamera(dt);
    updatePrompt();

    for (const t of G.tutorial) {
      if (!t.shown && G.runTime >= t.at) {
        t.shown = true;
        showToast(t.title, t.text, t.icon, t.kind);
      }
    }

    updateDanger(dt);
    G.hudT -= dt;
    if (G.hudT <= 0) {
      G.hudT = .075;
      updateHUD();
    }
    ui.damageFlash.style.opacity = String(Math.max(0, parseFloat(ui.damageFlash.style.opacity || '0') - dt * 1.7));
  }

  function updateEnd(dt) {
    G.envTime += dt;
    updateWeather(dt);
    updateParticles(dt);
    G.camera.shake = Math.max(0, G.camera.shake - 20 * dt);
    G.camera.shakeX = (Math.random() * 2 - 1) * G.camera.shake;
    G.camera.shakeY = (Math.random() * 2 - 1) * G.camera.shake;
    ui.damageFlash.style.opacity = String(Math.max(0, parseFloat(ui.damageFlash.style.opacity || '0') - dt * 1.3));
  }

  function updateParticles(dt) {
    if (!G.world) return;
    const arr = G.world.particles;
    for (let i = arr.length - 1; i >= 0; i--) {
      const p = arr[i];
      p.life -= dt;
      if (p.life <= 0) {
        arr.splice(i, 1);
        continue;
      }
      if (p.type === 'ember') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy -= 8 * dt;
        p.vx += Math.sin((G.envTime + p.life) * 6) * 4 * dt;
      } else {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= Math.pow(.08, dt);
        p.vy *= Math.pow(.08, dt);
      }
    }
    for (let i = G.world.effects.length - 1; i >= 0; i--) {
      const e = G.world.effects[i];
      e.t += dt;
      if (e.t >= e.life) G.world.effects.splice(i, 1);
    }
    // Campfire embers are cheap and atmospheric
    if (G.state !== 'menu' && G.state !== 'paused' && Math.random() < dt * 9) {
      const fire = G.world.campfire;
      G.world.particles.push({
        type: 'ember', x: fire.x + rand(-8, 8), y: fire.y + rand(-2, 5),
        vx: rand(-9, 9), vy: rand(-42, -22),
        r: .7 + Math.random() * 1.7, life: .7 + Math.random() * .9,
        maxLife: 1.6, color: '#f2a453'
      });
    }
  }

  // -------------------------------------------------------------------------
  // Rendering helpers
  // -------------------------------------------------------------------------
  let glowSprite = null;
  let fireflySprite = null;
  let fogSprite = null;
  const treeSprites = [];
  const fernSprites = [];
  const bushSprites = [];
  const tuftSprites = [];

  function makeRadialSprite(size, inner, mid, outer) {
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, inner);
    grad.addColorStop(.32, mid);
    grad.addColorStop(1, outer);
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    return c;
  }

  function makeFogSprite() {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 256;
    const g = c.getContext('2d');
    for (let i = 0; i < 20; i++) {
      const x = rand(50, 462);
      const y = rand(50, 206);
      const r = rand(35, 130);
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(170,196,180,.16)');
      grad.addColorStop(.5, 'rgba(143,175,164,.07)');
      grad.addColorStop(1, 'rgba(130,160,150,0)');
      g.fillStyle = grad;
      g.beginPath();
      g.ellipse(x, y, r, r * .42, rand(-.3, .3), 0, TAU);
      g.fill();
    }
    return c;
  }

  function initSprites() {
    glowSprite = makeRadialSprite(128, 'rgba(255,203,128,.92)', 'rgba(244,166,82,.3)', 'rgba(236,146,62,0)');
    fireflySprite = makeRadialSprite(64, 'rgba(255,249,205,1)', 'rgba(221,236,152,.55)', 'rgba(190,220,120,0)');
    fogSprite = makeFogSprite();
    buildTreeSprites();
    buildFoliageSprites();
  }

  function buildFoliageSprites() {
    fernSprites.length = 0;
    bushSprites.length = 0;
    tuftSprites.length = 0;
    const rng = mulberry32(0xf00d5);
    for (let v = 0; v < 12; v++) {
      fernSprites.push({
        unlit: bakeFernSprite(rng, .02),
        lit: bakeFernSprite(rng, 1)
      });
    }
    for (let v = 0; v < 12; v++) {
      bushSprites.push({
        unlit: bakeBushSprite(rng, .02),
        lit: bakeBushSprite(rng, 1)
      });
    }
    for (let v = 0; v < 10; v++) tuftSprites.push(bakeTuftSprite(rng));
  }

  function bakeFernSprite(rng, lum) {
    const c = document.createElement('canvas');
    c.width = 96;
    c.height = 96;
    const g = c.getContext('2d');
    g.translate(48, 72);
    const shade = rng();
    const fronds = 5;
    for (let i = 0; i < fronds; i++) {
      const a = (i / (fronds - 1) - .5) * 1.9 - 1.5;
      const len = 15 + (i % 3) * 6;
      g.strokeStyle = lum > .03
        ? `rgba(${Math.round(34 + lum * 58)},${Math.round(64 + lum * 73)},${Math.round(39 + lum * 33)},${.68 + lum * .28})`
        : (shade < .4 ? 'rgba(24,48,31,.82)' : shade < .75 ? 'rgba(33,62,38,.74)' : 'rgba(47,72,41,.58)');
      g.lineWidth = 1.3;
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(Math.cos(a) * len * .45, Math.sin(a) * len * .2 - 2, Math.cos(a) * len, Math.sin(a) * len * .35 - 4);
      g.stroke();
      for (let k = 1; k <= 3; k++) {
        const t = k / 4;
        const px = Math.cos(a) * len * t;
        const py = Math.sin(a) * len * t * .45 - 3 * t;
        const la = a + (k % 2 === 0 ? .9 : -.9);
        g.beginPath();
        g.moveTo(px, py);
        g.lineTo(px + Math.cos(la) * 4.5, py + Math.sin(la) * 2.4);
        g.stroke();
      }
    }
    return c;
  }

  function bakeBushSprite(rng, lum) {
    const c = document.createElement('canvas');
    c.width = 100;
    c.height = 82;
    const g = c.getContext('2d');
    g.translate(50, 58);
    const baseR = 22;
    for (let k = 0; k < 7; k++) {
      const a = rng() * TAU;
      const rr = rng() * baseR * .6;
      const rx = baseR * (.35 + rng() * .45);
      const ry = baseR * (.2 + rng() * .25);
      const rot = rng() * TAU;
      const leafShade = rng();
      if (lum > .03) {
        g.fillStyle = `rgba(${Math.round(24 + lum * 52 + leafShade * 8)},${Math.round(49 + lum * 72)},${Math.round(31 + lum * 35)},${.7 + lum * .24})`;
      } else {
        g.fillStyle = leafShade > .66 ? 'rgba(38,64,40,.72)' : leafShade > .33 ? 'rgba(27,50,33,.8)' : 'rgba(18,37,25,.85)';
      }
      g.beginPath();
      g.ellipse(Math.cos(a) * rr, Math.sin(a) * rr * .55, rx, ry, rot, 0, TAU);
      g.fill();
    }
    return c;
  }

  function bakeTuftSprite(rng) {
    const c = document.createElement('canvas');
    c.width = 40;
    c.height = 40;
    const g = c.getContext('2d');
    g.translate(20, 32);
    const shade = rng();
    g.strokeStyle = shade < .5 ? 'rgba(36,58,38,.72)' : 'rgba(50,68,42,.55)';
    g.lineWidth = .8;
    const blades = 3 + ((rng() * 3) | 0);
    for (let b = 0; b < blades; b++) {
      const bx = (b - blades / 2) * 1.7;
      const size = 5 + rng() * 5;
      g.beginPath();
      g.moveTo(bx, 0);
      g.quadraticCurveTo(bx + 2, -size * .5, bx + (shade - .5) * 6, -size * (.55 + b * .12));
      g.stroke();
    }
    return c;
  }

  function buildTreeSprites() {
    treeSprites.length = 0;
    const rng = mulberry32(0x51f15e);
    const layout = [
      ...Array(15).fill('broad'),
      ...Array(10).fill('pine'),
      ...Array(5).fill('dead')
    ];
    for (let i = 0; i < layout.length; i++) {
      const t = createTree(rng, 0, 0);
      t.type = layout[i];
      t.scale = 1.02 + rng() * .34;
      t.canopyLift = 24 + t.scale * 24;
      t.canopyR = 40 + t.scale * 36;
      t.trunkH = 16 + t.scale * 19;
      const unlit = bakeTreeSprite(t, .04, true);
      const lit = bakeTreeSprite(t, 1, false);
      treeSprites.push({ unlit, lit, anchorX: 150, anchorY: 230, size: 300, baseScale: t.scale });
    }
  }

  function bakeTreeSprite(t, lum, withShadow) {
    const c = document.createElement('canvas');
    c.width = 300;
    c.height = 300;
    const g = c.getContext('2d');
    g.translate(150, 230);
    if (withShadow) {
      g.fillStyle = 'rgba(1,4,3,.32)';
      g.beginPath();
      g.ellipse(3, 3, Math.max(24, t.canopyR * .6), Math.max(8, t.canopyR * .18), 0, 0, TAU);
      g.fill();
    }
    if (t.type === 'broad') {
      g.save();
      g.translate(0, -t.canopyLift);
      const r = Math.round(16 + lum * 58);
      const gg = Math.round(34 + lum * 84);
      const b = Math.round(23 + lum * 47);
      g.fillStyle = `rgba(${r},${gg},${b},.97)`;
      for (const cl of t.clusters) {
        g.save();
        g.translate(cl.dx, cl.dy);
        g.rotate(cl.rot);
        g.beginPath();
        g.ellipse(0, 0, cl.rx, cl.ry, 0, 0, TAU);
        g.fill();
        g.restore();
      }
      for (const cl of t.clusters) {
        g.save();
        g.translate(cl.dx - 3, cl.dy - 4);
        g.rotate(cl.rot);
        g.fillStyle = `rgba(${Math.round(32 + lum * 70)},${Math.round(60 + lum * 95)},${Math.round(38 + lum * 55)},${.36 + lum * .3})`;
        g.beginPath();
        g.ellipse(0, 0, cl.rx * .71, cl.ry * .51, 0, 0, TAU);
        g.fill();
        g.restore();
      }
      for (const s of t.speckles) {
        g.fillStyle = `rgba(${Math.round(48 + lum * 80)},${Math.round(74 + lum * 98)},${Math.round(44 + lum * 55)},${.32 + lum * .28})`;
        g.beginPath();
        g.arc(s.dx, s.dy, s.r, 0, TAU);
        g.fill();
      }
      g.restore();
    } else if (t.type === 'pine') {
      g.save();
      g.translate(0, -t.canopyLift * .62);
      for (let i = 0; i < 4; i++) {
        const yy = i * t.canopyR * .32;
        const w = t.canopyR * (1.1 - i * .18);
        const h = t.canopyR * (.5 + i * .05);
        g.fillStyle = `rgba(${Math.round(15 + lum * 48)},${Math.round(32 + lum * 68)},${Math.round(21 + lum * 42)},${i < 2 ? .98 : .94})`;
        g.beginPath();
        g.moveTo(0, yy - h);
        g.lineTo(w, yy + h * .25);
        g.quadraticCurveTo(w * .3, yy + h * .1, 0, yy + h * .28);
        g.quadraticCurveTo(-w * .3, yy + h * .1, -w, yy + h * .25);
        g.closePath();
        g.fill();
      }
      g.strokeStyle = `rgba(104,134,102,${.1 + lum * .22})`;
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(-1, -t.canopyR * .45);
      g.lineTo(-1, t.canopyR * .6);
      g.stroke();
      g.restore();
    }
    // roots
    const h = t.trunkH;
    const w = Math.max(4, t.collider * .78);
    g.strokeStyle = `rgba(${26 + lum * 22},${24 + lum * 20},${16 + lum * 14},.95)`;
    g.lineCap = 'round';
    for (const r of t.roots) {
      g.lineWidth = 2 + t.scale;
      g.beginPath();
      g.moveTo(0, -2);
      g.quadraticCurveTo(Math.cos(r.a) * r.len * .5, Math.sin(r.a) * r.len * .1, Math.cos(r.a) * r.len, Math.sin(r.a) * r.len * .23);
      g.stroke();
    }
    const trunkGrad = g.createLinearGradient(-w, 0, w, 0);
    trunkGrad.addColorStop(0, `rgb(${27 + lum * 36},${29 + lum * 32},${20 + lum * 24})`);
    trunkGrad.addColorStop(.42, `rgb(${Math.round(71 + lum * 62)},${Math.round(63 + lum * 54)},${Math.round(51 + lum * 33)})`);
    trunkGrad.addColorStop(.75, `rgb(${49 + lum * 44},${45 + lum * 38},${32 + lum * 25})`);
    trunkGrad.addColorStop(1, `rgb(${17 + lum * 27},${19 + lum * 25},${13 + lum * 18})`);
    g.fillStyle = trunkGrad;
    g.beginPath();
    g.moveTo(-w, 0);
    g.bezierCurveTo(-w * .8, -h * .35, -w * .5, -h * .8, -w * .36, -h);
    g.lineTo(w * .3, -h);
    g.bezierCurveTo(w * .55, -h * .8, w * .9, -h * .35, w, 0);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(13,14,9,.55)';
    g.lineWidth = 1;
    for (let i = -1; i <= 1; i++) {
      g.beginPath();
      g.moveTo(i * w * .28, -h * .12);
      g.quadraticCurveTo(i * w * .2 + 2, -h * .5, i * w * .3, -h * .9);
      g.stroke();
    }
    if (t.type === 'dead') {
      g.strokeStyle = '#2e2b20';
      g.lineWidth = 2.4;
      g.beginPath();
      g.moveTo(0, -h);
      g.lineTo(w * 1.8, -h - 22);
      g.moveTo(w * .8, -h - 9);
      g.lineTo(w * 2.4, -h - 4);
      g.stroke();
    } else {
      g.strokeStyle = t.type === 'pine' ? 'rgba(48,45,32,.8)' : 'rgba(59,52,35,.7)';
      g.lineWidth = 1.7;
      g.beginPath();
      g.moveTo(0, -h * .78);
      g.lineTo(-w * 2.7, -h - 12);
      g.moveTo(0, -h * .55);
      g.lineTo(w * 2.2, -h - 4);
      g.stroke();
    }
    return c;
  }

  function drawGlow(x, y, size, alpha, color = 'warm') {
    if (!glowSprite) return;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = alpha;
    if (color === 'cool') ctx.filter = 'hue-rotate(115deg)';
    ctx.drawImage(glowSprite, x - size / 2, y - size / 2, size, size);
    ctx.restore();
  }

  function drawFrame() {
    if (!G.world || !G.player) return;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#030806';
    ctx.fillRect(0, 0, viewW, viewH);
    const camX = G.camera.x + G.camera.shakeX;
    const camY = G.camera.y + G.camera.shakeY;
    const view = { x: camX, y: camY, w: viewW, h: viewH };
    ctx.save();
    const sprintZoom = 1 + (G.player ? (G.player.sprintBlend || 0) : 0) * .022;
    if (sprintZoom > 1.0001) {
      ctx.translate(viewW / 2, viewH / 2);
      ctx.scale(sprintZoom, sprintZoom);
      ctx.translate(-viewW / 2, -viewH / 2);
    }
    ctx.translate(-camX, -camY);
    drawGround(view);
    drawTrail(view);
    drawDecals();
    if (!G.skipFoliage) drawGroundCover(view);
    drawRavine(view);
    drawCamp(view);
    drawSigns(view);
    drawRocksAndLogs(view);
    if (!G.skipTrees) drawTreeLayer(view);
    drawBridge(view);
    drawLevelGoal(view);
    drawInteractables(view);
    drawEntities(view);
    drawWorldParticles();
    ctx.restore();
    if (!G.skipLighting) drawLighting(camX, camY);
    drawAfterDark(camX, camY);
    drawGhostGlow(camX, camY);
    drawScreenAtmosphere(camX, camY);
    drawReticle(camX, camY);
  }

  function drawGround(view) {
    ctx.fillStyle = G.world.groundPattern;
    ctx.fillRect(view.x - 4, view.y - 4, view.w + 8, view.h + 8);
    // A soft bed of shadow under the distant forest
    const g = ctx.createLinearGradient(0, view.y, 0, view.y + view.h);
    g.addColorStop(0, 'rgba(1,6,5,.18)');
    g.addColorStop(.6, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,.16)');
    ctx.fillStyle = g;
    ctx.fillRect(view.x, view.y, view.w, view.h);
  }

  function trailPath() {
    const t = G.world.trail;
    ctx.beginPath();
    ctx.moveTo(t[0].x, t[0].y);
    for (let i = 1; i < t.length; i++) ctx.lineTo(t[i].x, t[i].y);
  }

  function drawTrail(view) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    trailPath();
    ctx.strokeStyle = 'rgba(30,36,24,.72)';
    ctx.lineWidth = 146;
    ctx.stroke();
    trailPath();
    ctx.strokeStyle = 'rgba(66,60,41,.72)';
    ctx.lineWidth = 112;
    ctx.stroke();
    trailPath();
    ctx.strokeStyle = 'rgba(106,91,60,.22)';
    ctx.lineWidth = 78;
    ctx.stroke();
    trailPath();
    ctx.strokeStyle = 'rgba(138,116,77,.08)';
    ctx.lineWidth = 22;
    ctx.stroke();

    // Worn pebbles and scuffs along the trail
    const t = G.world.trail;
    for (let i = 6; i < t.length; i += 7) {
      const p = t[i];
      if (p.x < view.x - 100 || p.x > view.x + view.w + 100 || p.y < view.y - 100 || p.y > view.y + view.h + 100) continue;
      const side = Math.sin(i * 2.13 + G.world.seed * .002);
      const x = p.x + side * 35;
      const y = p.y + Math.cos(i * 1.7) * 16;
      ctx.fillStyle = i % 3 === 0 ? 'rgba(124,112,80,.22)' : 'rgba(32,28,20,.45)';
      ctx.beginPath();
      ctx.ellipse(x, y, 2 + (i % 4), 1.2 + (i % 3) * .7, i * .7, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawDecals() {
    for (const d of G.world.decals) {
      ctx.save();
      ctx.globalAlpha = d.alpha;
      ctx.fillStyle = '#431715';
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, d.r, d.r * .55, d.rot, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawGroundCover(view) {
    // Grass tufts
    for (const f of G.world.tufts) {
      if (f.x < view.x - 30 || f.x > view.x + view.w + 30 || f.y < view.y - 30 || f.y > view.y + view.h + 30) continue;
      const sp = tuftSprites[f.spriteIndex];
      if (!sp) continue;
      const s = f.size / 7.5;
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.angle);
      ctx.scale(f.flip * s, s);
      ctx.drawImage(sp, -20, -32, 40, 40);
      ctx.restore();
    }
    // Ferns
    for (const f of G.world.ferns) {
      if (f.x < view.x - 100 || f.x > view.x + view.w + 100 || f.y < view.y - 100 || f.y > view.y + view.h + 100) continue;
      const sp = fernSprites[f.spriteIndex];
      if (!sp) continue;
      const sway = Math.sin(G.envTime * .55 + f.phase) * .045;
      const lum = flashlightFactorAt(f.x, f.y, .86);
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.angle + sway);
      ctx.scale(f.flip * f.scale, f.scale);
      ctx.drawImage(sp.unlit, -48, -72, 96, 96);
      if (lum > .025) {
        ctx.globalAlpha = Math.min(.9, lum * .95);
        ctx.drawImage(sp.lit, -48, -72, 96, 96);
      }
      ctx.restore();
    }
    // Low scrub
    for (const b of G.world.bushes) {
      if (b.x < view.x - 90 || b.x > view.x + view.w + 90 || b.y < view.y - 90 || b.y > view.y + view.h + 90) continue;
      const sp = bushSprites[b.spriteIndex];
      if (!sp) continue;
      const lum = flashlightFactorAt(b.x, b.y, .9);
      const s = clamp(b.size / 23, .55, 1.7);
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.scale(b.flip * s, s);
      ctx.drawImage(sp.unlit, -50, -58, 100, 82);
      if (lum > .025) {
        ctx.globalAlpha = Math.min(.85, lum * .9);
        ctx.drawImage(sp.lit, -50, -58, 100, 82);
      }
      ctx.restore();
    }
  }

  function drawFern(f, lum = 0) {
    const sway = Math.sin(G.envTime * .55 + f.phase) * .045;
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.angle + sway);
    ctx.scale(f.scale, f.scale);
    let dark;
    if (lum > .04) {
      dark = `rgba(${Math.round(34 + lum * 58)},${Math.round(64 + lum * 73)},${Math.round(39 + lum * 33)},${.65 + lum * .3})`;
    } else {
      dark = f.shade < .4 ? 'rgba(24,48,31,.82)' : f.shade < .75 ? 'rgba(33,62,38,.74)' : 'rgba(47,72,41,.58)';
    }
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.3;
    const fronds = 5;
    for (let i = 0; i < fronds; i++) {
      const a = (i / (fronds - 1) - .5) * 1.9 - 1.5;
      const len = 15 + (i % 3) * 6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(Math.cos(a) * len * .45, Math.sin(a) * len * .2 - 2, Math.cos(a) * len, Math.sin(a) * len * .35 - 4);
      ctx.stroke();
      for (let k = 1; k <= 3; k++) {
        const t = k / 4;
        const px = Math.cos(a) * len * t;
        const py = Math.sin(a) * len * t * .45 - 3 * t;
        const la = a + (k % 2 === 0 ? .9 : -.9);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(la) * 4.5, py + Math.sin(la) * 2.4);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function flashlightFactorAt(x, y, tolerance = .75, range = 790) {
    const p = G.player;
    if (!p || !p.lightOn) return 0;
    const reach = range * (1 + (G.mods.light || 0)) * (G.weather ? G.weather.visibility : 1);
    const d = dist(p.x, p.y, x, y);
    if (d > reach) return 0;
    const a = Math.abs(angleDiff(Math.atan2(y - p.y, x - p.x), p.aim));
    if (a > tolerance) return 0;
    const edge = 1 - smoothstep(tolerance * .62, tolerance, a) * .55;
    return (1 - d / reach) * edge;
  }

  function drawTreeLayer(view) {
    const trees = G.world.trees;
    for (let i = 0; i < trees.length; i++) {
      const t = trees[i];
      if (t.x < view.x - 210 || t.x > view.x + view.w + 210 || t.y < view.y - 200 || t.y > view.y + view.h + 120) continue;
      const sp = treeSprites[t.spriteIndex];
      if (!sp) continue;
      const s = t.spriteScale;
      const sway = Math.sin(G.envTime * .42 + t.phase) * 1.1;
      ctx.save();
      ctx.translate(t.x + sway, t.y);
      ctx.scale(t.spriteFlip * s, s);
      ctx.drawImage(sp.unlit, -sp.anchorX, -sp.anchorY, sp.size, sp.size);
      const lum = flashlightFactorAt(t.x, t.y - t.canopyLift, .82);
      if (lum > .025) {
        ctx.globalAlpha = Math.min(.92, lum * .96);
        ctx.drawImage(sp.lit, -sp.anchorX, -sp.anchorY, sp.size, sp.size);
      }
      ctx.restore();
    }
  }

  function drawCanopies(view) {
    const trees = G.world.trees;
    for (const t of trees) {
      if (t.x < view.x - 220 || t.x > view.x + view.w + 220 || t.y < view.y - 220 || t.y > view.y + view.h + 100) continue;
      const sway = Math.sin(G.envTime * .42 + t.phase) * 1.4;
      const lit = flashlightFactorAt(t.x, t.y - t.canopyLift, .82);
      // shadow pool
      ctx.save();
      ctx.globalAlpha = .26;
      ctx.fillStyle = '#010504';
      ctx.beginPath();
      ctx.ellipse(t.x, t.y + 3, t.canopyR * .75, t.canopyR * .22, 0, 0, TAU);
      ctx.fill();
      ctx.restore();

      if (t.type === 'broad') {
        ctx.save();
        ctx.translate(t.x + sway, t.y - t.canopyLift);
        const lum = Math.min(1, lit);
        const r = Math.round(16 + lum * 58);
        const g = Math.round(34 + lum * 84);
        const b = Math.round(23 + lum * 47);
        const base = `rgba(${r},${g},${b},.96)`;
        for (const c of t.clusters) {
          ctx.save();
          ctx.translate(c.dx, c.dy);
          ctx.rotate(c.rot);
          ctx.fillStyle = base;
          ctx.beginPath();
          ctx.ellipse(0, 0, c.rx, c.ry, 0, 0, TAU);
          ctx.fill();
          ctx.restore();
        }
        // moonlit upper surfaces
        for (let i = 0; i < t.clusters.length; i++) {
          const c = t.clusters[i];
          ctx.save();
          ctx.translate(c.dx - 3, c.dy - 4);
          ctx.rotate(c.rot);
          const r2 = Math.round(32 + lum * 70);
          const g2 = Math.round(60 + lum * 95);
          const b2 = Math.round(38 + lum * 55);
          ctx.fillStyle = `rgba(${r2},${g2},${b2},${.34 + lum * .34})`;
          ctx.beginPath();
          ctx.ellipse(0, 0, c.rx * .7, c.ry * .5, 0, 0, TAU);
          ctx.fill();
          ctx.restore();
        }
        // leaf clusters & speckles
        for (const s of t.speckles) {
          const r3 = Math.round(48 + lum * 80);
          const g3 = Math.round(74 + lum * 98);
          const b3 = Math.round(44 + lum * 55);
          ctx.fillStyle = `rgba(${r3},${g3},${b3},${.3 + lum * .3})`;
          ctx.beginPath();
          ctx.arc(s.dx, s.dy, s.r, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
      } else if (t.type === 'pine') {
        ctx.save();
        ctx.translate(t.x + sway, t.y - t.canopyLift * .62);
        const lum = Math.min(1, lit);
        const levels = 4;
        for (let i = 0; i < levels; i++) {
          const yy = i * t.canopyR * .32;
          const w = t.canopyR * (1.1 - i * .18);
          const h = t.canopyR * (.5 + i * .05);
          const rr = Math.round(15 + lum * 48);
          const gg = Math.round(32 + lum * 68);
          const bb = Math.round(21 + lum * 42);
          ctx.fillStyle = `rgba(${rr},${gg},${bb},${i < 2 ? .97 : .92})`;
          ctx.beginPath();
          ctx.moveTo(0, yy - h);
          ctx.lineTo(w, yy + h * .25);
          ctx.quadraticCurveTo(w * .3, yy + h * .1, 0, yy + h * .28);
          ctx.quadraticCurveTo(-w * .3, yy + h * .1, -w, yy + h * .25);
          ctx.closePath();
          ctx.fill();
        }
        ctx.strokeStyle = `rgba(104,134,102,${.08 + lum * .2})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-1, -t.canopyR * .45);
        ctx.lineTo(-1, t.canopyR * .6);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  function drawTrunks(view) {
    const list = G.world.trees.slice().sort((a, b) => a.y - b.y);
    for (const t of list) {
      if (t.x < view.x - 100 || t.x > view.x + view.w + 100 || t.y < view.y - 180 || t.y > view.y + view.h + 80) continue;
      const sway = Math.sin(G.envTime * .42 + t.phase) * .6;
      const h = t.trunkH;
      const w = t.collider * .78;
      const lum = Math.min(1, flashlightFactorAt(t.x, t.y - h * .45, .74));
      ctx.save();
      ctx.translate(t.x + sway, t.y);
      // roots
      ctx.strokeStyle = 'rgba(27,25,18,.9)';
      ctx.lineCap = 'round';
      for (const r of t.roots) {
        ctx.lineWidth = 2.2 + t.scale;
        ctx.beginPath();
        ctx.moveTo(0, -2);
        ctx.quadraticCurveTo(Math.cos(r.a) * r.len * .5, Math.sin(r.a) * r.len * .1, Math.cos(r.a) * r.len, Math.sin(r.a) * r.len * .23);
        ctx.stroke();
      }
      // trunk
      const g = ctx.createLinearGradient(-w, 0, w, 0);
      if (t.type === 'dead') {
        g.addColorStop(0, `rgb(${33 + lum * 42},${31 + lum * 38},${23 + lum * 26})`);
        g.addColorStop(.45, `rgb(${77 + lum * 64},${69 + lum * 55},${49 + lum * 34})`);
        g.addColorStop(1, `rgb(${20 + lum * 30},${21 + lum * 28},${15 + lum * 20})`);
      } else {
        g.addColorStop(0, `rgb(${27 + lum * 36},${29 + lum * 32},${20 + lum * 24})`);
        g.addColorStop(.42, `rgb(${Math.round((t.shade > .6 ? 87 : 71) + lum * 62)},${Math.round((t.shade > .6 ? 75 : 63) + lum * 54)},${Math.round(51 + lum * 33)})`);
        g.addColorStop(.75, `rgb(${49 + lum * 44},${45 + lum * 38},${32 + lum * 25})`);
        g.addColorStop(1, `rgb(${17 + lum * 27},${19 + lum * 25},${13 + lum * 18})`);
      }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-w, 0);
      ctx.bezierCurveTo(-w * .8, -h * .35, -w * .5, -h * .8, -w * .36, -h);
      ctx.lineTo(w * .3, -h);
      ctx.bezierCurveTo(w * .55, -h * .8, w * .9, -h * .35, w, 0);
      ctx.closePath();
      ctx.fill();
      // bark lines
      ctx.strokeStyle = 'rgba(13,14,9,.55)';
      ctx.lineWidth = 1;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * w * .28, -h * .12);
        ctx.quadraticCurveTo(i * w * .2 + 2, -h * .5, i * w * .3, -h * .9);
        ctx.stroke();
      }
      // moss at the base
      if (t.shade > .42) {
        ctx.fillStyle = 'rgba(62,82,46,.25)';
        ctx.beginPath();
        ctx.ellipse(-w * .3, -4, w * .6, 5 + t.scale * 2, -.2, 0, TAU);
        ctx.fill();
      }
      if (t.type === 'dead') {
        ctx.strokeStyle = '#2e2b20';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(0, -h);
        ctx.lineTo(w * 1.8, -h - 22);
        ctx.moveTo(w * .8, -h - 9);
        ctx.lineTo(w * 2.4, -h - 4);
        ctx.stroke();
      } else {
        // a few branches reach up into the canopy
        ctx.strokeStyle = t.type === 'pine' ? 'rgba(48,45,32,.8)' : 'rgba(59,52,35,.7)';
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.moveTo(0, -h * .78);
        ctx.lineTo(-w * 2.7, -h - 12);
        ctx.moveTo(0, -h * .55);
        ctx.lineTo(w * 2.2, -h - 4);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawRocksAndLogs(view) {
    for (const r of G.world.rocks) {
      if (r.x < view.x - 80 || r.x > view.x + view.w + 80 || r.y < view.y - 80 || r.y > view.y + view.h + 60) continue;
      ctx.save();
      ctx.translate(r.x, r.y);
      ctx.fillStyle = 'rgba(1,4,3,.36)';
      ctx.beginPath();
      ctx.ellipse(4, 6, r.r * 1.1, r.r * .42, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(r.points[0].x, r.points[0].y);
      for (let i = 1; i < r.points.length; i++) ctx.lineTo(r.points[i].x, r.points[i].y);
      ctx.closePath();
      ctx.fillStyle = r.shade < .4 ? '#384038' : r.shade < .75 ? '#444a3f' : '#303a34';
      ctx.fill();
      ctx.strokeStyle = 'rgba(120,130,109,.16)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = 'rgba(150,159,132,.11)';
      ctx.beginPath();
      ctx.ellipse(-r.r * .2, -r.r * .18, r.r * .4, r.r * .14, -.4, 0, TAU);
      ctx.fill();
      if (r.moss) {
        ctx.fillStyle = 'rgba(74,99,54,.28)';
        ctx.beginPath();
        ctx.ellipse(r.r * .2, r.r * .06, r.r * .36, r.r * .12, .4, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
    for (const l of G.world.logs) {
      if (l.x < view.x - 150 || l.x > view.x + view.w + 150 || l.y < view.y - 100 || l.y > view.y + view.h + 100) continue;
      ctx.save();
      ctx.translate(l.x, l.y);
      ctx.rotate(l.angle);
      ctx.fillStyle = 'rgba(1,4,3,.3)';
      ctx.beginPath();
      ctx.ellipse(3, 5, l.length / 2, l.r, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = l.shade < .5 ? '#2c2a1f' : '#383224';
      ctx.beginPath();
      ctx.roundRect(-l.length / 2, -l.r, l.length, l.r * 2, l.r);
      ctx.fill();
      ctx.strokeStyle = 'rgba(104,93,61,.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-l.length / 2 + 4, -l.r * .45);
      ctx.lineTo(l.length / 2 - 4, -l.r * .3);
      ctx.moveTo(-l.length / 2 + 8, l.r * .35);
      ctx.lineTo(l.length / 2 - 10, l.r * .5);
      ctx.stroke();
      if (l.moss) {
        ctx.fillStyle = 'rgba(62,86,49,.35)';
        ctx.beginPath();
        ctx.ellipse(-l.length * .15, -l.r * .24, l.length * .22, l.r * .32, 0, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawRavine(view) {
    const edges = G.world.ravineEdges;
    const visible = edges.filter(e => e.x > view.x - 80 && e.x < view.x + view.w + 80);
    if (!visible.length) return;
    const topAt = (e) => RAVINE_Y - RAVINE_HALF + e.top;
    const bottomAt = (e) => RAVINE_Y + RAVINE_HALF + e.bottom;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(visible[0].x, topAt(visible[0]));
    for (let i = 1; i < visible.length; i++) {
      const e = visible[i];
      const pe = visible[i - 1];
      ctx.quadraticCurveTo(pe.x + 17, topAt(pe), e.x, topAt(e));
    }
    for (let i = visible.length - 1; i >= 0; i--) {
      const e = visible[i];
      ctx.lineTo(e.x, bottomAt(e));
    }
    ctx.closePath();
    const g = ctx.createLinearGradient(0, RAVINE_Y - RAVINE_HALF, 0, RAVINE_Y + RAVINE_HALF);
    g.addColorStop(0, '#0d1710');
    g.addColorStop(.22, '#07100b');
    g.addColorStop(.5, '#010403');
    g.addColorStop(.78, '#050b08');
    g.addColorStop(1, '#101810');
    ctx.fillStyle = g;
    ctx.fill();

    // cliff lips
    ctx.strokeStyle = 'rgba(120,128,92,.38)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(visible[0].x, topAt(visible[0]));
    for (let i = 1; i < visible.length; i++) ctx.lineTo(visible[i].x, topAt(visible[i]));
    ctx.stroke();
    ctx.strokeStyle = 'rgba(151,154,108,.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(visible[0].x, topAt(visible[0]) + 2);
    for (let i = 1; i < visible.length; i++) ctx.lineTo(visible[i].x, topAt(visible[i]) + 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(105,117,86,.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(visible[0].x, bottomAt(visible[0]));
    for (let i = 1; i < visible.length; i++) ctx.lineTo(visible[i].x, bottomAt(visible[i]));
    ctx.stroke();

    // rough rock teeth
    for (let i = 2; i < visible.length - 1; i += 2) {
      const e = visible[i];
      const pe = visible[i - 1];
      ctx.fillStyle = i % 3 === 0 ? '#1b2118' : '#131a13';
      ctx.beginPath();
      ctx.moveTo(pe.x, topAt(pe) + 2);
      ctx.lineTo(e.x + 4, topAt(e) + 2);
      ctx.lineTo(e.x - 5, topAt(e) + 9 + (i % 5) * 2);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(pe.x, bottomAt(pe) - 2);
      ctx.lineTo(e.x + 4, bottomAt(e) - 2);
      ctx.lineTo(e.x - 6, bottomAt(e) - 8 - (i % 4) * 2);
      ctx.closePath();
      ctx.fill();
    }
    // roots dangling from the south lip
    ctx.strokeStyle = 'rgba(43,45,29,.5)';
    ctx.lineWidth = 1;
    for (let i = 3; i < visible.length; i += 6) {
      const e = visible[i];
      const x = e.x + 5;
      const y = topAt(e) + 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 4, y + 12, x - 4, y + 22, x + 2, y + 34 + (i % 9));
      ctx.stroke();
    }
    ctx.restore();

    // southern anchor post + coiled rope
    const b = G.world.bridge;
    ctx.save();
    ctx.translate(b.anchorX, b.anchorY);
    ctx.fillStyle = 'rgba(1,4,3,.4)';
    ctx.beginPath();
    ctx.ellipse(2, 5, 18, 6, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#3c3323';
    ctx.fillRect(-4, -50, 8, 52);
    ctx.fillStyle = '#575039';
    ctx.fillRect(-6, -52, 12, 4);
    ctx.fillStyle = '#b18b4f';
    ctx.beginPath();
    ctx.arc(0, -62, 5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(246,192,105,.55)';
    ctx.beginPath();
    ctx.arc(0, -62, 2.6, 0, TAU);
    ctx.fill();
    if (!b.secured) {
      ctx.strokeStyle = '#a78c58';
      ctx.lineWidth = 2.3;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(15, 1, 10 - i * 2, 4.5 - i, .2, 0, TAU);
        ctx.stroke();
      }
      ctx.fillStyle = '#2c291d';
      ctx.fillRect(11, -10, 18, 15);
      ctx.strokeStyle = 'rgba(180,154,99,.45)';
      ctx.strokeRect(11, -10, 18, 15);
    }
    ctx.restore();
  }

  function drawBridge() {
    const b = G.world.bridge;
    if (!b.secured) return;
    const south = RAVINE_Y + RAVINE_HALF + 6;
    const north = RAVINE_Y - RAVINE_HALF - 6;
    ctx.save();
    // sagging side ropes
    ctx.strokeStyle = '#a08b5d';
    ctx.lineWidth = 2.1;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(b.x + side * b.half, south);
      ctx.quadraticCurveTo(b.x + side * b.half * 1.04, RAVINE_Y + 7, b.x + side * b.half, north);
      ctx.stroke();
    }
    // planks
    const count = 15;
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const y = lerp(south, north, t);
      const sag = Math.sin(t * Math.PI) * 4;
      const x = b.x + Math.sin(t * 10 + G.envTime * .8) * .8;
      ctx.save();
      ctx.translate(x, y + sag);
      ctx.rotate(Math.sin(t * 6) * .025);
      ctx.fillStyle = i % 3 === 0 ? '#6c5937' : i % 2 === 0 ? '#59492f' : '#655236';
      ctx.fillRect(-b.half + 11, -4, (b.half - 11) * 2, 7.4);
      ctx.fillStyle = 'rgba(26,22,14,.45)';
      ctx.fillRect(-b.half + 15, 1, (b.half - 15) * 2, 1.3);
      ctx.restore();
    }
    // handrails
    ctx.strokeStyle = 'rgba(172,151,103,.5)';
    ctx.lineWidth = 1.4;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(b.x + side * (b.half - 7), south + 3);
      ctx.quadraticCurveTo(b.x + side * (b.half - 16), RAVINE_Y + 10, b.x + side * (b.half - 7), north - 3);
      ctx.stroke();
    }
    // north anchor post
    ctx.fillStyle = '#3c3323';
    ctx.fillRect(b.x - 4, north - 46, 8, 48);
    ctx.fillStyle = '#575039';
    ctx.fillRect(b.x - 6, north - 48, 12, 4);
    ctx.restore();
  }

  function drawGoalRoad(view) {
    if (view.y > 500) return;
    const y1 = 190;
    const y2 = 370;
    ctx.save();
    ctx.fillStyle = 'rgba(45,42,29,.68)';
    ctx.fillRect(view.x - 20, y1, view.w + 40, y2 - y1);
    ctx.strokeStyle = 'rgba(77,70,48,.22)';
    ctx.lineWidth = 13;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      const yy = 228 + i * 34;
      ctx.moveTo(view.x - 20, yy);
      for (let x = view.x - 20; x < view.x + view.w + 40; x += 80) {
        ctx.quadraticCurveTo(x + 40, yy + Math.sin(x * .02 + i) * 4, x + 80, yy);
      }
      ctx.stroke();
    }
    // roadside posts
    const gate = G.world.goals.gateX;
    for (let x = -80; x <= WORLD_W + 80; x += 170) {
      if (Math.abs(x - gate) < 125) continue;
      if (x < view.x - 40 || x > view.x + view.w + 40) continue;
      ctx.fillStyle = '#2f2b1e';
      ctx.fillRect(x - 3, 358, 6, 30);
      ctx.fillStyle = '#4a4230';
      ctx.fillRect(x - 5, 351, 10, 6);
    }
    // gate arch
    const postL = gate - 108;
    const postR = gate + 108;
    const gy = 365;
    ctx.fillStyle = 'rgba(1,4,3,.4)';
    ctx.beginPath();
    ctx.ellipse(gate, gy + 5, 130, 16, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#332e20';
    ctx.fillRect(postL - 5, gy - 100, 11, 102);
    ctx.fillRect(postR - 5, gy - 100, 11, 102);
    ctx.fillStyle = '#4b422c';
    ctx.fillRect(postL - 17, gy - 111, 132, 12);
    ctx.fillRect(postR - 115, gy - 111, 132, 12);
    ctx.fillStyle = 'rgba(23,21,14,.9)';
    ctx.fillRect(gate - 86, gy - 98, 172, 44);
    ctx.strokeStyle = 'rgba(173,143,88,.33)';
    ctx.lineWidth = 1;
    ctx.strokeRect(gate - 86, gy - 98, 172, 44);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(219,199,158,.85)';
    ctx.font = '600 16px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.fillText('北 侧 林 道', gate, gy - 73);
    ctx.font = '8px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(190,167,121,.55)';
    ctx.fillText('NORTH ROAD  ·  END OF THE FOREST', gate, gy - 61);
    // lanterns
    for (const x of [postL, postR]) {
      ctx.fillStyle = 'rgba(228,167,89,.7)';
      ctx.beginPath();
      ctx.arc(x, gy - 70, 4, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#5b4d32';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, gy - 97);
      ctx.lineTo(x, gy - 76);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawLevelGoal(view) {
    const goal = G.world.goals;
    const y = goal.y;
    const x = goal.x;
    if (x < view.x - 260 || x > view.x + view.w + 260 || y < view.y - 220 || y > view.y + view.h + 220) return;
    const lv = levelData();
    const ch = chapterData();
    const pulse = .72 + Math.sin(G.envTime * 2.8) * .18;
    ctx.save();
    // a warm clearing at the level threshold
    const glow = ctx.createRadialGradient(x, y, 4, x, y, 150);
    glow.addColorStop(0, `rgba(234,178,102,${.18 * pulse})`);
    glow.addColorStop(.45, `rgba(210,147,75,${.06 * pulse})`);
    glow.addColorStop(1, 'rgba(210,147,75,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 160, y - 120, 320, 240);
    // ground mark
    ctx.strokeStyle = `rgba(224,169,95,${.22 * pulse})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(x, y + 8, 66, 19, 0, 0, TAU);
    ctx.stroke();
    // two modest posts frame the trail
    ctx.fillStyle = '#332e20';
    ctx.fillRect(x - 58, y - 82, 6, 90);
    ctx.fillRect(x + 52, y - 82, 6, 90);
    ctx.fillStyle = '#51452d';
    ctx.fillRect(x - 68, y - 86, 136, 8);
    ctx.fillRect(x - 63, y - 90, 16, 5);
    ctx.fillRect(x + 47, y - 90, 16, 5);
    // hanging lamps
    for (const lx of [x - 55, x + 55]) {
      ctx.strokeStyle = '#5b4d32';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lx, y - 63);
      ctx.lineTo(lx, y - 46);
      ctx.stroke();
      ctx.fillStyle = `rgba(255,196,110,${.82 * pulse})`;
      ctx.beginPath();
      ctx.arc(lx, y - 42, 4.2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = `rgba(245,167,83,${.14 * pulse})`;
      ctx.beginPath();
      ctx.arc(lx, y - 42, 13, 0, TAU);
      ctx.fill();
    }
    // sign
    ctx.fillStyle = 'rgba(15,16,11,.94)';
    ctx.fillRect(x - 82, y - 132, 164, 45);
    ctx.strokeStyle = `rgba(212,172,104,${.52 * pulse})`;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x - 82, y - 132, 164, 45);
    ctx.fillStyle = 'rgba(37,31,19,.96)';
    ctx.fillRect(x - 74, y - 125, 148, 31);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(241,218,171,.96)';
    ctx.font = '600 16px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.fillText(ch.goal, x, y - 105);
    ctx.fillStyle = 'rgba(218,191,139,.66)';
    ctx.font = '8px "Segoe UI", sans-serif';
    ctx.fillText(`LEVEL ${String(lv.num).padStart(2, '0')} / 30 · ${ch.tag}`, x, y - 91);
    // ropes holding the sign to the crossbeam
    ctx.strokeStyle = 'rgba(160,139,93,.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 48, y - 132);
    ctx.lineTo(x - 48, y - 92);
    ctx.moveTo(x + 48, y - 132);
    ctx.lineTo(x + 48, y - 92);
    ctx.stroke();
    ctx.restore();
  }

  function drawCamp(view) {
    const f = G.world.campfire;
    const t = G.world.tent;
    if (f.x < view.x - 250 || f.x > view.x + view.w + 250 || f.y < view.y - 250 || f.y > view.y + view.h + 250) return;
    ctx.save();
    // tent
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.angle);
    ctx.fillStyle = 'rgba(1,4,3,.38)';
    ctx.beginPath();
    ctx.ellipse(0, 18, 68, 19, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#333c2b';
    ctx.beginPath();
    ctx.moveTo(-58, 19);
    ctx.lineTo(0, -54);
    ctx.lineTo(62, 20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#171e17';
    ctx.beginPath();
    ctx.moveTo(-10, 17);
    ctx.lineTo(20, -27);
    ctx.lineTo(47, 18);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(169,174,133,.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -54);
    ctx.lineTo(0, 18);
    ctx.moveTo(-58, 19);
    ctx.lineTo(62, 20);
    ctx.stroke();
    // stakes
    ctx.fillStyle = '#5d5238';
    for (const [sx, sy] of [[-58, 19], [62, 20], [0, -55]]) {
      ctx.fillRect(sx - 2, sy - 2, 4, 7);
    }
    ctx.restore();
    // fire ring
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * TAU;
      const x = f.x + Math.cos(a) * 25;
      const y = f.y + Math.sin(a) * 12;
      ctx.fillStyle = i % 2 ? '#3d4032' : '#4b4b3a';
      ctx.beginPath();
      ctx.ellipse(x, y, 6, 4, a, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = '#3b2e1d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(f.x - 15, f.y + 5);
    ctx.lineTo(f.x + 15, f.y - 3);
    ctx.moveTo(f.x - 11, f.y - 5);
    ctx.lineTo(f.x + 12, f.y + 6);
    ctx.stroke();
    // log seat
    ctx.fillStyle = '#3a3223';
    ctx.beginPath();
    ctx.roundRect(f.x - 74, f.y + 20, 54, 12, 6);
    ctx.fill();
    ctx.fillStyle = 'rgba(125,113,74,.18)';
    ctx.beginPath();
    ctx.ellipse(f.x - 44, f.y + 23, 24, 2, 0, 0, TAU);
    ctx.fill();
    // low embers
    ctx.fillStyle = 'rgba(212,107,46,.35)';
    ctx.beginPath();
    ctx.ellipse(f.x, f.y, 13, 5, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawSigns(view) {
    drawSign(G.world.startSign, '北 · 林道', `LEVEL ${String(levelData().num).padStart(2, '0')} / 30 · NORTH ROAD`, false, view);
    drawSign(G.world.bridgeSign, '断 崖', 'ROPE ANCHOR  →', true, view);
  }

  function drawSign(sign, line1, line2, warn, view) {
    if (sign.x < view.x - 160 || sign.x > view.x + view.w + 160 || sign.y < view.y - 160 || sign.y > view.y + view.h + 160) return;
    ctx.save();
    ctx.translate(sign.x, sign.y);
    ctx.rotate(sign.angle || 0);
    ctx.fillStyle = 'rgba(1,4,3,.35)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 25, 6, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#3c3324';
    ctx.fillRect(-3, -52, 6, 54);
    ctx.fillStyle = warn ? '#4a3725' : '#3d3a28';
    ctx.fillRect(-58, -88, 116, 42);
    ctx.strokeStyle = warn ? 'rgba(196,131,67,.45)' : 'rgba(164,154,111,.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-58, -88, 116, 42);
    ctx.textAlign = 'center';
    ctx.fillStyle = warn ? 'rgba(227,178,113,.9)' : 'rgba(217,205,166,.78)';
    ctx.font = '600 14px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.fillText(line1, 0, -66);
    ctx.font = '7px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(182,171,133,.52)';
    ctx.fillText(line2, 0, -53);
    ctx.restore();
  }

  function drawInteractables(view) {
    const c = G.world.cache;
    if (c && c.x > view.x - 100 && c.x < view.x + view.w + 100 && c.y > view.y - 100 && c.y < view.y + view.h + 100) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.fillStyle = 'rgba(1,4,3,.4)';
      ctx.beginPath();
      ctx.ellipse(2, 8, 22, 8, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = c.opened ? '#302b1e' : '#413624';
      ctx.fillRect(-19, -15, 38, 28);
      ctx.strokeStyle = c.opened ? 'rgba(123,110,74,.35)' : 'rgba(181,150,92,.4)';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-19, -15, 38, 28);
      if (c.opened) {
        ctx.fillStyle = '#1a1a13';
        ctx.fillRect(-17, -16, 34, 7);
        ctx.save();
        ctx.translate(-19, -16);
        ctx.rotate(-.25);
        ctx.fillStyle = '#4a3d27';
        ctx.fillRect(0, 0, 34, 7);
        ctx.restore();
      } else {
        ctx.strokeStyle = 'rgba(77,102,57,.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-21, -18);
        ctx.bezierCurveTo(-8, -4, 4, -24, 20, -8);
        ctx.moveTo(-4, -28);
        ctx.bezierCurveTo(4, -18, -6, -2, 12, 2);
        ctx.stroke();
      }
      ctx.restore();
    }
    for (const item of G.world.pickups) {
      if (item.taken) continue;
      if (item.x < view.x - 60 || item.x > view.x + view.w + 60 || item.y < view.y - 60 || item.y > view.y + view.h + 60) continue;
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.fillStyle = 'rgba(1,4,3,.4)';
      ctx.beginPath();
      ctx.ellipse(0, 5, 13, 5, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#d9cdb4';
      ctx.fillRect(-9, -7, 18, 13);
      ctx.fillStyle = '#9b3f38';
      ctx.fillRect(-2, -5, 4, 9);
      ctx.fillRect(-5, -2, 10, 3);
      ctx.strokeStyle = 'rgba(20,20,14,.5)';
      ctx.strokeRect(-9, -7, 18, 13);
      ctx.restore();
    }
  }

  function drawEntities(view) {
    drawSprintAura();
    for (const ghost of G.ghosts) {
      if (ghost.x < view.x - 80 || ghost.x > view.x + view.w + 80 || ghost.y < view.y - 80 || ghost.y > view.y + view.h + 80) continue;
      drawGhost(ghost);
    }
    const list = [];
    for (const a of G.world.animals) {
      if (a.dead && a.deadT > 24) continue;
      if (a.x < view.x - 100 || a.x > view.x + view.w + 100 || a.y < view.y - 100 || a.y > view.y + view.h + 100) continue;
      list.push({ y: a.y, kind: 'animal', a });
    }
    list.push({ y: G.player.y, kind: 'player' });
    list.sort((a, b) => a.y - b.y);
    for (const item of list) {
      if (item.kind === 'player') drawPlayer();
      else drawAnimal(item.a);
    }
  }

  function drawGhostGlow(camX, camY) {
    if (!G.ghosts.length) return;
    const p = G.player;
    if (!p) return;
    const sp = p.sprintBlend || 0;
    if (sp < .12) return;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < G.ghosts.length; i++) {
      const g = G.ghosts[i];
      const a = clamp(g.life / g.maxLife, 0, 1) * .28 * sp;
      if (a <= .01) continue;
      const x = g.x - camX;
      const y = g.y - camY;
      if (x < -40 || x > viewW + 40 || y < -40 || y > viewH + 40) continue;
      ctx.fillStyle = `rgba(170, 214, 158, ${a})`;
      ctx.beginPath();
      ctx.ellipse(x, y - 2, 10, 8, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = `rgba(226, 214, 166, ${a * .9})`;
      ctx.beginPath();
      ctx.arc(x + Math.cos(g.face) * 8, y + Math.sin(g.face) * 8, 3.2, 0, TAU);
      ctx.fill();
    }
    // a thin wake connecting the afterimages
    if (G.ghosts.length > 1) {
      const first = G.ghosts[0];
      const last = G.ghosts[G.ghosts.length - 1];
      const grad = ctx.createLinearGradient(first.x - camX, first.y - camY, last.x - camX, last.y - camY);
      grad.addColorStop(0, 'rgba(160,205,150,0)');
      grad.addColorStop(1, `rgba(194,223,177,${.1 * sp})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(first.x - camX, first.y - camY - 3);
      ctx.lineTo(last.x - camX, last.y - camY - 3);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSprintAura() {
    const p = G.player;
    if (!p || p.dead) return;
    const sp = p.sprintBlend || 0;
    if (sp < .06) return;
    const a = p.lastMoveAngle || p.face;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.translate(p.x, p.y);
    ctx.rotate(a);
    for (let i = 0; i < 7; i++) {
      const back = 14 + i * 9;
      const alpha = (1 - i / 7) * .12 * sp;
      ctx.fillStyle = `rgba(178, 204, 165, ${alpha})`;
      ctx.beginPath();
      ctx.ellipse(-back, Math.sin(i * 1.9 + G.envTime * 8) * 3, 18 + i * 2, 7 - i * .55, 0, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < 9; i++) {
      const off = (i - 4) * 3.4;
      const len = 38 + (i % 3) * 22;
      ctx.strokeStyle = `rgba(196, 218, 178, ${(.04 + (i % 3) * .025) * sp})`;
      ctx.lineWidth = .8;
      ctx.beginPath();
      ctx.moveTo(-18, off);
      ctx.lineTo(-18 - len, off + (i % 2 ? 1 : -1));
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawGhost(g) {
    const a = clamp(g.life / g.maxLife, 0, 1);
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a * .34;
    ctx.translate(g.x, g.y);
    ctx.rotate(g.face);
    ctx.scale(1.45, 1.45);
    ctx.fillStyle = 'rgba(158, 193, 146, .8)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 9, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(212, 191, 143, .8)';
    ctx.beginPath();
    ctx.arc(10.4, -2, 4.2, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(178, 201, 159, .7)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-5, 4);
    ctx.lineTo(-8 + Math.sin(g.walk) * 7, 12);
    ctx.moveTo(5, 4);
    ctx.lineTo(7 - Math.sin(g.walk) * 7, 12);
    ctx.stroke();
    ctx.restore();
  }

  function drawAnimal(a) {
    const cfg = ANIMAL_TYPES[a.type];
    const alpha = a.dead ? clamp(1 - a.deadT / 24, 0, 1) : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    // shadow
    ctx.fillStyle = 'rgba(1,4,3,.42)';
    ctx.beginPath();
    ctx.ellipse(a.x + 3, a.y + 7, a.radius * 1.35, a.radius * .48, 0, 0, TAU);
    ctx.fill();
    // telegraph ring
    if (!a.dead && (a.state === 'windup' || a.state === 'chargeWind')) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.strokeStyle = `rgba(212,104,76,${.35 + Math.sin(G.envTime * 18) * .18})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, a.radius + 13, (a.radius + 13) * .47, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    if (!a.dead && a.state === 'charge') {
      ctx.strokeStyle = 'rgba(203,147,91,.18)';
      ctx.lineWidth = 2;
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(a.x - Math.cos(a.face) * (i * 17), a.y - Math.sin(a.face) * (i * 17) + 3);
        ctx.lineTo(a.x - Math.cos(a.face) * (i * 17 + 12), a.y - Math.sin(a.face) * (i * 17 + 12) + 3);
        ctx.stroke();
      }
    }
    if (!a.dead && a.aggro) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.strokeStyle = `rgba(185,76,60,${.1 + Math.sin(G.envTime * 3.4 + a.phase) * .045})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(0, 3, a.radius + 15, (a.radius + 15) * .43, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    ctx.translate(a.x, a.y);
    ctx.rotate(a.face);
    ctx.scale(1.14, 1.14);
    if (a.hitFlash > 0) ctx.globalAlpha = alpha * (.7 + Math.sin(G.envTime * 50) * .2);
    if (a.type === 'wolf') drawWolf(a);
    else if (a.type === 'boar') drawBoar(a);
    else drawSnake(a);
    ctx.restore();

    // health pip
    if (!a.dead && a.hp < a.maxHp) {
      const p = G.player;
      const visible = inFlashCone(a.x, a.y, .7, 500) || dist(a.x, a.y, p.x, p.y) < 130;
      if (visible) {
        const w = 30;
        const x = a.x - w / 2;
        const y = a.y - (a.type === 'boar' ? 42 : 34);
        ctx.fillStyle = 'rgba(0,0,0,.5)';
        ctx.fillRect(x, y, w, 3);
        ctx.fillStyle = '#b74840';
        ctx.fillRect(x, y, w * clamp(a.hp / a.maxHp, 0, 1), 3);
      }
    }
  }

  function drawWolf(a) {
    const gait = a.state === 'idle' ? 0 : Math.sin(a.phase * 2.2) * 2.3;
    const flash = a.hitFlash > 0;
    // tail
    ctx.strokeStyle = flash ? '#dcd4c2' : '#4d554e';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-18, -1);
    ctx.quadraticCurveTo(-32, -5 + Math.sin(a.phase) * 3, -37, -11 + Math.sin(a.phase) * 4);
    ctx.stroke();
    // legs
    ctx.strokeStyle = flash ? '#d8d2c1' : '#3b433e';
    ctx.lineWidth = 3.1;
    for (const [x, side] of [[-9, -1], [-8, 1], [9, -1], [10, 1]]) {
      ctx.beginPath();
      ctx.moveTo(x, side * 5);
      ctx.lineTo(x + gait * side, side * 13);
      ctx.stroke();
    }
    // body
    const g = ctx.createLinearGradient(0, -10, 0, 10);
    g.addColorStop(0, flash ? '#e9e0cd' : '#727a72');
    g.addColorStop(.6, flash ? '#cfc4ae' : '#565f58');
    g.addColorStop(1, flash ? '#b2a793' : '#353d37');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, 21, 10, 0, 0, TAU);
    ctx.fill();
    // shoulder + head
    ctx.fillStyle = flash ? '#e3d9c5' : '#60695f';
    ctx.beginPath();
    ctx.ellipse(14, -1, 10, 8, -.05, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(21, -2, 8.5, 6.2, .12, 0, TAU);
    ctx.fill();
    // ears
    ctx.fillStyle = '#3d453f';
    ctx.beginPath();
    ctx.moveTo(18, -7);
    ctx.lineTo(20, -15);
    ctx.lineTo(24, -6);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(23, -6);
    ctx.lineTo(27, -13);
    ctx.lineTo(28, -4);
    ctx.closePath();
    ctx.fill();
    // snout
    ctx.fillStyle = '#292f2b';
    ctx.beginPath();
    ctx.ellipse(29, 1, 4.5, 2.6, 0, 0, TAU);
    ctx.fill();
    // ruff / ribs
    ctx.strokeStyle = 'rgba(18,23,20,.5)';
    ctx.lineWidth = .9;
    ctx.beginPath();
    ctx.moveTo(2, -7);
    ctx.lineTo(4, 6);
    ctx.moveTo(-4, -7);
    ctx.lineTo(-3, 6);
    ctx.stroke();
    if (a.state === 'windup') {
      ctx.fillStyle = 'rgba(232,168,102,.7)';
      ctx.beginPath();
      ctx.arc(20, -1, 1.8, 0, TAU);
      ctx.fill();
    }
  }

  function drawBoar(a) {
    const gait = a.state === 'idle' ? 0 : Math.sin(a.phase * 1.8) * 1.8;
    const flash = a.hitFlash > 0;
    ctx.strokeStyle = flash ? '#d8ccb8' : '#3f352a';
    ctx.lineWidth = 4.5;
    for (const [x, side] of [[-12, -1], [-11, 1], [8, -1], [9, 1]]) {
      ctx.beginPath();
      ctx.moveTo(x, side * 7);
      ctx.lineTo(x + gait * side, side * 15);
      ctx.stroke();
    }
    const g = ctx.createLinearGradient(0, -14, 0, 14);
    g.addColorStop(0, flash ? '#e7dcc8' : '#78624e');
    g.addColorStop(.55, flash ? '#cbbca5' : '#554437');
    g.addColorStop(1, flash ? '#a99982' : '#30251e');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, 25, 14, 0, 0, TAU);
    ctx.fill();
    // bristles
    ctx.strokeStyle = 'rgba(34,26,20,.72)';
    ctx.lineWidth = 1.2;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 5, -12);
      ctx.lineTo(i * 5 - 2, -18 - (i % 2) * 2);
      ctx.stroke();
    }
    // head
    ctx.fillStyle = flash ? '#d9ccb6' : '#46382c';
    ctx.beginPath();
    ctx.ellipse(22, 1, 12, 10, -.12, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(31, 2, 7, 5, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#2c241d';
    ctx.beginPath();
    ctx.ellipse(35, 3, 2.4, 1.8, 0, 0, TAU);
    ctx.fill();
    // tusks
    ctx.strokeStyle = '#d8c8a6';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(29, 7);
    ctx.quadraticCurveTo(35, 11, 37, 4);
    ctx.moveTo(28, -4);
    ctx.quadraticCurveTo(34, -9, 37, -1);
    ctx.stroke();
    // ear
    ctx.fillStyle = '#3c3025';
    ctx.beginPath();
    ctx.moveTo(15, -9);
    ctx.lineTo(19, -16);
    ctx.lineTo(23, -7);
    ctx.closePath();
    ctx.fill();
  }

  function drawSnake(a) {
    const flash = a.hitFlash > 0;
    const s = Math.sin(a.phase * .75);
    ctx.strokeStyle = flash ? '#e0d7b9' : '#46513f';
    ctx.lineCap = 'round';
    ctx.lineWidth = 6.5;
    ctx.beginPath();
    ctx.moveTo(-19, 1);
    ctx.bezierCurveTo(-12, -9 + s * 2, -2, 10 - s * 2, 8, -1);
    ctx.bezierCurveTo(12, -5, 15, -4, 18, -2);
    ctx.stroke();
    ctx.strokeStyle = flash ? '#fff5cf' : 'rgba(137,145,105,.4)';
    ctx.lineWidth = 1.2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.arc(i * 6, Math.sin(i * 1.7 + a.phase) * 4, 1.6, 0, TAU);
      ctx.stroke();
    }
    ctx.fillStyle = flash ? '#efe5c4' : '#5a624b';
    ctx.beginPath();
    ctx.ellipse(20, -2, 5, 3.6, -.2, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#2e3428';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(23, -2);
    ctx.lineTo(27, -3);
    ctx.moveTo(23, -1);
    ctx.lineTo(27, 1);
    ctx.stroke();
  }

  function drawPlayer() {
    const p = G.player;
    if (!p) return;
    const sp = p.sprintBlend || 0;
    const move = p.moveBlend || 0;
    const gait = p.walk;
    const bob = Math.abs(Math.sin(gait)) * (1.2 + sp * 1.2) * move;
    ctx.save();
    ctx.globalAlpha = p.dead ? .8 : 1;
    // shadow stays on the ground while the body bobs
    ctx.fillStyle = 'rgba(1,4,3,.5)';
    ctx.beginPath();
    ctx.ellipse(p.x + 2, p.y + 10, 20 + sp * 5, 8 + sp * 1.8, 0, 0, TAU);
    ctx.fill();

    if (p.dead) {
      ctx.translate(p.x, p.y);
      ctx.rotate(p.face + Math.PI / 2);
      ctx.scale(1.55, 1.55);
      ctx.strokeStyle = '#242a20';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-5, 4); ctx.lineTo(-13, 9);
      ctx.moveTo(5, 4); ctx.lineTo(13, 10);
      ctx.stroke();
      ctx.fillStyle = '#3a3526';
      ctx.beginPath(); ctx.roundRect(-12, -6, 13, 12, 4); ctx.fill();
      ctx.fillStyle = '#3c4a3a';
      ctx.beginPath(); ctx.ellipse(0, 0, 11, 9, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#303b2d';
      ctx.beginPath(); ctx.arc(8.9, -3, 6.1, 0, TAU); ctx.fill();
      ctx.restore();
      return;
    }

    ctx.translate(p.x, p.y + bob);
    ctx.rotate(p.face + (p.bank || 0));
    const lean = sp * 2.4 + move * .8;
    ctx.translate(lean, 0);
    ctx.scale(1.8 * (1 - sp * .02), 1.8 * (1 + sp * .04));

    const drawLeg = (side, phase) => {
      const swing = Math.sin(phase) * (5.2 + sp * 3.8) * (0.35 + move * .65);
      const lift = Math.max(0, Math.cos(phase)) * (1.3 + sp * 2.2) * move;
      const hx = -3.2, hy = side * 4.7;
      const kx = -6.3 + swing * .42, ky = side * 5.9;
      const fx = -11.2 + swing, fy = side * 6.8 + lift;
      ctx.strokeStyle = side < 0 ? '#333d2d' : '#4b5741';
      ctx.lineWidth = 4.7;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(kx, ky); ctx.stroke();
      ctx.strokeStyle = side < 0 ? '#3c4834' : '#59664c';
      ctx.lineWidth = 3.4;
      ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
      ctx.fillStyle = '#20251a';
      ctx.beginPath(); ctx.ellipse(fx, fy + 1, 3.2, 2.1, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(214,204,162,.22)';
      ctx.lineWidth = .7;
      ctx.stroke();
      return { x: fx, y: fy };
    };
    const drawArm = (side, phase) => {
      const swing = Math.sin(phase) * (3.8 + sp * 3.4) * move;
      const sx = 2.5, sy = side * 6.4;
      const ex = 7.2 + swing * .55, ey = side * 8.5;
      const hx = 10.6 + swing, hy = side * 9.6;
      ctx.strokeStyle = '#3b4637';
      ctx.lineWidth = 3.1;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.fillStyle = '#b0845d';
      ctx.beginPath(); ctx.arc(hx, hy, 1.8, 0, TAU); ctx.fill();
      return { x: hx, y: hy };
    };

    // back limbs first; the near-side limbs are drawn after the coat
    drawLeg(-1, gait + Math.PI);
    drawLeg(1, gait);
    const backArm = drawArm(-1, gait);

    // backpack sits behind the shoulders and bounces with the stride
    const packBounce = Math.sin(gait * 2) * .55 * move;
    ctx.fillStyle = '#3a3526';
    ctx.beginPath(); ctx.roundRect(-14 + packBounce, -6, 13, 12, 4); ctx.fill();
    ctx.fillStyle = 'rgba(150,132,87,.2)';
    ctx.fillRect(-12 + packBounce, -4, 8, 2);
    ctx.strokeStyle = 'rgba(190,176,130,.18)';
    ctx.lineWidth = .8;
    ctx.beginPath(); ctx.moveTo(-12 + packBounce, 3); ctx.lineTo(-2 + packBounce, 3); ctx.stroke();

    // torso — a small twist and side sway sell the weight shift
    ctx.save();
    ctx.rotate(Math.sin(gait) * .028 * move);
    const coat = ctx.createLinearGradient(-8, -8, 8, 8);
    coat.addColorStop(0, p.hurtT > 0 ? '#8c5a48' : '#56644d');
    coat.addColorStop(.55, p.hurtT > 0 ? '#6e3f35' : '#3c4a3a');
    coat.addColorStop(1, '#263127');
    ctx.fillStyle = coat;
    ctx.beginPath(); ctx.ellipse(0, 0, 11, 9, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(236,226,190,.34)';
    ctx.lineWidth = .9;
    ctx.stroke();
    // shoulder seam
    ctx.strokeStyle = 'rgba(18,24,18,.35)';
    ctx.beginPath(); ctx.moveTo(4, -6); ctx.lineTo(5, 6); ctx.stroke();
    ctx.restore();

    // scarf trails against the direction of travel
    ctx.strokeStyle = '#7c4f39';
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(4, 2);
    const scarf = 9 + sp * 10 + move * 3;
    ctx.bezierCurveTo(-2, 6 + Math.sin(gait) * 2, -scarf * .55, 5 + Math.sin(gait + 1) * 2.5, -scarf, 4 + Math.sin(gait + 2) * 3);
    ctx.stroke();
    ctx.fillStyle = '#8e5d45';
    ctx.beginPath(); ctx.ellipse(6, -1, 4.5, 3.5, 0, 0, TAU); ctx.fill();

    // front arm and head
    const frontArm = drawArm(1, gait + Math.PI);
    ctx.fillStyle = '#b98d66';
    ctx.beginPath(); ctx.arc(10.4, -2, 4.15, 0, TAU); ctx.fill();
    ctx.fillStyle = '#303b2d';
    ctx.beginPath(); ctx.arc(8.9, -3, 6.1, 0, TAU); ctx.fill();
    ctx.fillStyle = '#b98d66';
    ctx.beginPath(); ctx.arc(11, -1.7, 3.6, -.92, .92); ctx.fill();
    ctx.strokeStyle = 'rgba(172,193,145,.4)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(8.9, -3, 5.5, Math.PI * 1.08, Math.PI * 1.78); ctx.stroke();
    ctx.fillStyle = 'rgba(25,27,20,.75)';
    ctx.beginPath(); ctx.arc(12.6, -1.4, .8, 0, TAU); ctx.fill();

    // flashlight is held in the front hand and still aims independently of the body
    const handSwing = Math.sin(gait + Math.PI) * (2.4 + sp * 2.2) * move;
    ctx.save();
    ctx.translate(15, 8 - handSwing);
    ctx.rotate(p.aim - p.face);
    ctx.fillStyle = '#20231d';
    ctx.fillRect(-2, -2.4, 9, 4.8);
    ctx.fillStyle = p.lightOn ? '#ffdd9b' : '#565044';
    ctx.fillRect(7, -2.1, 2, 4.2);
    ctx.restore();
    // knife
    if (p.attackT > 0) {
      const t = 1 - p.attackT / .23;
      const a = (t - .5) * 1.5;
      ctx.save();
      ctx.rotate(p.aim - p.face + a);
      ctx.strokeStyle = '#d8d2bc';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(13, -5); ctx.lineTo(28, -8); ctx.stroke();
      ctx.strokeStyle = '#4d3e2a';
      ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(10, -4); ctx.lineTo(14, -5); ctx.stroke();
      ctx.restore();
    } else {
      ctx.fillStyle = '#a9a48f';
      ctx.beginPath();
      ctx.moveTo(12, -8); ctx.lineTo(18, -10); ctx.lineTo(19, -8); ctx.lineTo(13, -6.5);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  function drawWorldParticles() {
    for (const p of G.world.particles) {
      if (p.type === 'ember' || p.type === 'heal') continue;
      const alpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.globalAlpha = alpha * (p.type === 'blood' ? .85 : .55);
      ctx.fillStyle = p.color;
      if (p.type === 'leaf') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot || 0) + G.envTime * (p.spin || 0));
        ctx.beginPath();
        ctx.ellipse(0, 0, p.r * 1.7, p.r * .7, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, TAU);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  // -------------------------------------------------------------------------
  // Light and dark
  // -------------------------------------------------------------------------
  function cutCircle(x, y, r, alpha, inner = .3) {
    const g = lctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(0,0,0,${alpha})`);
    g.addColorStop(inner, `rgba(0,0,0,${alpha * .82})`);
    g.addColorStop(.7, `rgba(0,0,0,${alpha * .32})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    lctx.fillStyle = g;
    lctx.beginPath();
    lctx.arc(x, y, r, 0, TAU);
    lctx.fill();
  }

  function conePathOn(c, x, y, angle, range, half) {
    c.beginPath();
    c.moveTo(x, y);
    c.arc(x, y, range, angle - half, angle + half, false);
    c.closePath();
  }

  function drawLighting(camX, camY) {
    const p = G.player;
    if (!p) return;
    const px = p.x - camX;
    const py = p.y - camY;
    const menu = G.state === 'menu';
    const chapterDark = menu ? 0 : (chapterData().darkness || 0);
    const dark = menu ? .3 : Math.min(.9, (p.lightOn ? .61 : .75) + chapterDark);
    lctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    lctx.globalCompositeOperation = 'source-over';
    lctx.clearRect(0, 0, viewW, viewH);
    lctx.fillStyle = `rgba(1,5,8,${dark})`;
    lctx.fillRect(0, 0, viewW, viewH);
    lctx.globalCompositeOperation = 'destination-out';

    // A little ambient pickup immediately around the hiker
    cutCircle(px, py, p.lightOn ? 248 : 155, p.lightOn ? .84 : .58, .2);

    if (p.lightOn && G.state !== 'dead') {
      // overlapping pools of light give the beam an organic, feathered body
      const pools = [
        { d: 185, r: 330, a: .34 },
        { d: 390, r: 265, a: .24 },
        { d: 585, r: 190, a: .14 }
      ];
      for (const pool of pools) {
        cutCircle(
          px + Math.cos(p.aim) * pool.d,
          py + Math.sin(p.aim) * pool.d,
          pool.r,
          pool.a,
          .06
        );
      }
      const flicker = p.lightFlicker > 0 ? 0.78 + Math.sin(G.envTime * 55) * .1 : 1;
      const range = (menu ? 700 : 780) * (1 + (G.mods.light || 0)) * (G.weather ? G.weather.visibility : 1);
      const layers = [
        { half: .5, alpha: .055 * flicker },
        { half: .41, alpha: .075 * flicker },
        { half: .33, alpha: .1 * flicker },
        { half: .26, alpha: .13 * flicker },
        { half: .18, alpha: .16 * flicker }
      ];
      for (const layer of layers) {
        conePathOn(lctx, px, py, p.aim, range, layer.half);
        const g = lctx.createRadialGradient(px, py, 10, px, py, range);
        g.addColorStop(0, `rgba(0,0,0,${layer.alpha * 1.2})`);
        g.addColorStop(.4, `rgba(0,0,0,${layer.alpha})`);
        g.addColorStop(.82, `rgba(0,0,0,${layer.alpha * .42})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        lctx.fillStyle = g;
        lctx.fill();
      }
    }

    // Local light sources also cut through the dark
    const world = G.world;
    const sources = [];
    sources.push({ x: world.campfire.x, y: world.campfire.y, r: 300, a: .78, flicker: true });
    if (!world.bridge.secured) {
      sources.push({ x: world.bridge.anchorX, y: world.bridge.anchorY - 62, r: 235, a: .72, flicker: true });
    } else {
      sources.push({ x: world.bridge.x - world.bridge.half, y: RAVINE_Y, r: 120, a: .38 });
      sources.push({ x: world.bridge.x + world.bridge.half, y: RAVINE_Y, r: 120, a: .38 });
    }
    sources.push({ x: world.goals.x - 55, y: world.goals.y - 42, r: 150, a: .58, flicker: true });
    sources.push({ x: world.goals.x + 55, y: world.goals.y - 42, r: 150, a: .58, flicker: true });
    for (const s of sources) {
      const sx = s.x - camX;
      const sy = s.y - camY;
      if (sx < -260 || sx > viewW + 260 || sy < -260 || sy > viewH + 260) continue;
      const fl = s.flicker ? .86 + Math.sin(G.envTime * 8.5 + s.x) * .1 : 1;
      cutCircle(sx, sy, s.r * fl, s.a, .18);
    }
    lctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(lightCanvas, 0, 0, viewW, viewH);

    // Warm light suspended in the cone
    if (p.lightOn && G.state !== 'dead') {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      conePathOn(ctx, px, py, p.aim, 760, .44);
      ctx.clip();
      const g = ctx.createRadialGradient(px, py, 20, px, py, 760);
      g.addColorStop(0, 'rgba(255,228,180,.26)');
      g.addColorStop(.28, 'rgba(247,207,150,.18)');
      g.addColorStop(.62, 'rgba(224,182,119,.095)');
      g.addColorStop(.9, 'rgba(184,146,92,.035)');
      g.addColorStop(1, 'rgba(160,130,80,0)');
      ctx.fillStyle = g;
      ctx.fillRect(px - 780, py - 780, 1560, 1560);
      ctx.restore();
      drawGlow(px, py + 5, 64, .25);
      drawGlow(px, py + 5, 230, .055);
    }
  }

  function drawAfterDark(camX, camY) {
    const p = G.player;
    if (!p) return;
    const px = p.x - camX;
    const py = p.y - camY;
    const world = G.world;

    // campfire glow + flame
    drawCampfire(camX, camY);
    drawLanterns(camX, camY);
    drawItemGlints(camX, camY);

    // fireflies
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const f of world.fireflies) {
      const x = f.x + Math.sin(G.envTime * f.speed + f.phase) * f.drift;
      const y = f.y + Math.cos(G.envTime * f.speed * .7 + f.phase) * f.drift * .45;
      const sx = x - camX;
      const sy = y - camY;
      if (sx < -30 || sx > viewW + 30 || sy < -30 || sy > viewH + 30) continue;
      const blink = .28 + .72 * Math.pow((Math.sin(G.envTime * 1.45 + f.phase * 2.3) + 1) / 2, 2);
      ctx.globalAlpha = blink * .8;
      ctx.drawImage(fireflySprite, sx - 9, sy - 9, 18, 18);
    }
    ctx.restore();

    // predatory eyes in the dark
    drawEyes(camX, camY);
    drawThreatMarkers(camX, camY);

    // glowy particles and slash effects
    drawEffects(camX, camY);
    drawGlowingParticles(camX, camY);

    // volumetric dust inside the flashlight beam
    if (p.lightOn && G.state !== 'dead') {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < 55; i++) {
        const angle = (i * 2.399 + G.envTime * .08) % TAU;
        const rad = 40 + ((i * 91.7) % 620);
        const sx = px + Math.cos(angle) * rad;
        const sy = py + Math.sin(angle) * rad * .7;
        if (sx < 0 || sx > viewW || sy < 0 || sy > viewH) continue;
        const da = Math.atan2(sy - py, sx - px);
        if (Math.abs(angleDiff(da, p.aim)) > .46) continue;
        const alpha = .06 + .1 * (1 - rad / 700);
        ctx.fillStyle = `rgba(255,232,185,${alpha})`;
        ctx.beginPath();
        ctx.arc(sx, sy, .8 + (i % 2) * .7, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    // low fog
    drawFog(camX, camY);

    // A faint halo keeps the hiker readable against the dark
    drawGlow(px, py + 2, 70, p.dead ? .06 : .12);
  }

  function drawCampfire(camX, camY) {
    const f = G.world.campfire;
    const sx = f.x - camX;
    const sy = f.y - camY;
    if (sx < -200 || sx > viewW + 200 || sy < -200 || sy > viewH + 200) return;
    const flick = .9 + Math.sin(G.envTime * 7 + f.phase) * .06 + Math.sin(G.envTime * 17.3) * .035;
    drawGlow(sx, sy - 8, 380 * flick, .42);
    drawGlow(sx, sy - 8, 125 * flick, .6);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.translate(sx, sy);
    for (let i = 0; i < 3; i++) {
      const sway = Math.sin(G.envTime * (4.5 + i) + i * 2) * 3.5;
      const h = (28 - i * 5) * flick;
      const w = (11 - i * 2.2) * flick;
      ctx.fillStyle = i === 0 ? 'rgba(229,99,38,.55)' : i === 1 ? 'rgba(247,167,72,.72)' : 'rgba(255,236,174,.85)';
      ctx.beginPath();
      ctx.moveTo(-w, 6);
      ctx.quadraticCurveTo(-w * .8, -h * .5, sway, -h);
      ctx.quadraticCurveTo(w * .9, -h * .4, w, 6);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawLanterns(camX, camY) {
    const world = G.world;
    const lights = [];
    if (!world.bridge.secured) {
      lights.push({ x: world.bridge.anchorX, y: world.bridge.anchorY - 62, size: 225, alpha: .62 });
    }
    const gate = world.goals.x;
    lights.push({ x: gate - 55, y: world.goals.y - 42, size: 165, alpha: .38 });
    lights.push({ x: gate + 55, y: world.goals.y - 42, size: 165, alpha: .38 });
    for (const l of lights) {
      const sx = l.x - camX;
      const sy = l.y - camY;
      if (sx < -200 || sx > viewW + 200 || sy < -200 || sy > viewH + 200) continue;
      drawGlow(sx, sy, l.size, l.alpha);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(255,224,160,.85)';
      ctx.beginPath();
      ctx.arc(sx, sy, 3, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawEyes(camX, camY) {
    const p = G.player;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const a of G.world.animals) {
      if (a.dead) continue;
      const d = dist(a.x, a.y, p.x, p.y);
      if (d > 760) continue;
      const sx = a.x - camX;
      const sy = a.y - camY;
      if (sx < -30 || sx > viewW + 30 || sy < -30 || sy > viewH + 30) continue;
      const blink = (Math.sin(G.envTime * 1.6 + a.phase * 3.1) + 1) / 2;
      const eyeAlpha = clamp(1.15 - d / 760, .12, 1) * (.55 + blink * .45);
      if (eyeAlpha < .06) continue;
      const ang = a.face;
      let head = 17, sep = 4.3, forward = 3;
      if (a.type === 'boar') { head = 23; sep = 5.2; forward = 2; }
      if (a.type === 'snake') { head = 15; sep = 2.3; forward = 1; }
      const hx = a.x + Math.cos(ang) * (head + forward);
      const hy = a.y + Math.sin(ang) * (head + forward);
      const perp = ang + Math.PI / 2;
      for (const side of [-1, 1]) {
        const ex = hx + Math.cos(perp) * sep * side;
        const ey = hy + Math.sin(perp) * sep * side;
        const esx = ex - camX;
        const esy = ey - camY;
        ctx.globalAlpha = eyeAlpha * (a.aggro ? .95 : .62);
        ctx.drawImage(fireflySprite, esx - 6, esy - 6, 12, 12);
        ctx.fillStyle = a.aggro ? 'rgba(255,196,112,.95)' : 'rgba(221,206,145,.8)';
        ctx.beginPath();
        ctx.arc(esx, esy, 1.05, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawThreatMarkers(camX, camY) {
    const p = G.player;
    for (const a of G.world.animals) {
      if (a.dead || !a.aggro) continue;
      const d = dist(a.x, a.y, p.x, p.y);
      if (d > 520) continue;
      const sx = a.x - camX;
      const sy = a.y - camY - (a.type === 'boar' ? 37 : 29);
      if (sx < 0 || sx > viewW || sy < 0 || sy > viewH) continue;
      const alpha = clamp(1.1 - d / 520, .25, .95) * (.72 + Math.sin(G.envTime * 4.4 + a.phase) * .18);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(211,107,75,.95)';
      ctx.font = '700 13px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', sx, sy);
      ctx.restore();
    }
  }

  function drawItemGlints(camX, camY) {
    const c = G.world.cache;
    if (c && !c.opened) {
      const sx = c.x - camX;
      const sy = c.y - camY - 9;
      if (sx > -80 && sx < viewW + 80 && sy > -80 && sy < viewH + 80) {
        const pulse = .5 + Math.sin(G.envTime * 2.2 + c.phase) * .22;
        drawGlow(sx, sy, 62, .16 + pulse * .08);
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = `rgba(255,223,157,${.35 + pulse * .25})`;
        ctx.beginPath();
        ctx.arc(sx + 8, sy - 3, 1.6, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }
    for (const item of G.world.pickups) {
      if (item.taken) continue;
      const sx = item.x - camX;
      const sy = item.y - camY - 4;
      if (sx < -60 || sx > viewW + 60 || sy < -60 || sy > viewH + 60) continue;
      const pulse = .5 + Math.sin(G.envTime * 2.6 + item.phase) * .25;
      drawGlow(sx, sy, 55, .1 + pulse * .08);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = `rgba(224,235,180,${.28 + pulse * .3})`;
      ctx.beginPath();
      ctx.arc(sx - 5, sy - 4, 1.3, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawEffects(camX, camY) {
    for (const e of G.world.effects) {
      if (e.type === 'slash') {
        const t = e.t / e.life;
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = (1 - t) * .8;
        ctx.translate(e.x - camX, e.y - camY);
        ctx.rotate(e.angle);
        ctx.strokeStyle = e.hit ? 'rgba(255,223,177,.95)' : 'rgba(220,211,179,.55)';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, 0, 48 + t * 16, -1.04, 1.02);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,249,224,.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, 56 + t * 16, -.7, .75);
        ctx.stroke();
        ctx.restore();
      } else if (e.type === 'noise') {
        const t = e.t / e.life;
        const r = e.radius * t;
        ctx.save();
        ctx.globalAlpha = (1 - t) * .1;
        ctx.strokeStyle = '#cfd9bb';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(e.x - camX, e.y - camY, r, r * .54, 0, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  function drawGlowingParticles(camX, camY) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const p of G.world.particles) {
      if (p.type !== 'ember' && p.type !== 'heal') continue;
      const alpha = clamp(p.life / p.maxLife, 0, 1);
      const sx = p.x - camX;
      const sy = p.y - camY;
      if (sx < -20 || sx > viewW + 20 || sy < -20 || sy > viewH + 20) continue;
      if (p.type === 'ember') {
        ctx.globalAlpha = alpha * .8;
        ctx.drawImage(fireflySprite, sx - 5, sy - 5, 10, 10);
      } else {
        ctx.globalAlpha = alpha * .55;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(sx, sy, p.r, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawFog(camX, camY) {
    if (!fogSprite) return;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 4; i++) {
      const speed = 4 + i * 2.2;
      const x = ((G.envTime * speed - camX * .16 + i * 520) % (viewW + 900)) - 450;
      const y = viewH * (.56 + i * .12) - camY * .06;
      ctx.globalAlpha = .055 + i * .01;
      ctx.drawImage(fogSprite, x, y - 150, 820, 410);
    }
    // mist rising from the ravine when nearby
    const rv = RAVINE_Y - camY;
    if (rv > -220 && rv < viewH + 220) {
      ctx.globalAlpha = .16;
      for (let i = 0; i < 4; i++) {
        const x = ((i * 470 + G.envTime * 7 - camX * .4) % (viewW + 600)) - 300;
        ctx.drawImage(fogSprite, x, rv - 130 + Math.sin(G.envTime * .3 + i) * 12, 760, 310);
      }
    }
    ctx.restore();
  }

  function drawScreenAtmosphere(camX, camY) {
    const p = G.player;
    // moon haze
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const moon = ctx.createRadialGradient(viewW * .82, -viewH * .12, 20, viewW * .82, -viewH * .12, viewH * .7);
    moon.addColorStop(0, 'rgba(137,160,154,.07)');
    moon.addColorStop(.55, 'rgba(95,125,121,.022)');
    moon.addColorStop(1, 'rgba(80,110,105,0)');
    ctx.fillStyle = moon;
    ctx.fillRect(0, 0, viewW, viewH);
    ctx.restore();

    // foreground silhouettes framing the view
    drawForegroundFronds();

    // A cool moonlit lift keeps silhouettes readable without stealing the dark
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const lift = ctx.createLinearGradient(0, 0, 0, viewH);
    lift.addColorStop(0, 'rgba(47,78,73,.1)');
    lift.addColorStop(.55, 'rgba(29,54,49,.055)');
    lift.addColorStop(1, 'rgba(18,38,33,.035)');
    ctx.fillStyle = lift;
    ctx.fillRect(0, 0, viewW, viewH);
    ctx.restore();

    // slight blue-green color veil
    ctx.fillStyle = 'rgba(8,19,17,.04)';
    ctx.fillRect(0, 0, viewW, viewH);

    // Chapter mood. Each region has its own air, from marsh green to ash orange.
    const chapter = chapterData();
    if (chapter.tint) {
      ctx.fillStyle = chapter.tint;
      ctx.fillRect(0, 0, viewW, viewH);
    }
    drawWeatherFX();
    if (chapter.name === '灰烬林' && p) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < 14; i++) {
        const ex = (i * 173 + G.envTime * (18 + i * 2)) % (viewW + 80) - 40;
        const ey = (i * 97 - G.envTime * (24 + i)) % (viewH + 80);
        const y = ey < 0 ? ey + viewH + 80 : ey;
        ctx.fillStyle = `rgba(232,120,52,${.12 + (i % 3) * .04})`;
        ctx.beginPath();
        ctx.arc(ex, y, 1 + (i % 3), 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    drawSprintFX();
  }

  function drawWeatherFX() {
    const w = G.weather;
    if (!w) return;
    const time = G.weatherTime;
    const intensity = w.intensity || 1;
    ctx.save();
    if (w.rain > 0) {
      const count = Math.floor(90 * w.rain * intensity);
      for (let i = 0; i < count; i++) {
        const speed = 620 + (i % 7) * 58;
        const x = ((i * 137 + time * speed * .22) % (viewW + 140)) - 70;
        const y = ((i * 83 + time * speed) % (viewH + 120)) - 60;
        ctx.strokeStyle = `rgba(174,204,214,${.14 + (i % 5) * .045})`;
        ctx.lineWidth = .9 + (i % 3) * .5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 8 - w.wind * 14, y + 24 + w.rain * 16);
        ctx.stroke();
      }
      const wet = ctx.createLinearGradient(0, 0, viewW, viewH);
      wet.addColorStop(0, `rgba(30,62,78,${.05 * w.rain})`);
      wet.addColorStop(1, `rgba(18,42,51,${.08 * w.rain})`);
      ctx.fillStyle = wet;
      ctx.fillRect(0, 0, viewW, viewH);
    }
    if (w.snow > 0) {
      const count = Math.floor(100 * w.snow * intensity);
      for (let i = 0; i < count; i++) {
        const drift = Math.sin(time * .8 + i * 1.7) * (8 + i % 5);
        const x = ((i * 97 + time * (12 + i % 4) + drift) % (viewW + 60)) - 30;
        const y = ((i * 61 + time * (22 + i % 5)) % (viewH + 60)) - 30;
        ctx.fillStyle = `rgba(225,239,242,${.28 + (i % 4) * .08})`;
        ctx.beginPath();
        ctx.arc(x, y, 1.1 + (i % 4) * .75, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = `rgba(170,198,210,${.025 * w.snow})`;
      ctx.fillRect(0, 0, viewW, viewH);
    }
    if (w.fog > 0) {
      const g = ctx.createLinearGradient(0, viewH * .25, 0, viewH);
      g.addColorStop(0, 'rgba(150,170,158,0)');
      g.addColorStop(.55, `rgba(150,170,158,${.035 * w.fog})`);
      g.addColorStop(1, `rgba(174,190,176,${.11 * w.fog})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, viewW, viewH);
    }
    if (w.ash > 0) {
      const count = Math.floor(34 * w.ash * intensity);
      for (let i = 0; i < count; i++) {
        const x = ((i * 173 + time * (18 + i % 6)) % (viewW + 80)) - 40;
        const y = ((i * 91 - time * (28 + i % 5)) % (viewH + 80));
        ctx.fillStyle = `rgba(${190 + i % 30},${108 + i % 25},${62 + i % 20},${.12 + (i % 4) * .035})`;
        ctx.beginPath();
        ctx.arc(x, y < 0 ? y + viewH + 80 : y, 1 + (i % 3) * .65, 0, TAU);
        ctx.fill();
      }
    }
    if (w.wind > 0 && !w.rain && !w.snow) {
      for (let i = 0; i < 16; i++) {
        const x = ((i * 157 + time * (110 + w.wind * 80)) % (viewW + 120)) - 40;
        const y = ((i * 73 + time * 8) % (viewH + 60)) - 20;
        ctx.strokeStyle = `rgba(178,197,169,${.025 + w.wind * .035})`;
        ctx.lineWidth = .7;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 16 - w.wind * 18, y + 3);
        ctx.stroke();
      }
    }
    if (G.lightning > 0) {
      ctx.fillStyle = `rgba(196,220,232,${.24 * G.lightning})`;
      ctx.fillRect(0, 0, viewW, viewH);
    }
    ctx.restore();
  }

  function drawSprintFX() {
    const p = G.player;
    if (!p || p.dead) return;
    const s = p.sprintBlend || 0;
    if (s < .02) return;
    const cx = viewW * .5;
    const cy = viewH * .54;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    // radial velocity streaks, strongest near the edges
    const t = G.envTime * 12;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * TAU + Math.sin(t * .13 + i) * .08;
      const wobble = Math.sin(t * .6 + i * 2.7) * .5 + .5;
      const inner = Math.max(viewW, viewH) * (.18 + wobble * .14);
      const outer = Math.max(viewW, viewH) * (.68 + wobble * .22);
      const alpha = (.10 + wobble * .14) * s;
      ctx.strokeStyle = `rgba(204,222,194,${alpha})`;
      ctx.lineWidth = 1 + wobble * 1.3;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
      ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
      ctx.stroke();
    }
    // warm side pressure at full sprint
    const side = ctx.createLinearGradient(0, 0, viewW, 0);
    side.addColorStop(0, `rgba(229,158,87,${.2 * s})`);
    side.addColorStop(.16, 'rgba(229,158,87,0)');
    side.addColorStop(.84, 'rgba(116,171,153,0)');
    side.addColorStop(1, `rgba(116,171,153,${.17 * s})`);
    ctx.fillStyle = side;
    ctx.fillRect(0, 0, viewW, viewH);
    // ground-level speed haze
    ctx.fillStyle = `rgba(180,205,172,${.035 * s})`;
    ctx.fillRect(0, viewH * .55, viewW, viewH * .45);
    ctx.restore();
  }

  function drawForegroundFronds() {
    const sway = Math.sin(G.envTime * .5) * 3;
    ctx.save();
    ctx.fillStyle = 'rgba(2,7,5,.72)';
    // bottom-left frond cluster
    for (let i = 0; i < 5; i++) {
      const bx = -10 + i * 12;
      const by = viewH + 10;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx + 15, by - 80 - i * 10, bx + 60 + sway, by - 145 - i * 7);
      ctx.quadraticCurveTo(bx + 42, by - 70, bx + 22, by);
      ctx.closePath();
      ctx.fill();
    }
    // bottom-right
    for (let i = 0; i < 4; i++) {
      const bx = viewW + 12 - i * 14;
      const by = viewH + 12;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx - 16, by - 70 - i * 13, bx - 56 - sway, by - 132 - i * 9);
      ctx.quadraticCurveTo(bx - 38, by - 62, bx - 16, by);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawReticle(camX, camY) {
    if (G.touchMode || G.state !== 'playing' || !G.mouse.has) return;
    const x = G.mouse.x;
    const y = G.mouse.y;
    if (x < 0 || x > viewW || y < 0 || y > viewH) return;
    const p = G.player;
    const wx = x + camX;
    const wy = y + camY;
    let hover = false;
    for (const a of G.world.animals) {
      if (!a.dead && dist(wx, wy, a.x, a.y) < a.radius + 14) { hover = true; break; }
    }
    const readiness = p.attackCd > 0 ? .35 : 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = hover ? 'rgba(238,150,109,.9)' : `rgba(238,219,181,${.52 * readiness})`;
    ctx.fillStyle = hover ? 'rgba(238,150,109,.95)' : `rgba(238,219,181,${.75 * readiness})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, TAU);
    ctx.stroke();
    for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 10, Math.sin(a) * 10);
      ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 14);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 1.2, 0, TAU);
    ctx.fill();
    if (p.attackCd > 0) {
      ctx.strokeStyle = 'rgba(226,162,94,.55)';
      ctx.beginPath();
      ctx.arc(0, 0, 16, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - p.attackCd / .4));
      ctx.stroke();
    }
    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // HUD
  // -------------------------------------------------------------------------
  const hudCache = {};

  function updateHUD(force = false) {
    const p = G.player;
    if (!p) return;
    const lv = levelData();
    if (force || hudCache.level !== lv.num) {
      hudCache.level = lv.num;
      if (ui.levelNum) ui.levelNum.textContent = String(lv.num);
      if (ui.levelName) ui.levelName.textContent = `${lv.name} · ${G.weather.name}`;
      if (ui.objectiveText) ui.objectiveText.textContent = `穿过${lv.chapter.name} · 抵达${lv.chapter.goal}，领取${lv.reward.name}`;
    }
    const d = Math.round(currentDistance());
    if (force || hudCache.distance !== d) {
      hudCache.distance = d;
      ui.distance.textContent = formatNumber(d);
    }
    const pct = progress() * 100;
    if (force || hudCache.pct !== pct) {
      hudCache.pct = pct;
      ui.progressFill.style.width = pct.toFixed(2) + '%';
      ui.progressGlow.style.left = pct.toFixed(2) + '%';
    }
    const hp = Math.max(0, Math.ceil(p.hp));
    if (force || hudCache.hp !== hp) {
      hudCache.hp = hp;
      ui.hpValue.textContent = String(hp);
    }
    if (force || hudCache.maxHp !== p.maxHp) {
      hudCache.maxHp = p.maxHp;
      if (ui.hpMax) ui.hpMax.textContent = String(Math.round(p.maxHp));
    }
    ui.hpFill.style.width = clamp(p.hp / p.maxHp * 100, 0, 100).toFixed(1) + '%';
    ui.hpFill.classList.toggle('is-low', p.hp <= 32);
    ui.staminaFill.style.width = clamp(p.stamina / p.maxStamina * 100, 0, 100).toFixed(1) + '%';

    if (force || hudCache.bleed !== p.bleeding) {
      hudCache.bleed = p.bleeding;
      const labels = ['无失血', '轻微失血', '持续失血', '严重失血'];
      const textNode = ui.bleedLabel.lastChild;
      if (textNode && textNode.nodeType === 3) textNode.nodeValue = ' ' + labels[p.bleeding];
      ui.bleedLabel.classList.toggle('is-bleeding', p.bleeding === 1);
      ui.bleedLabel.classList.toggle('is-severe', p.bleeding >= 2);
      const pips = ui.bleedPips.children;
      for (let i = 0; i < pips.length; i++) pips[i].classList.toggle('is-on', i < p.bleeding);
    }
    document.documentElement.style.setProperty('--bleed', (p.bleeding / 3).toFixed(2));
    document.documentElement.style.setProperty('--hp', (p.hp / p.maxHp).toFixed(2));

    if (force || hudCache.meds !== p.meds) {
      hudCache.meds = p.meds;
      ui.medCount.textContent = String(p.meds);
      if (ui.touchMed) ui.touchMed.dataset.count = String(p.meds);
    }
    if (force || hudCache.ropes !== p.ropes) {
      hudCache.ropes = p.ropes;
      ui.ropeCount.textContent = String(p.ropes);
    }
    if (force || hudCache.light !== p.lightOn) {
      hudCache.light = p.lightOn;
      ui.lightState.textContent = p.lightOn ? '已开' : '关闭';
    }

    for (const slot of ui.slots) {
      const item = slot.dataset.slot;
      if (item === 'light') slot.classList.toggle('is-active', p.lightOn);
      else if (item === 'med') {
        slot.classList.toggle('is-empty', p.meds <= 0);
        if (p.meds <= 0) slot.classList.remove('is-active');
      } else if (item === 'rope') {
        slot.classList.toggle('is-empty', p.ropes <= 0 || G.world.bridge.secured);
      } else if (item === 'knife') {
        const state = slot.querySelector('.slot-state');
        if (state) state.textContent = p.attackCd > 0 ? '收势' : '就绪';
      }
    }

    const goal = G.world.goals;
    const compass = Math.atan2(goal.x - p.x, p.y - goal.y);
    ui.compassArrow.style.transform = `rotate(${compass}rad)`;
  }

  function refreshSoundButton() {
    ui.soundBtn.setAttribute('aria-label', audio.muted ? '打开声音' : '关闭声音');
    ui.soundBtn.setAttribute('title', audio.muted ? '声音已关闭' : '声音');
  }

  function toggleMute() {
    audio.init();
    audio.toggleMute();
    refreshSoundButton();
  }

  // -------------------------------------------------------------------------
  // Inputs & events
  // -------------------------------------------------------------------------
  function openHow() {
    audio.init();
    ui.howModal.classList.remove('is-hidden');
    setTimeout(() => ui.howClose.focus(), 60);
  }

  function closeHow() {
    ui.howModal.classList.add('is-hidden');
    ui.howBtn.focus();
  }

  function detectTouchMode() {
    const coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    const mobileTouch = navigator.maxTouchPoints > 0 && window.innerWidth < 1024;
    const on = coarse || mobileTouch;
    G.touchMode = on;
    document.body.classList.toggle('touch-mode', on);
    const touchUI = document.getElementById('touchUI');
    if (touchUI) touchUI.setAttribute('aria-hidden', on ? 'false' : 'true');
    if (!on) resetJoystick();
  }

  function resetJoystick() {
    G.touch.active = false;
    G.touch.dx = 0;
    G.touch.dy = 0;
    G.touch.stickMag = 0;
    G.touch.pointerId = null;
    if (ui.stickKnob) ui.stickKnob.style.transform = 'translate(0px, 0px)';
  }

  function setJoystickFromEvent(e) {
    const rect = ui.touchStick.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const mag = Math.hypot(dx, dy);
    const max = rect.width * .34;
    const amount = Math.min(1, mag / max);
    if (mag > .001) {
      dx /= mag;
      dy /= mag;
    } else {
      dx = 0;
      dy = 0;
    }
    G.touch.dx = dx * amount;
    G.touch.dy = dy * amount;
    G.touch.stickMag = amount;
    const knobDist = amount * (rect.width * .3);
    if (ui.stickKnob) ui.stickKnob.style.transform = `translate(${dx * knobDist}px, ${dy * knobDist}px)`;
  }

  function bindEvents() {
    ui.startBtn.addEventListener('click', startRun);
    ui.retryBtn.addEventListener('click', retryLevel);
    ui.againBtn.addEventListener('click', advanceLevel);
    ui.howBtn.addEventListener('click', openHow);
    ui.howClose.addEventListener('click', closeHow);
    ui.howStart.addEventListener('click', () => {
      closeHow();
      if (G.state === 'menu') startRun();
    });
    ui.pauseBtn.addEventListener('click', pauseGame);
    ui.resumeBtn.addEventListener('click', resumeGame);
    ui.pauseRestartBtn.addEventListener('click', retryLevel);
    ui.pauseMenuBtn.addEventListener('click', goToMenu);
    ui.deathMenuBtn.addEventListener('click', goToMenu);
    ui.victoryMenuBtn.addEventListener('click', goToMenu);
    ui.soundBtn.addEventListener('click', toggleMute);
    for (const slot of ui.slots) {
      slot.addEventListener('click', () => {
        if (G.state !== 'playing') return;
        const item = slot.dataset.slot;
        if (item === 'light') toggleLight();
        else if (item === 'med') useMed();
        else if (item === 'rope') useRope();
        else if (item === 'knife') attack();
      });
    }

    document.addEventListener('keydown', (e) => {
      const tag = e.target && e.target.tagName;
      const onButton = tag === 'BUTTON' || tag === 'INPUT' || tag === 'TEXTAREA';
      if (e.code === 'Space' && (!onButton || G.state === 'playing')) e.preventDefault();
      if (e.code.startsWith('Arrow')) e.preventDefault();
      G.keys[e.code] = true;
      if (e.repeat) return;

      if (e.code === 'Escape') {
        if (!ui.howModal.classList.contains('is-hidden')) { closeHow(); return; }
        if (G.state === 'playing') pauseGame();
        else if (G.state === 'paused') resumeGame();
        return;
      }
      if (e.code === 'KeyM') {
        toggleMute();
        return;
      }
      if (G.state === 'menu') {
        if ((e.code === 'Enter' || e.code === 'NumpadEnter') && !onButton) startRun();
        return;
      }
      if (G.state === 'dead' || G.state === 'won') {
        if ((e.code === 'Enter' || e.code === 'NumpadEnter') && !onButton) {
          if (G.state === 'dead') retryLevel();
          else advanceLevel();
        }
        return;
      }
      if (G.state !== 'playing') return;
      if (onButton && e.code === 'Enter') return;
      if (e.code === 'KeyF') toggleLight();
      else if (e.code === 'Digit2') useMed();
      else if (e.code === 'Digit3') useRope();
      else if (e.code === 'KeyE') interact();
      else if (e.code === 'Space') attack();
      else if (e.code === 'KeyP') pauseGame();
    });

    document.addEventListener('keyup', (e) => {
      G.keys[e.code] = false;
    });

    window.addEventListener('blur', () => {
      for (const k in G.keys) G.keys[k] = false;
      G.touch.attackHeld = false;
      resetJoystick();
      if (G.state === 'playing') pauseGame();
    });

    canvas.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      G.mouse.x = e.clientX;
      G.mouse.y = e.clientY;
      G.mouse.has = true;
    });
    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return;
      if (e.button !== 0) return;
      if (G.state === 'playing') {
        G.mouse.x = e.clientX;
        G.mouse.y = e.clientY;
        G.mouse.has = true;
        attack();
      }
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Touch joystick
    ui.touchStick.addEventListener('pointerdown', (e) => {
      if (G.state !== 'playing' || e.pointerType === 'mouse') return;
      e.preventDefault();
      G.touch.active = true;
      G.touch.pointerId = e.pointerId;
      try { ui.touchStick.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      setJoystickFromEvent(e);
    });
    ui.touchStick.addEventListener('pointermove', (e) => {
      if (!G.touch.active || e.pointerId !== G.touch.pointerId) return;
      e.preventDefault();
      setJoystickFromEvent(e);
    });
    const releaseStick = (e) => {
      if (e.pointerId !== G.touch.pointerId && G.touch.pointerId !== null) return;
      resetJoystick();
    };
    ui.touchStick.addEventListener('pointerup', releaseStick);
    ui.touchStick.addEventListener('pointercancel', releaseStick);
    ui.touchStick.addEventListener('lostpointercapture', releaseStick);

    // Touch actions
    const touchLight = document.querySelector('[data-touch="light"]');
    const touchMed = document.querySelector('[data-touch="med"]');
    const touchInteract = document.querySelector('[data-touch="interact"]');
    if (touchLight) touchLight.addEventListener('click', (e) => { e.preventDefault(); if (G.state === 'playing') toggleLight(); });
    if (touchMed) touchMed.addEventListener('click', (e) => { e.preventDefault(); if (G.state === 'playing') useMed(); });
    if (touchInteract) touchInteract.addEventListener('click', (e) => { e.preventDefault(); if (G.state === 'playing') interact(); });
    ui.touchAttack.addEventListener('pointerdown', (e) => {
      if (G.state !== 'playing') return;
      e.preventDefault();
      G.touch.attackHeld = true;
      attack();
    });
    const releaseAttack = () => { G.touch.attackHeld = false; };
    window.addEventListener('pointerup', (e) => { if (e.pointerType === 'touch') releaseAttack(); });
    window.addEventListener('pointercancel', releaseAttack);

    window.addEventListener('resize', () => {
      resizeCanvas();
      detectTouchMode();
      if (G.state === 'menu' && G.world) {
        const camp = G.world.campfire;
        G.camera.menuX = clamp(camp.x - viewW * .70, 0, Math.max(0, WORLD_W - viewW));
        G.camera.menuY = clamp(camp.y - viewH * .58, 0, Math.max(0, WORLD_H - viewH));
      } else if (G.player) {
        G.camera.x = clamp(G.camera.x, 0, Math.max(0, WORLD_W - viewW));
        G.camera.y = clamp(G.camera.y, 0, Math.max(0, WORLD_H - viewH));
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && G.state === 'playing') pauseGame();
    });
  }

  // -------------------------------------------------------------------------
  // Main loop
  // -------------------------------------------------------------------------
  function frame(now) {
    const dt = clamp((now - G.lastFrame) / 1000, 0, .05);
    G.lastFrame = now;
    if (G.state === 'playing') updateGame(dt);
    else if (G.state === 'menu') updateMenu(dt);
    else if (G.state === 'dead' || G.state === 'won') updateEnd(dt);
    drawFrame();
    requestAnimationFrame(frame);
  }

  function init() {
    resizeCanvas();
    detectTouchMode();
    initSprites();
    bindEvents();
    resetWorld(randomSeed(), true);
    ui.menu.classList.remove('is-hidden');
    document.body.classList.remove('is-playing');
    refreshSoundButton();
    G.lastFrame = performance.now();
    requestAnimationFrame(frame);
  }

  // A small console surface for QA and curious players
  window.NIGHTWOOD = {
    get game() { return G; },
    start: startRun,
    teleport(x, y) {
      if (!G.player) return;
      G.player.x = clamp(Number(x) || 0, 30, WORLD_W - 30);
      G.player.y = clamp(Number(y) || 0, 40, WORLD_H - 40);
      snapCameraToPlayer();
    },
    light(on) { if (G.player) G.player.lightOn = !!on; },
    win() { winGame(); },
    sound(type = 'wolf') { audio.animalAlert(type, .15, 1); audio.animalStep(type, -.15, 1); },
    jump(level) {
      const n = clamp(Number(level) || 1, 1, LEVEL_COUNT);
      G.items = LEVEL_ITEMS.slice(0, n - 1);
      G.totalTime = 0;
      G.totalKills = 0;
      startLevel(n, false);
    }
  };

  init();
})();
