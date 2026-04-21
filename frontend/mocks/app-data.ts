import type {
  AppTool,
  GameItem,
  ProfileMenuItem,
  ProfileMetric,
  RecentActivity,
  ToolId,
  UserProfile,
} from '@/types/app';

export const featuredBanner = {
  eyebrow: '今日推荐',
  title: '把工具、游戏和成长任务收进一个轻量移动入口',
  description: '先把高频刚需能力做好，再逐步扩展更多可玩和可用的体验模块。',
  actionLabel: '查看热门内容',
};

export const appTools: AppTool[] = [
  {
    id: 'text-to-speech',
    name: '文字转语音',
    tagline: '现有能力已接入',
    description: '输入文案、选择音色和格式，直接生成可预览的配音文件。',
    icon: 'waveform',
    category: '音频',
    route: '/tools/text-to-speech',
    accentColor: '#1f4d78',
    badges: ['高频', '可用'],
    usageLabel: '立即使用',
    status: 'available',
    featured: true,
  },
  {
    id: 'image-cleanup',
    name: '一键抠图',
    tagline: '图片处理',
    description: '常用素材处理入口已预留，便于后续继续接入图像能力。',
    icon: 'image-filter-center-focus',
    category: '多媒体',
    route: '/tools/image-cleanup',
    accentColor: '#c56b47',
    badges: ['热门', '预留'],
    usageLabel: '查看规划',
    status: 'coming-soon',
    featured: true,
  },
  {
    id: 'smart-translation',
    name: '智能翻译',
    tagline: 'AI 语境增强翻译',
    description: '支持自动识别、场景和风格控制、多版本输出、翻译解释与历史记录的语言工作台。',
    icon: 'translate',
    category: 'AI',
    route: '/tools/smart-translation',
    accentColor: '#1f7b63',
    badges: ['多语言', 'MVP'],
    usageLabel: '进入工作台',
    status: 'available',
    featured: true,
  },
  {
    id: 'focus-plan',
    name: '效率清单',
    tagline: '任务管理',
    description: '用于承接任务编排、每日目标和持续打卡等效率能力。',
    icon: 'clipboard-check-outline',
    category: '效率',
    route: '/tools/focus-plan',
    accentColor: '#7e5bef',
    badges: ['效率'],
    usageLabel: '查看规划',
    status: 'coming-soon',
  },
];

export const recentActivities: RecentActivity[] = [
  {
    id: 'recent-tts',
    title: '品牌欢迎词配音',
    type: '工具',
    actionLabel: '继续生成',
    toolId: 'text-to-speech',
  },
  {
    id: 'recent-translation',
    title: '智能翻译工作台',
    type: '工具',
    actionLabel: '继续翻译',
    toolId: 'smart-translation',
  },
];

export const popularGames: GameItem[] = [
  {
    id: 'snake-brawl',
    name: '贪吃蛇大作战',
    genre: '休闲街机',
    tag: '可玩',
    description: '经典、无尽、闯关三种模式，支持方向键和移动端按键控制。',
    accentColor: '#20c997',
    route: '/games/snake-brawl',
    status: 'playable',
  },
  {
    id: 'brain-challenge',
    name: '脑力挑战',
    genre: '益智闯关',
    tag: '新游',
    description: '拼图和记忆玩法原型位，后续可扩展成关卡型轻游戏。',
    accentColor: '#ff8a5b',
    route: '/games/brain-challenge',
    status: 'coming-soon',
  },
  {
    id: 'speed-racer',
    name: '极速冲刺',
    genre: '即时竞速',
    tag: '预告',
    description: '保留竞速类游戏位，用于后续补充更强节奏感的玩法。',
    accentColor: '#4f7cff',
    route: '/games/speed-racer',
    status: 'coming-soon',
  },
];

export const profile = {
  user: {
    name: 'Brynn',
    id: '102438',
    membership: '普通会员',
    signature: '把高频内容工具做成轻量、顺手、可持续的移动端体验。',
  } satisfies UserProfile,
  metrics: [
    { id: 'points', label: '积分', value: '1280' },
    { id: 'favorites', label: '收藏', value: '12' },
    { id: 'active', label: '在用工具', value: '5' },
  ] satisfies ProfileMetric[],
  benefits: [
    { id: 'coupon', label: '优惠券', value: '3 张' },
    { id: 'trial', label: '会员体验', value: '7 天' },
    { id: 'quota', label: '工具次数', value: '20 次' },
  ] satisfies ProfileMetric[],
  menus: [
    { id: 'recent', title: '最近使用' },
    { id: 'favorites', title: '我的收藏' },
    { id: 'games', title: '我的游戏', badge: '2' },
    { id: 'tasks', title: '任务中心' },
    { id: 'membership', title: '会员中心' },
    { id: 'feedback', title: '帮助与反馈' },
    { id: 'settings', title: '设置' },
  ] satisfies ProfileMenuItem[],
  growthTask: {
    title: '成长任务',
    description: '连续签到 3 天，可再领取 50 积分。',
    actionLabel: '去完成',
  },
};

export function getToolById(toolId: ToolId) {
  return appTools.find((tool) => tool.id === toolId);
}

export function getGameById(gameId: GameItem['id']) {
  return popularGames.find((game) => game.id === gameId);
}
