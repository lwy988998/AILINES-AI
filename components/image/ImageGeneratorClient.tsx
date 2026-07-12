'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Download, ImageIcon, Loader2, RefreshCw } from 'lucide-react';

type ImageGenerationState = {
  status: 'idle' | 'loading' | 'success' | 'error';
  imageUrl?: string;
  imageBase64?: string;
  mimeType?: string;
  revisedPrompt?: string;
  provider?: string;
  message?: string;
};

type ImageGeneratorClientProps = {
  initialPrompt: string;
};

function buildDataUrl(imageBase64?: string, mimeType = 'image/png') {
  if (!imageBase64) return '';
  return imageBase64.startsWith('data:') ? imageBase64 : `data:${mimeType};base64,${imageBase64}`;
}

export function ImageGeneratorClient({ initialPrompt }: ImageGeneratorClientProps) {
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
        body: JSON.stringify({ prompt, size: '1024x1024' }),
      });
      const result = await response.json() as {
        success?: boolean;
        imageUrl?: string;
        imageBase64?: string;
        mimeType?: string;
        revisedPrompt?: string;
        provider?: string;
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
          provider: result.provider,
        });
        return;
      }

      setState({ status: 'error', message: result.message || '当前生图服务暂时不可用，请稍后重试。' });
    } catch {
      if (requestIdRef.current === requestId) {
        setState({ status: 'error', message: '当前生图服务暂时不可用，请稍后重试。' });
      }
    }
  }

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt]);

  return (
    <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-sky-700">生成需求</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{prompt}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">AILINES AI 会根据你的文字描述尝试生成图片。第一版暂不保存图片，也不上传参考图。</p>
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={state.status === 'loading'}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-sky-700 px-4 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-sky-400"
        >
          {state.status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {state.status === 'loading' ? '正在生成图片...' : '重新生成'}
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
        {state.status === 'loading' ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 p-8 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-sky-700" />
            <div>
              <p className="text-lg font-semibold text-slate-950">正在生成图片...</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">如果当前 provider 不支持生图，会显示友好提示，不会影响学习路线功能。</p>
            </div>
          </div>
        ) : null}

        {state.status === 'success' && imageSrc ? (
          <div className="space-y-4 p-4 sm:p-6">
            <div className="flex justify-center rounded-2xl bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageSrc} alt={prompt} className="max-h-[720px] w-auto max-w-full rounded-2xl object-contain shadow-sm" />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm leading-6 text-slate-600">
                {state.provider ? <p>Provider：{state.provider}</p> : null}
                {state.revisedPrompt ? <p>优化提示词：{state.revisedPrompt}</p> : null}
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
          <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <ImageIcon className="h-7 w-7" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-950">{state.message || '当前生图服务暂时不可用，请稍后重试。'}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">这通常表示当前 AI provider 暂未开放图片生成接口，学习路线、搜索资料和课程持久化功能不受影响。</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={generate}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-sky-700 px-4 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200"
              >
                <RefreshCw className="h-4 w-4" />
                重新生成
              </button>
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
