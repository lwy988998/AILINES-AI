import { NextRequest, NextResponse } from 'next/server';
import { AIClientError, createChatCompletion, getAIRequestTimeoutMs, toSafeAIError } from '@/lib/ai/aiClient';
import { parseAIJson } from '@/lib/ai/parseAIJson';
import type { PlanMode } from '@/lib/ai/types';

const DEFAULT_IMAGE_TIMEOUT_MS = 25_000;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

type ImageGoalAnalysis = {
  goal: string;
  summary: string;
  keywords: string[];
  suggestedSearchQuery: string;
};

function getImageTimeoutMs() {
  const configuredTimeout = Number(process.env.AI_IMAGE_TIMEOUT_MS);
  return Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : getAIRequestTimeoutMs(DEFAULT_IMAGE_TIMEOUT_MS);
}

function normalizePrompt(prompt: FormDataEntryValue | null) {
  return typeof prompt === 'string' ? prompt.trim() : '';
}

function normalizeMode(mode: FormDataEntryValue | null): PlanMode {
  return mode === 'lite' ? 'lite' : 'deep';
}

function fallbackGoal(prompt: string) {
  return prompt.trim();
}

function createFallbackResponse(prompt: string, mode: PlanMode, message = '图片识别未完成，请补充文字描述后重试', status = 200) {
  return NextResponse.json({
    success: false,
    message,
    goal: fallbackGoal(prompt),
    mode,
  }, { status });
}

function isValidAnalysis(value: unknown): value is ImageGoalAnalysis {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const analysis = value as ImageGoalAnalysis;

  return (
    typeof analysis.goal === 'string' &&
    analysis.goal.trim().length > 0 &&
    typeof analysis.summary === 'string' &&
    Array.isArray(analysis.keywords) &&
    analysis.keywords.every((keyword) => typeof keyword === 'string') &&
    typeof analysis.suggestedSearchQuery === 'string'
  );
}

function logImageFallback(error: unknown, mode: PlanMode, promptLength: number, imageBytes?: number) {
  const safeError = error instanceof AIClientError ? error : toSafeAIError(error, 'unknown');
  console.warn('Image goal analysis fallback', {
    errorType: safeError.type,
    status: safeError.status,
    mode,
    promptLength,
    imageBytes,
  });
}

export async function POST(request: NextRequest) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ success: false, message: '请上传图片文件', goal: '', mode: 'deep' }, { status: 400 });
  }

  const image = formData.get('image');
  const prompt = normalizePrompt(formData.get('prompt'));
  const mode = normalizeMode(formData.get('mode'));

  if (!(image instanceof File)) {
    return createFallbackResponse(prompt, mode, '请上传图片文件', 400);
  }

  if (!image.type.startsWith('image/')) {
    return createFallbackResponse(prompt, mode, '请上传图片文件', 400);
  }

  if (image.size > MAX_IMAGE_SIZE_BYTES) {
    return createFallbackResponse(prompt, mode, '图片过大，请上传 5MB 以内的图片', 413);
  }

  const imageBuffer = Buffer.from(await image.arrayBuffer());
  const imageDataUrl = `data:${image.type};base64,${imageBuffer.toString('base64')}`;
  const visionModel = process.env.AI_VISION_MODEL || process.env.VISION_MODEL || process.env.AI_MODEL || process.env.OPENAI_MODEL;

  try {
    const content = await createChatCompletion({
      purpose: 'image',
      model: visionModel,
      messages: [
        {
          role: 'system',
          content:
            '你是 AILINES AI 的图片学习需求识别器。用户会上传学习相关图片，可能是题目、代码、报错、公式、界面截图或资料截图。请识别图片中的核心问题，并结合用户文字提示，输出适合生成学习路线的目标。不要编造图片中不存在的信息。不要输出 mode，不要推荐或改变生成模式；用户选择的模式由前端继续保留。请只返回 JSON，包含 goal、summary、keywords、suggestedSearchQuery。',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `用户文字提示：${prompt || '未提供'}\n用户已经选择的生成模式：${mode === 'lite' ? '快速规划 mode=lite' : '深度 AILINES AI 规划 mode=deep'}\n必须保留用户选择的模式，不要根据图片复杂度建议或输出新的 mode。请根据图片和文字生成一个清晰、可用于学习路线生成和真实资料搜索的学习目标。`,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageDataUrl,
              },
            },
          ],
        },
      ],
      temperature: 0.2,
      maxTokens: 700,
      responseFormat: 'json_object',
      timeoutMs: getImageTimeoutMs(),
    });

    const analysis = parseAIJson<ImageGoalAnalysis>(content);

    if (!isValidAnalysis(analysis)) {
      throw new AIClientError('invalid_response', 'Image analysis schema invalid');
    }

    return NextResponse.json({
      success: true,
      goal: analysis.goal.trim(),
      summary: analysis.summary.trim(),
      keywords: analysis.keywords.map((keyword) => keyword.trim()).filter(Boolean).slice(0, 8),
      suggestedSearchQuery: analysis.suggestedSearchQuery.trim(),
      mode,
    });
  } catch (error) {
    logImageFallback(error, mode, prompt.length, image.size);
    return createFallbackResponse(prompt, mode);
  }
}

export async function GET() {
  return NextResponse.json({ error: '请求方式不支持。' }, { status: 405 });
}
