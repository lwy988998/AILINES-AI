'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Download, ImageIcon, RefreshCw } from 'lucide-react';
import { getOrCreateAnonymousId } from '@/lib/anonymousId';
import { AilinesGeneratingState } from '@/components/ui/AilinesGeneratingState';

type ImageGenerationState = {
  status: 'idle' | 'loading' | 'success' | 'error';
  imageUrl?: string;
  imageBase64?: string;
  mimeType?: string;
  revisedPrompt?: string;
  message?: string;
};

type ImageGeneratorClientProps = {
  initialPrompt: string;
  anonymousId?: string;
};

function buildDataUrl(imageBase64?: string, mimeType = 'image/png') {
  if (!imageBase64) return '';
  return imageBase64.startsWith('data:') ? imageBase64 : `data:${mimeType};base64,${imageBase64}`;
}

export function ImageGeneratorClient({ initialPrompt, anonymousId }: ImageGeneratorClientProps) {
  const [state, setState] = useState<ImageGenerationState>({ status: 'loading' });
  const requestIdRef = useRef(0);
  const prompt = initialPrompt.trim();
  const imageSrc = useMemo(() => state.imageUrl || buildDataUrl(state.imageBase64, state.mimeType), [state.imageBase64, state.imageUrl, state.mimeType]);

  async function generate() {
    if (!prompt) {
      setState({ status: 'error', message: '请输入图片需求。' });
      return;
    }

    const requestId = Date.now();
    requestIdRef.current = requestId;
    setState({ status: 'loading' });

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, size: '1024x1024', anonymousId: anonymousId || getOrCreateAnonymousId() }),
      });
      const result = await response.json() as {
        success?: boolean;
        imageUrl?: string;
        imageBase64?: string;
        mimeType?: string;
        revisedPrompt?: string;
        message?: string;
      };

      if (requestIdRef.current !== requestId) return;

      if (response.ok && result.success && (result.imageUrl || result.imageBase64)) {
        setState({
          status: 'success',
          imageUrl: result.imageUrl,
          imageBase64: result.imageBase64,
          mimeType: result.mimeType || 'image/png',
          revisedPrompt: result.revisedPrompt,
        });
        return;
      }

      setState({ status: 'error', message: '图片生成未完成' });
    } catch {
      if (requestIdRef.current === requestId) {
        setState({ status: 'error', message: '图片生成未完成' });
      }
    }
  }

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt]);

  return (
    <section className="min-w-0 rounded-3xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-900/5 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-sky-700">生成需求</p>
          <h1 className="mt-2 break-words text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{prompt}</h1>
          <p className="mt-3 max-w-3xl break-words text-sm leading-6 text-slate-600">AILINES AI 会根据你的描述生成图片。你可以调整描述重新生成，也可以在结果完成后保存图片。</p>
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={state.status === 'loading'}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-sky-700 px-4 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-sky-400"
        >
          <RefreshCw className={`h-4 w-4 ${state.status === 'loading' ? 'motion-safe:animate-pulse' : ''}`} />
          {state.status === 'loading' ? '生成中' : '重新生成'}
        </button>
      </div>

      <div className="mt-6 max-w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
        {state.status === 'loading' ? (
          <div className="max-w-full bg-[#f5f9ff] p-3 sm:p-6">
            <AilinesGeneratingState type="image" />
          </div>
        ) : null}

        {state.status === 'success' && imageSrc ? (
          <div className="space-y-4 p-4 sm:p-6">
            <div className="flex justify-center rounded-2xl bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageSrc} alt={prompt} className="max-h-[720px] w-auto max-w-full rounded-2xl object-contain shadow-sm" />
            </div>
            <div className="flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 break-words text-sm leading-6 text-slate-600">
                {state.revisedPrompt ? <p>优化描述：{state.revisedPrompt}</p> : null}
              </div>
              <a
                href={imageSrc}
                download="ailines-ai-image.png"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-white px-4 text-sm font-semibold text-sky-800 transition hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-100"
              >
                <Download className="h-4 w-4" />
                下载图片
              </a>
            </div>
          </div>
        ) : null}

        {state.status === 'error' ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 p-4 text-center sm:min-h-[420px] sm:p-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <ImageIcon className="h-7 w-7" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-950">{state.message || '图片生成未完成'}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">这次图片没有成功生成。你可以稍后重试，或调整描述后再次生成。</p>
            </div>
            <div className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={generate}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-sky-700 px-4 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200"
              >
                <RefreshCw className="h-4 w-4" />
                重新生成
              </button>
              <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-100">
                修改描述
              </Link>
              <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-100">
                返回首页
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
