import { getMembershipLabel, normalizeMembershipTier, type MembershipTier } from '@/lib/membership/tiers';

export type MembershipFeature =
  | 'quick_plan'
  | 'deep_plan'
  | 'course_slides'
  | 'mind_map'
  | 'learn_generation'
  | 'image_generation'
  | 'assistant_chat'
  | 'course_history'
  | 'progress_sync';

export type FeatureAccessResult = {
  allowed: boolean;
  requiredTier?: MembershipTier;
  reason?: string;
};

const FEATURE_REQUIRED_TIER: Partial<Record<MembershipFeature, MembershipTier>> = {
  deep_plan: 'pro',
  course_slides: 'pro',
  mind_map: 'pro',
  assistant_chat: 'pro',
};

const FREE_ALLOWED_FEATURES = new Set<MembershipFeature>([
  'quick_plan',
  'learn_generation',
  'image_generation',
  'course_history',
  'progress_sync',
]);

type MembershipAccessInput = {
  tier?: string | null;
  status?: string | null;
  expiresAt?: string | Date | null;
};

function normalizeMembershipStatus(value?: string | null) {
  return String(value || 'active').trim().toLowerCase();
}

function isMembershipActive(input: MembershipAccessInput) {
  if (normalizeMembershipStatus(input.status) !== 'active') return false;
  if (!input.expiresAt) return true;

  const expiresAtMs = input.expiresAt instanceof Date ? input.expiresAt.getTime() : new Date(input.expiresAt).getTime();
  return Number.isFinite(expiresAtMs) && expiresAtMs > Date.now();
}

export function canUseFeature(tierValue: string | null | undefined | MembershipAccessInput, feature: MembershipFeature): FeatureAccessResult {
  const membership = typeof tierValue === 'object' && tierValue !== null ? tierValue : { tier: tierValue };
  const tier = normalizeMembershipTier(membership.tier);

  if (tier !== 'free' && !isMembershipActive(membership)) {
    const requiredTier = FEATURE_REQUIRED_TIER[feature] || 'pro';
    return {
      allowed: FREE_ALLOWED_FEATURES.has(feature),
      requiredTier,
      reason: '会员状态未生效或已过期，请检查会员状态后重试。',
    };
  }

  if (tier === 'max') return { allowed: true };
  if (tier === 'pro') return { allowed: true };
  if (FREE_ALLOWED_FEATURES.has(feature)) return { allowed: true };

  const requiredTier = FEATURE_REQUIRED_TIER[feature] || 'pro';
  return {
    allowed: false,
    requiredTier,
    reason: getUpgradeMessage(feature, requiredTier),
  };
}

export function getUpgradeMessage(feature: MembershipFeature, requiredTier: MembershipTier = 'pro') {
  const label = getMembershipLabel(requiredTier);

  switch (feature) {
    case 'deep_plan':
      return `深度 AILINES AI 规划是 ${label} 功能。你可以升级会员，或先使用快速规划。`;
    case 'course_slides':
      return `课程课件是 ${label} 功能，升级后可查看完整课件卡片。`;
    case 'mind_map':
      return `思维导图是 ${label} 功能，升级后可查看完整知识结构。`;
    case 'assistant_chat':
      return `浮动 AILINES AI 学习助手是 ${label} 功能，升级后可在学习页面随时追问。`;
    case 'image_generation':
      return `生图能力需要 ${label} 权限。`;
    case 'learn_generation':
      return `学习卡片生成需要 ${label} 权限。`;
    case 'quick_plan':
      return '快速规划当前对所有会员开放。';
    case 'course_history':
      return '历史课堂当前对所有会员开放。';
    case 'progress_sync':
      return '学习进度保存当前对所有会员开放。';
    default:
      return `该功能需要 ${label} 会员。`;
  }
}

export function getMembershipPermissions(tier: string | null | undefined | MembershipAccessInput) {
  const features: MembershipFeature[] = [
    'quick_plan',
    'deep_plan',
    'course_slides',
    'mind_map',
    'learn_generation',
    'image_generation',
    'assistant_chat',
    'course_history',
    'progress_sync',
  ];

  return Object.fromEntries(features.map((feature) => [feature, canUseFeature(tier, feature).allowed])) as Record<MembershipFeature, boolean>;
}
