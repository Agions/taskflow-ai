/**
 * 动画效果组件
 * 提供渐变、彩虹、脉冲等视觉效果
 */

import chalk from 'chalk';
import gradient from 'gradient-string';

// ==================== 渐变主题 ====================

export const gradients = {
  // 彩虹渐变
  rainbow: gradient(['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3']),
  // 海洋渐变
  ocean: gradient(['#2193b0', '#6dd5ed']),
  // 火焰渐变
  fire: gradient(['#f12711', '#f5af19']),
  // 霓虹渐变
  neon: gradient(['#B2FF59', '#00E676', '#00BFA5']),
  // 日落渐变
  sunset: gradient(['#ff512f', '#dd2476']),
  // 宇宙渐变
  cosmic: gradient(['#434343', '#000000']),
  // 紫色梦幻
  purple: gradient(['#667eea', '#764ba2']),
  // 金色奢华
  gold: gradient(['#FFD700', '#FFA500']),
  // 品牌色
  brand: gradient(['#00D9FF', '#00A8E8']),
  // 成功渐变
  success: gradient(['#00b09b', '#96c93d']),
  // 错误渐变
  error: gradient(['#cb2d3e', '#ef473a']),
  // 警告渐变
  warning: gradient(['#f7971e', '#ffd200']),
};

// ==================== 彩虹文字 ====================

/**
 * 生成彩虹色文字
 */
export function rainbow(text: string): string {
  return gradients.rainbow.multiline(text);
}

/**
 * 生成渐变文字
 */
export function gradientText(text: string, gradientName: keyof typeof gradients = 'brand'): string {
  return gradients[gradientName].multiline(text);
}

// ==================== 动画效果 ====================

/**
 * 脉冲动画（用于强调）
 */
export function pulse(text: string, color: 'green' | 'yellow' | 'red' | 'blue' | 'cyan' = 'green'): string {
  const colors = {
    green: chalk.green.bold,
    yellow: chalk.yellow.bold,
    red: chalk.red.bold,
    blue: chalk.blue.bold,
    cyan: chalk.cyan.bold,
  };
  return colors[color](`◉ ${text}`);
}

/**
 * 闪烁效果
 */
export function blink(text: string): string {
  return chalk.bold.ansi256(226)(text);
}

/**
 * 霓虹灯效果
 */
export function neon(text: string, color: 'pink' | 'blue' | 'green' | 'yellow' = 'pink'): string {
  const colors = {
    pink: chalk.hex('#FF10F0'),
    blue: chalk.hex('#00FFFF'),
    green: chalk.hex('#39FF14'),
    yellow: chalk.hex('#FFFF00'),
  };
  return colors[color].bold(`✦ ${text} ✦`);
}

/**
 * 发光效果
 */
export function glow(text: string, intensity: 'low' | 'medium' | 'high' = 'medium'): string {
  const intensities = {
    low: chalk.hex('#E0E0E0'),
    medium: chalk.hex('#FFFFFF').bold,
    high: chalk.hex('#FFFFFF').bold.underline,
  };
  return intensities[intensity](text);
}

// ==================== 装饰元素 ====================

/**
 * 装饰边框
 */
export function decorativeBorder(length: number = 40, style: 'single' | 'double' | 'heavy' = 'single'): string {
  const borders = {
    single: '─',
    double: '═',
    heavy: '━',
  };
  return gradients.brand(borders[style].repeat(length));
}

/**
 * 装饰角标
 */
export function corner(text: string, position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'top-left'): string {
  const corners = {
    'top-left': '┌',
    'top-right': '┐',
    'bottom-left': '└',
    'bottom-right': '┘',
  };
  return gradients.brand(`${corners[position]} ${text}`);
}

/**
 * 星星装饰
 */
export function stars(count: number = 3): string {
  return gradients.gold('✦'.repeat(count));
}

/**
 * 箭头装饰
 */
