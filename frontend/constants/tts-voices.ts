import type { VoiceOption } from '@/types/tts';

export const TTS_VOICE_OPTIONS: VoiceOption[] = [
  {
    group: '通用场景',
    label: '小何 2.0',
    value: 'zh_female_xiaohe_uranus_bigtts',
    language: '中文',
    capabilities: '自然播报、情绪变化、长文本',
  },
  {
    group: '通用场景',
    label: 'Vivi 2.0',
    value: 'zh_female_vv_uranus_bigtts',
    language: '中文 / 日文',
    capabilities: '口语表达、轻情绪、ASMR',
  },
  {
    group: '通用场景',
    label: '云川 2.0',
    value: 'zh_male_m191_uranus_bigtts',
    language: '中文',
    capabilities: '稳定播报、资讯口播',
  },
  {
    group: '视频配音',
    label: '佩奇 2.0',
    value: 'zh_female_peiqi_uranus_bigtts',
    language: '中文',
    capabilities: '短视频、剧情旁白',
  },
  {
    group: '视频配音',
    label: '孙悟空 2.0',
    value: 'zh_male_sunwukong_uranus_bigtts',
    language: '中文',
    capabilities: '角色演绎、夸张表达',
  },
  {
    group: '教育场景',
    label: 'Tina 老师 2.0',
    value: 'zh_female_yingyujiaoxue_uranus_bigtts',
    language: '中文 / 英语',
    capabilities: '教学口播、清晰咬字',
  },
  {
    group: '多语言',
    label: 'Tim',
    value: 'en_male_tim_uranus_bigtts',
    language: '美式英语',
    capabilities: '英文播报、产品演示',
  },
  {
    group: '多语言',
    label: 'Dacey',
    value: 'en_female_dacey_uranus_bigtts',
    language: '美式英语',
    capabilities: '客服语气、柔和表达',
  },
];

export const TTS_VOICE_GROUPS = Array.from(
  new Set(TTS_VOICE_OPTIONS.map((voice) => voice.group))
);

export const DEFAULT_TTS_VOICE = 'zh_female_xiaohe_uranus_bigtts';
