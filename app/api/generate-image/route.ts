import { NextRequest, NextResponse } from 'next/server';
import { ImageGenerationError, generateImage } from '@/lib/ai/generateImage';
import { getCurrentUserFromRequest } from '@/lib/auth/currentUser';
import { checkUsageLimit, incrementUsage } from '@/lib/membership/usage';

const MAX_PROMPT_LENGTH = 2_000;

function optionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: '请求内容格式不正确。' }, { status: 400 });
  }

  const data = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const prompt = optionalString(data.prompt) || '';
  const anonymousId = optionalString(data.anonymousId);

  if (!prompt) {
    return NextResponse.json({ success: false, message: '请输入图片需求。' }, { status: 400 });
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    return NextResponse.json({ success: false, message: '图片需求过长，请精简到 2000 字以内。' }, { status: 400 });
  }

  const user = await getCurrentUserFromRequest(request);
  const usage = await checkUsageLimit({ userId: user?.id, anonymousId, tier: user?.membershipTier, type: 'image_generate' });
  if (!usage.allowed) {
    return NextResponse.json({
      success: false,
      message: '今日生图次数已用完，升级会员可获得更多额度。',
      usage,
    }, { status: 200 });
  }

  try {
    await incrementUsage('image_generate', usage.scope);
    const result = await generateImage({
      prompt,
      size: optionalString(data.size),
      style: optionalString(data.style),
    });

    return NextResponse.json({
      success: true,
      imageUrl: result.imageUrl,
      imageBase64: result.imageBase64,
      mimeType: result.mimeType,
      revisedPrompt: result.revisedPrompt,
      provider: result.provider,
      usage: { ...usage, used: usage.used + 1, remaining: Math.max(usage.remaining - 1, 0) },
    });
  } catch (error) {
    const safeError = error instanceof ImageGenerationError ? error : new ImageGenerationError();
    console.warn('generate image api fallback', {
      errorType: safeError.type,
      status: safeError.status,
      promptLength: prompt.length,
    });

    return NextResponse.json({
      success: false,
      message: '生图暂不可用',
    }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}