export function arrow(direction: 'right' | 'left' | 'up' | 'down' = 'right', color?: string): string {
  const arrows = {
    right: '➜',
    left: '⬅',
    up: '⬆',
    down: '⬇',
  };
  const arrow = arrows[direction];
  return color ? chalk.hex(color)(arrow) : gradients.brand(arrow);
}

/**
 * 项目符号
 */
export function bullet(style: 'dot' | 'star' | 'arrow' | 'check' = 'dot'): string {
  const bullets = {
    dot: '●',
    star: '★',
    arrow: '▸',
    check: '✓',
  };
  return bullets[style];
}

// ==================== 动态效果 ====================

interface AnimationFrame {
  text: string;
  delay: number;
}

/**
 * 打字机效果
 */
export async function typewriter(text: string, delay: number = 50): Promise<void> {
  for (const char of text) {
    process.stdout.write(char);
    await sleep(delay);
  }
  console.log();
}

/**
 * 波浪文字效果
 */
export function wave(text: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
  ];

  return text
    .split('')
    .map((char, i) => {
      const color = colors[i % colors.length];
      return chalk.hex(color)(char);
    })
    .join('');
}

/**
 * 闪烁星星效果
 */
export function twinkle(text: string): string {
  const stars = ['✦', '✧', '⋆', '·', '•'];
  const randomStar = stars[Math.floor(Math.random() * stars.length)];
  return `${gradients.gold(randomStar)} ${text}`;
}

/**
 * 3D 文字效果
 */
export function threeD(text: string): string {
  const shadow = chalk.gray(text);
  const main = chalk.white.bold(text);
  return `${shadow}\n ${main}`;
}

// ==================== Emoji 增强 ====================

/**
 * 带 Emoji 的状态
 */
export function statusEmoji(status: 'success' | 'error' | 'warning' | 'info' | 'loading'): string {
  const emojis = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    loading: '⏳',
  };
  return emojis[status];
}

/**
 * 带 Emoji 的标签
 */
export function emojiLabel(label: string, emoji: string): string {
  return `${emoji}  ${chalk.bold(label)}`;
}

/**
 * 常用 Emoji 集合
 */
