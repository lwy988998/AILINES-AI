import { prisma } from '@/lib/db/prisma';

type AttachAnonymousDataInput = {
  anonymousId?: string | null;
  userId: string;
};

function normalizeAnonymousId(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

export async function attachAnonymousDataToUser({ anonymousId, userId }: AttachAnonymousDataInput) {
  const safeAnonymousId = normalizeAnonymousId(anonymousId);
  if (!safeAnonymousId) return { attached: false, counts: {} as Record<string, number> };

  try {
    const [courses, courseProgress] = await prisma.$transaction([
      prisma.course.updateMany({
        where: { anonymousId: safeAnonymousId, userId: null },
        data: { userId },
      }),
      prisma.courseProgress.updateMany({
        where: { anonymousId: safeAnonymousId, userId: null },
        data: { userId },
      }),
    ]);

    return {
      attached: true,
      counts: {
        Course: courses.count,
        CourseProgress: courseProgress.count,
      },
    };
  } catch (error) {
    console.warn('attach anonymous data failed', error instanceof Error ? error.message : 'unknown');
    return { attached: false, warning: '匿名数据绑定失败，已继续登录' };
  }
}
