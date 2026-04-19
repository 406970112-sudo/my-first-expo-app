import type MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';

export type AppIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export type ToolId =
  | 'text-to-speech'
  | 'image-cleanup'
  | 'smart-translation'
  | 'focus-plan';

export type ToolCategory = 'AI' | '音频' | '效率' | '多媒体';
export type ToolStatus = 'available' | 'coming-soon';

export type AppTool = {
  id: ToolId;
  name: string;
  tagline: string;
  description: string;
  icon: AppIconName;
  category: ToolCategory;
  route: `/tools/${ToolId}`;
  accentColor: string;
  badges: string[];
  usageLabel: string;
  status: ToolStatus;
  featured?: boolean;
};

export type RecentActivity = {
  id: string;
  title: string;
  type: '工具' | '游戏';
  actionLabel: string;
  toolId?: ToolId;
};

export type GameItem = {
  id: string;
  name: string;
  genre: string;
  tag: string;
};

export type ProfileMetric = {
  id: string;
  label: string;
  value: string;
};

export type ProfileMenuItem = {
  id: string;
  title: string;
  badge?: string;
};

export type UserProfile = {
  name: string;
  id: string;
  membership: string;
  signature: string;
};