export const emojis = {
  // 状态
  successMark: '✅',
  errorMark: '❌',
  warningSign: '⚠️',
  info: 'ℹ️',
  loading: '⏳',
  done: '✨',
  new: '🆕',
  update: '🔄',
  delete: '🗑️',

  // 功能
  ai: '🤖',
  task: '📋',
  code: '💻',
  config: '⚙️',
  deploy: '🚀',
  test: '🧪',
  doc: '📚',
  search: '🔍',
  filter: '🔎',
  sort: '📊',

  // 文件
  file: '📄',
  folder: '📁',
  image: '🖼️',
  video: '🎬',
  audio: '🎵',
  zip: '📦',

  // 时间
  clock: '⏰',
  calendar: '📅',
  history: '📜',
  timer: '⏱️',

  // 用户
  user: '👤',
  users: '👥',
  admin: '👑',
  guest: '🙋',

  // 其他
  star: '⭐',
  heart: '❤️',
  fireEmoji: '🔥',
  rocket: '🚀',
  bulb: '💡',
  gear: '⚙️',
  link: '🔗',
  lock: '🔒',
  unlock: '🔓',
  key: '🔑',
  flag: '🚩',
  tag: '🏷️',
  bell: '🔔',
  mail: '📧',
  chat: '💬',
  phone: '📞',
  home: '🏠',
  building: '🏢',
  globe: '🌐',
  cloud: '☁️',
  database: '🗄️',
  server: '🖥️',
  laptop: '💻',
  mobile: '📱',
  tablet: '📲',
  desktop: '🖥️',
  keyboard: '⌨️',
  mouse: '🖱️',
  printer: '🖨️',
  camera: '📷',
  microphone: '🎤',
  speaker: '🔊',
  headphone: '🎧',
  music: '🎵',
  game: '🎮',
  trophy: '🏆',
  medal: '🏅',
  gift: '🎁',
  party: '🎉',
  balloon: '🎈',
  cake: '🎂',
  coffee: '☕',
  beer: '🍺',
  wine: '🍷',
  food: '🍔',
  fruit: '🍎',
  vegetable: '🥕',
  meat: '🥩',
  fish: '🐟',
  bread: '🍞',
  cheese: '🧀',
  pizza: '🍕',
  burger: '🍔',
  fries: '🍟',
  hotdog: '🌭',
  sandwich: '🥪',
  taco: '🌮',
  burrito: '🌯',
  egg: '🥚',
  bacon: '🥓',
  pancake: '🥞',
  waffle: '🧇',
  donut: '🍩',
  cookie: '🍪',
  chocolate: '🍫',
  candy: '🍬',
  lollipop: '🍭',
  icecream: '🍨',
  cake2: '🍰',
  pie: '🥧',
  pudding: '🍮',
  honey: '🍯',
  milk: '🥛',
  tea: '🍵',
  sake: '🍶',
  champagne: '🍾',
  cocktail: '🍸',
  tropical: '🍹',
  beer2: '🍺',
  beers: '🍻',
  clink: '🥂',
  tumbler: '🥃',
  cup: '☕',
  spoon: '🥄',
  fork: '🍴',
  knife: '🔪',
  plate: '🍽️',
  amphora: '🏺',
  earth: '🌍',
  map: '🗺️',
  compass: '🧭',
  mountain: '⛰️',
  beach: '🏖️',
  desert: '🏜️',
  campsite: '🏕️',
  tent: '⛺',
  factory: '🏭',
  japan: '⛩️',
  fountain: '⛲',
  circusTent: '🎪',
  foggy: '🌁',
  night: '🌃',
  sunrise: '🌅',
  sunset2: '🌄',
  city: '🌆',
  city2: '🌇',
  bridge: '🌉',
  milkyway: '🌌',
  carousel: '🎠',
  ferris: '🎡',
  roller: '🎢',
  barber: '💈',
  circus: '🎪',
  train: '🚂',
  metro: '🚇',
  tram: '🚊',
  station: '🚉',
  bus: '🚌',
  oncoming: '🚍',
  trolley: '🚎',
  minibus: '🚐',
  ambulance: '🚑',
  fireTruck: '🚒',
  police: '🚓',
  taxi: '🚕',
  auto: '🚗',
  car: '🚘',
  suv: '🚙',
  truck: '🚚',
  articulated: '🚛',
  tractor: '🚜',
  race: '🏎️',
  motorcycle: '🏍️',
  scooter: '🛵',
  bike: '🚲',
  kick: '🛴',
  bus2: '🚏',
  fuel: '⛽',
  policeLight: '🚨',
  horizontal: '🔰',
  traffic: '🚥',
  vertical: '🚦',
  stop: '🛑',
  construction: '🚧',
  anchor: '⚓',
  sailboat: '⛵',
  canoe: '🛶',
  speedboat: '🚤',
  passenger: '🛳️',
  ferry: '⛴️',
  motor: '🛥️',
  ship: '🚢',
  airplane: '✈️',
  small: '🛩️',
  departure: '🛫',
  arrival: '🛬',
  seat: '💺',
  helicopter: '🚁',
  suspension: '🚟',
  mountain2: '🚠',
  aerial: '🚡',
  satellite: '🛰️',
  rocket2: '🚀',
  flying: '🛸',
  bell2: '🔔',
  bell3: '🔕',
  speaker2: '🔈',
  speaker3: '🔉',
  speaker4: '🔊',
  loudspeaker: '📢',
  mega: '📣',
  postal: '📯',
  horn: '📯',
  string: '🎻',
  guitar: '🎸',
  keyboard2: '🎹',
  trumpet: '🎺',
  saxophone: '🎷',
  accordion: '🪗',
  banjo: '🪕',
  guitar2: '🎸',
  violin: '🎻',
  drum: '🥁',
  long: '🪘',
  maracas: '🪇',
  flute: '🪈',
  phone2: '📱',
  calling: '📲',
  telephone: '☎️',
  receiver: '📞',
  pager: '📟',
  fax: '📠',
  battery: '🔋',
  low: '🪫',
  electric: '🔌',
  computer: '💻',
  desktop2: '🖥️',
  printer2: '🖨️',
  keyboard3: '⌨️',
  mouse2: '🖱️',
  trackball: '🖲️',
  minidisc: '💽',
  floppy: '💾',
  cd: '💿',
  dvd: '📀',
  abacus: '🧮',
  movie: '🎥',
  film: '🎞️',
  projector: '📽️',
  clapper: '🎬',
  tv: '📺',
  camera2: '📷',
  flash: '📸',
  video2: '📹',
  vhs: '📼',
  magnifying: '🔍',
  tilted: '🔎',
  candle: '🕯️',
  bulb2: '💡',
  flashlight: '🔦',
  izakaya: '🏮',
  diya: '🪔',
  notebook: '📔',
  decorative: '📕',
  closed: '📗',
  green: '📗',
  blue: '📘',
  orange: '📙',
  books: '📚',
  notebook2: '📓',
  ledger: '📒',
  page: '📃',
  scroll: '📜',
  page2: '📄',
  newspaper: '📰',
  rolled: '🗞️',
  bookmark: '🔖',
  label2: '🏷️',
  money: '💰',
  yen: '💴',
  dollar: '💵',
  euro: '💶',
  pound: '💷',
  coin: '🪙',
  credit: '💳',
  receipt: '🧾',
  chart: '💹',
  envelope: '✉️',
  email: '📧',
  incoming: '📨',
  outgoing: '📩',
  package2: '📦',
  closed2: '📪',
  mailbox: '📫',
  postbox: '📮',
  ballot: '🗳️',
  pencil: '✏️',
  black: '✒️',
  pen: '🖊️',
  fountain2: '🖋️',
  paintbrush: '🖌️',
  crayon: '🖍️',
  memo: '📝',
  briefcase: '💼',
  file2: '📁',
  folder2: '📂',
  dividers: '🗂️',
  card: '📇',
  index: '📈',
  chart2: '📉',
  increasing: '📊',
  clipboard: '📋',
  pushpin: '📌',
  round: '📍',
  paperclip: '📎',
  linked: '🖇️',
  straight: '📏',
  triangular: '📐',
  scissors: '✂️',
  card2: '🗃️',
  box: '🗄️',
  wastebasket: '🗑️',
  key2: '🔑',
  old: '🗝️',
  hammer: '🔨',
  axe: '🪓',
  pick: '⛏️',
  hammer2: '⚒️',
  dagger: '🗡️',
  crossed: '⚔️',
  pistol: '🔫',
  boomerang: '🪃',
  bow: '🏹',
  shield: '🛡️',
  carpentry: '🪚',
  wrench: '🔧',
  screwdriver: '🪛',
  nut: '🔩',
  bolt: '🔩',
  gear2: '⚙️',
  clamp: '🗜️',
  scales: '⚖️',
  medicalProbe: '🩺',
  magnet: '🧲',
  ladder: '🪜',
  alembic: '⚗️',
  testTube: '🧪',
  petri: '🧫',
  dna: '🧬',
  microscope: '🔬',
  telescope: '🔭',
  antenna: '📡',
  needle: '💉',
  drop: '💊',
  blood: '🩸',
  adhesive: '🩹',
  crutch: '🩼',
  xray: '🩻',
  door: '🚪',
  elevator: '🛗',
  mirror: '🪞',
  window: '🪟',
  bed: '🛏️',
  couch: '🛋️',
  chair: '🪑',
  toilet: '🚽',
  plunger: '🪠',
  shower: '🚿',
  bathtub: '🛁',
  mouse3: '🐁',
  ox: '🐂',
  water: '🐃',
  tiger: '🐅',
  rabbit: '🐇',
  dragon: '🐉',
  snake: '🐍',
  horse: '🐎',
  goat: '🐐',
  monkey: '🐒',
  rooster: '🐓',
  dog: '🐕',
  pig: '🐖',
  rat: '🐀',
  cow: '🐄',
  leopard: '🐆',
  rabbit2: '🐇',
  cat: '🐈',
  dragon2: '🐉',
  crocodile: '🐊',
  whale: '🐋',
  snail: '🐌',
  snake2: '🐍',
  horse2: '🐎',
  ram: '🐏',
  goat2: '🐐',
  sheep: '🐑',
  monkey2: '🐒',
  rooster2: '🐓',
  chicken: '🐔',
  dog2: '🐕',
  pig2: '🐖',
  boar: '🐗',
  elephant: '🐘',
  octopus: '🐙',
  shell: '🐚',
  bug: '🐛',
  ant: '🐜',
  honeybee: '🐝',
  lady: '🐞',
  fish2: '🐟',
  tropical2: '🐠',
  blowfish: '🐡',
  turtle: '🐢',
  hatching: '🐣',
  baby: '🐤',
  front: '🐥',
  bird: '🐦',
  penguin: '🐧',
  koala: '🐨',
  poodle: '🐩',
  camel: '🐪',
  two: '🐫',
  dolphin: '🐬',
  mouse4: '🐭',
  cow2: '🐮',
  tiger2: '🐯',
  rabbit3: '🐰',
  cat2: '🐱',
  dragon3: '🐲',
  whale2: '🐳',
  horse3: '🐴',
  monkey3: '🐵',
  dog3: '🐶',
  pig3: '🐷',
  frog: '🐸',
  hamster: '🐹',
  wolf: '🐺',
  bear: '🐻',
  panda: '🐼',
  pig4: '🐽',
  paws: '🐾',
  chipmunk: '🐿️',
  eyes: '👀',
  eye: '👁️',
  ear: '👂',
  nose: '👃',
  mouth: '👄',
  tongue: '👅',
  backhand: '👋',
  raised: '✋',
  ok: '👌',
  victory: '✌️',
  crossed2: '🤞',
  love: '🤟',
  sign: '🤘',
  call: '🤙',
  left: '🤚',
  muscle: '💪',
  mechanical: '🦾',
  leg: '🦵',
  mechanical2: '🦿',
  foot: '🦶',
  ear2: '🦻',
  brain: '🧠',
  anatomical: '🫀',
  lungs: '🫁',
  tooth: '🦷',
  bone: '🦴',
  bust: '👤',
  silhouette: '👥',
  speaking: '👥',
  baby2: '👶',
  girl: '👧',
  boy: '👦',
  woman: '👩',
  man: '👨',
  blond: '👱',
  beard: '🧔',
  older: '👴',
  older2: '👵',
  person: '🧑',
  frowning: '🙍',
  pouting: '🙎',
  no: '🙅',
  ok2: '🙆',
  tipping: '💁',
  raising: '🙋',
  deaf: '🧏',
  bowing: '🙇',
  facepalming: '🤦',
  shrugging: '🤷',
  health: '⛑️',
  student: '🧑‍🎓',
  teacher: '🧑‍🏫',
  judge: '🧑‍⚖️',
  farmer: '🧑‍🌾',
  cook: '🧑‍🍳',
  mechanic: '🧑‍🔧',
  factory2: '🧑‍🏭',
  office: '🧑‍💼',
  scientist: '🧑‍🔬',
  technologist: '🧑‍💻',
  singer: '🧑‍🎤',
  artist: '🧑‍🎨',
  pilot: '🧑‍✈️',
  astronaut: '🧑‍🚀',
  firefighter: '🧑‍🚒',
  police2: '👮',
  guard: '💂',
  ninja: '🥷',
  construction2: '👷',
  person2: '🤴',
  princess: '👸',
  turban: '👳',
  skull: '💀',
  skull2: '☠️',
  ghost: '👻',
  alien: '👽',
  monster: '👾',
  robot: '🤖',
  grinning: '😀',
  grinning2: '😃',
  grinning3: '😄',
  beaming: '😁',
  grinning4: '😆',
  squinting: '😅',
  sweat: '😂',
  rolling: '🤣',
  slightly: '🙂',
  upside: '🙃',
  winking: '😉',
  smiling: '😊',
  halo: '😇',
  smiling2: '🥰',
  heartEyes: '😍',
  starStruck: '🤩',
  blowing: '😘',
  kissing: '😗',
  smiling3: '☺️',
  kissing2: '😚',
  kissing3: '😙',
  smiling4: '🥲',
  savoring: '😋',
  face: '😛',
  winking2: '😜',
  zany: '🤪',
  squinting2: '😝',
  moneyFace: '🤑',
  hugging: '🤗',
  hand: '🤭',
  shushing: '🤫',
  thinking: '🤔',
  zipper: '🤐',
  raisedEyebrow: '🤨',
  neutral: '😐',
  expressionless: '😑',
  without: '😶',
  smirking: '😏',
  unamused: '😒',
  rolling2: '🙄',
  grimacing: '😬',
  exhaling: '😮‍💨',
  lying: '🤥',
  relieved: '😌',
  pensive: '😔',
  sleepy: '😪',
  drooling: '🤤',
  sleeping: '😴',
  mask: '😷',
  thermometer: '🤒',
  head: '🤕',
  nauseated: '🤢',
  vomiting: '🤮',
  sneezing: '🤧',
  hot: '🥵',
  cold: '🥶',
  woozy: '🥴',
  knocked: '😵',
  exploding: '🤯',
  cowboy: '🤠',
  party2: '🥳',
  disguised: '🥸',
  sunglasses: '😎',
  nerd: '🤓',
  monocle: '🧐',
  confused: '😕',
  worried: '😟',
  slightly2: '🙁',
  frowning2: '☹️',
  open: '😮',
  hushed: '😯',
  astonished: '😲',
  flushed: '😳',
  pleading: '🥺',
  frowning3: '😦',
  anguished: '😧',
  fearful: '😨',
  anxious: '😰',
  sad: '😥',
  crying: '😢',
  loudly: '😭',
  screaming: '😱',
  confounded: '😖',
  persevering: '😣',
  disappointed: '😞',
  downcast: '😓',
  weary: '😩',
  tired: '😫',
  yawning: '🥱',
  triumph: '😤',
  rage: '😡',
  angry: '😠',
  symbols: '🤬',
  smiling5: '😈',
  imp: '👿',
  skull3: '💀',
  poop: '💩',
  clown: '🤡',
  ogre: '👹',
  goblin: '👺',
  ghost2: '👻',
  alien2: '👽',
  monster2: '👾',
  robot2: '🤖',
  catFace: '😺',
  grinning5: '😸',
  joy: '😹',
  smiling6: '😻',
  kissing4: '😽',
  weary2: '🙀',
  crying2: '😿',
  pouting2: '😾',
  see: '🙈',
  hear: '🙉',
  speak: '🙊',
  kiss: '💋',
  love2: '❤️',
  beating: '💓',
  broken: '💔',
  two2: '💕',
  sparkling: '💖',
  growing: '💗',
  blueHeart: '💙',
  green2: '💚',
  yellow2: '💛',
  orange2: '🧡',
  purple2: '💜',
  brown: '🤎',
  black2: '🖤',
  white: '🤍',
  hundred: '💯',
  anger: '💢',
  collision: '💥',
  dizzy: '💫',
  sweat2: '💦',
  dash: '💨',
  hole: '🕳️',
  bomb: '💣',
  speech: '💬',
  eye2: '👁️‍🗨️',
  left2: '🗨️',
  right2: '🗯️',
  thought: '💭',
  zzz: '💤',
};

// ==================== 辅助函数 ====================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 导出所有动画效果
export const animations = {
  gradients,
  rainbow,
  gradientText,
  pulse,
  blink,
  neon,
  glow,
  decorativeBorder,
  corner,
  stars,
  arrow,
  bullet,
  typewriter,
  wave,
  twinkle,
  threeD,
  statusEmoji,
  emojiLabel,
  emojis,
};

export default animations;
