export type MembershipTier = 'free' | 'pro' | 'max';

export type UsageType = 'course_generate' | 'learn_generate' | 'image_generate' | 'assistant_chat';

export const MEMBERSHIP_LIMITS = {
  free: {
    courseGeneratePerDay: 3,
    learnGeneratePerDay: 3,
    imageGeneratePerDay: 1,
    assistantChatPerDay: 3,
    allowDeepPlan: false,
    allowImageGeneration: true,
    allowCourseSlides: false,
    allowMindMap: false,
    allowAssistantChat: false,
  },
  pro: {
    courseGeneratePerDay: 30,
    learnGeneratePerDay: 50,
    imageGeneratePerDay: 20,
    assistantChatPerDay: 100,
    allowDeepPlan: true,
    allowImageGeneration: true,
    allowCourseSlides: true,
    allowMindMap: true,
    allowAssistantChat: true,
  },
  max: {
    courseGeneratePerDay: 200,
    learnGeneratePerDay: 300,
    imageGeneratePerDay: 100,
    assistantChatPerDay: 1000,
    allowDeepPlan: true,
    allowImageGeneration: true,
    allowCourseSlides: true,
    allowMindMap: true,
    allowAssistantChat: true,
  },
} as const;

export function normalizeMembershipTier(value?: string | null): MembershipTier {
  return value === 'pro' || value === 'max' ? value : 'free';
}

export function getMembershipLabel(tier?: string | null) {
  const normalized = normalizeMembershipTier(tier);
  if (normalized === 'pro') return 'Pro';
  if (normalized === 'max') return 'Max';
  return 'Free';
}

export function getMembershipLimits(tier?: string | null) {
  return MEMBERSHIP_LIMITS[normalizeMembershipTier(tier)];
}

export function getUsageLimitForType(tier: MembershipTier, type: UsageType) {
  const limits = getMembershipLimits(tier);
  switch (type) {
    case 'course_generate':
      return limits.courseGeneratePerDay;
    case 'learn_generate':
      return limits.learnGeneratePerDay;
    case 'image_generate':
      return limits.imageGeneratePerDay;
    case 'assistant_chat':
      return limits.assistantChatPerDay;
  }
}
