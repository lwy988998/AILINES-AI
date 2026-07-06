import type { LearningDomain } from '@/lib/learningDomain';

export type ResourceType =
  | '官方文档'
  | '在线课程'
  | '视频教程'
  | '图文教程'
  | '开源项目'
  | '工具环境'
  | '项目实战'
  | '练习题库'
  | '社区资源'
  | '其他';

export type ResourceDifficulty = '入门' | '中级' | '进阶';
export type ResourceLanguage = '中文' | '英文' | '其他';

export type SearchResource = {
  title: string;
  url: string;
  source: string;
  type: ResourceType;
  difficulty: ResourceDifficulty;
  language: ResourceLanguage;
  free: boolean;
  description: string;
  reason: string;
  score: number;
};

export type SearchResourcesResult = {
  goal: string;
  domain: LearningDomain;
  queries: string[];
  resources: SearchResource[];
  cache: 'hit' | 'miss';
};
