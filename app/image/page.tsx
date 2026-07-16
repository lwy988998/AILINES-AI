import Link from 'next/link';
import { ArrowLeft, Home, ImageIcon } from 'lucide-react';
import { ImageGeneratorClient } from '@/components/image/ImageGeneratorClient';
import { SiteHeader } from '@/components/site-header';

export const dynamic = 'force-dynamic';

type ImagePageProps = {
  searchParams: Promise<{
    prompt?: string;
    mode?: string;
    anonymousId?: string;
  }>;
};

function decodeValue(value: string | undefined) {
  return value?.trim() || '';
}

function createRegenerateHref(prompt: string, anonymousId?: string) {
  const params = new URLSearchParams({ prompt, mode: 'image', regenerate: String(Date.now()) });
  if (anonymousId) params.set('anonymousId', anonymousId);
  return `/image?${params.toString()}`;
}

export default async function ImagePage({ searchParams }: ImagePageProps) {
  const params = await searchParams;
  const prompt = decodeValue(params.prompt);
  const anonymousId = decodeValue(params.anonymousId);
  const regenerateHref = prompt ? createRegenerateHref(prompt, anonymousId) : '/';

  return (
    <main className="min-h-screen bg-[#f5f9ff]">
      <SiteHeader />
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-900/5 sm:p-8">
          <div className="flex flex-wrap gap-3">
            <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-100">
              <ArrowLeft className="h-4 w-4" />
              返回首页
            </Link>
            {prompt ? (
              <Link href={regenerateHref} className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-800 transition hover:border-sky-300 hover:bg-sky-100 focus:outline-none focus:ring-4 focus:ring-sky-100">
                <ImageIcon className="h-4 w-4" />
                重新生成
              </Link>
            ) : null}
          </div>

          <div className="mt-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800">
              <ImageIcon className="h-4 w-4" />
              AILINES AI 图片生成
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">AILINES AI 图片生成</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
              AILINES AI 会根据你的描述生成图片。描述越具体，画面越接近你的预期。
            </p>
          </div>
        </section>

        {prompt ? (
          <ImageGeneratorClient initialPrompt={prompt} anonymousId={anonymousId} />
        ) : (
          <section className="rounded-3xl border border-sky-100 bg-white p-8 text-center shadow-sm shadow-sky-900/5">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-50 text-sky-700">
              <ImageIcon className="h-8 w-8" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-slate-950">请输入图片需求</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
              回到首页选择“生图模式”，描述你想生成的图片，例如：未来感 AI 学习助手海报。
            </p>
            <Link href="/" className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-sky-700 px-5 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200">
              <Home className="h-4 w-4" />
              返回首页
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
