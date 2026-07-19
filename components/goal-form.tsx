'use client';

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Plus, Sparkles, X } from 'lucide-react';
import { getOrCreateAnonymousId } from '@/lib/anonymousId';
import { defaultImagePromptExamples, defaultStudyPromptExamples, getRandomPromptExamples } from '@/lib/homepagePromptExamples';
import { AilinesGeneratingState } from '@/components/ui/AilinesGeneratingState';
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

type PlanningMode = 'lite' | 'deep' | 'image';

type MembershipMeResponse = {
  permissions?: {
    deep_plan?: boolean;
  };
};

const planningModes: Array<{
  value: PlanningMode;
  title: string;
  description: string;
}> = [
  {
    value: 'lite',
    title: '快速规划',
    description: '快速生成学习路线',
  },
  {
    value: 'deep',
    title: '深度课程',
    description: '搜索资料并生成课程',
  },
  {
    value: 'image',
    title: '生图模式',
    description: '根据描述生成图片',
  },
];

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function GoalForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedModeRef = useRef<PlanningMode>('deep');
  const submitLockRef = useRef(false);
  const [goalValue, setGoalValue] = useState('');
  const [modeValue, setModeValue] = useState<PlanningMode>('deep');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState('');
  const [imageError, setImageError] = useState('');
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);
  const [submittingMode, setSubmittingMode] = useState<PlanningMode>('deep');
  const [canUseDeepPlan, setCanUseDeepPlan] = useState(true);
  const [membershipLoaded, setMembershipLoaded] = useState(false);
  const [promptExamples, setPromptExamples] = useState(defaultStudyPromptExamples);

  useEffect(() => {
    let cancelled = false;

    async function loadMembership() {
      try {
        const anonymousId = getOrCreateAnonymousId();
        const response = await fetch(`/api/membership/me?anonymousId=${encodeURIComponent(anonymousId)}`, { cache: 'no-store' });
        const data = (await response.json().catch(() => ({}))) as MembershipMeResponse;
        if (!cancelled) {
          setCanUseDeepPlan(data.permissions?.deep_plan !== false);
        }
      } catch {
        if (!cancelled) {
          setCanUseDeepPlan(true);
        }
      } finally {
        if (!cancelled) {
          setMembershipLoaded(true);
        }
      }
    }

    void loadMembership();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setPromptExamples(getRandomPromptExamples(modeValue, 5));
  }, [modeValue]);

  useEffect(() => {
    return () => {
      if (selectedImagePreviewUrl) {
        URL.revokeObjectURL(selectedImagePreviewUrl);
      }
    };
  }, [selectedImagePreviewUrl]);

  function clearSelectedImage() {
    if (selectedImagePreviewUrl) {
      URL.revokeObjectURL(selectedImagePreviewUrl);
    }

    setSelectedImageFile(null);
    setSelectedImagePreviewUrl('');
    setImageError('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setImageError('');

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      clearSelectedImage();
      setImageError('请上传图片文件');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      clearSelectedImage();
      setImageError('图片过大，请上传 5MB 以内的图片');
      return;
    }

    if (selectedImagePreviewUrl) {
      URL.revokeObjectURL(selectedImagePreviewUrl);
    }

    setSelectedImageFile(file);
    setSelectedImagePreviewUrl(URL.createObjectURL(file));
  }

  function selectMode(mode: PlanningMode) {
    if (mode === 'deep' && membershipLoaded && !canUseDeepPlan) {
      selectedModeRef.current = 'lite';
      setModeValue('lite');
      setImageError('深度 AILINES AI 规划是 Pro 功能，请升级后使用。已先为你切换到快速规划。');
      return;
    }

    selectedModeRef.current = mode;
    setModeValue(mode);
    setImageError('');
  }

  function routeToTarget(goal: string, mode: PlanningMode) {
    if (mode === 'image') {
      const params = new URLSearchParams({ prompt: goal, mode: 'image', anonymousId: getOrCreateAnonymousId() });
      router.push(`/image?${params.toString()}`);
      return;
    }

    const params = new URLSearchParams({ goal, mode, anonymousId: getOrCreateAnonymousId() });
    router.push(`/plan?${params.toString()}`);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLockRef.current) return;
    setImageError('');

    const goal = goalValue.trim();
    const mode = selectedModeRef.current;

    if (!goal) {
      setImageError(mode === 'image' ? '请输入想生成的图片需求' : '请输入学习需求，或上传一张相关图片');
      return;
    }

    if (mode === 'deep' && membershipLoaded && !canUseDeepPlan) {
      selectedModeRef.current = 'lite';
      setModeValue('lite');
      setImageError('深度 AILINES AI 规划是 Pro 功能，请升级后使用。你可以先使用快速规划，或查看会员方案。');
      return;
    }

    submitLockRef.current = true;

    if (mode === 'image') {
      if (selectedImageFile) {
        setImageError('生图请先使用文字描述。你可以移除图片后继续生成。');
      }
      setSubmittingMode(mode);
      setIsGeneratingImage(true);
      routeToTarget(goal, mode);
      return;
    }

    if (!selectedImageFile) {
      setSubmittingMode(mode);
      setIsSubmittingPlan(true);
      routeToTarget(goal, mode);
      return;
    }

    setSubmittingMode(mode);
    setIsAnalyzingImage(true);
    let didNavigate = false;

    try {
      const formData = new FormData();
      formData.append('image', selectedImageFile);
      formData.append('prompt', goal);
      formData.append('mode', mode);

      const response = await fetch('/api/analyze-image-goal', {
        method: 'POST',
        body: formData,
      });
      const result = (await response.json()) as {
        success?: boolean;
        goal?: string;
        message?: string;
      };

      if (response.ok && result.success && result.goal?.trim()) {
        setIsSubmittingPlan(true);
        const params = new URLSearchParams({ goal: result.goal.trim(), mode, anonymousId: getOrCreateAnonymousId() });
        router.push(`/plan?${params.toString()}`);
        didNavigate = true;
        return;
      }

      if (goal) {
        setImageError(result.message || '图片识别未完成，已按文字描述生成学习路线');
        routeToTarget(goal, mode);
        didNavigate = true;
        return;
      }

      setImageError(result.message || '图片识别未完成，请补充文字描述后重试');
    } catch {
      if (goal) {
        setImageError('图片识别未完成，已按文字描述生成学习路线');
        routeToTarget(goal, mode);
        didNavigate = true;
        return;
      }

      setImageError('图片识别未完成，请补充文字描述后重试');
    } finally {
      if (!didNavigate) {
        submitLockRef.current = false;
        setIsAnalyzingImage(false);
        setIsGeneratingImage(false);
        setIsSubmittingPlan(false);
      }
    }
  }

  const isWorking = isAnalyzingImage || isGeneratingImage || isSubmittingPlan;
  const submitLabel = modeValue === 'image' ? '生成图片' : modeValue === 'lite' ? '开始快速规划' : '生成深度课程';

  return (
    <div className="w-full max-w-full rounded-[24px] border border-slate-200/70 bg-white/95 p-1.5 text-left shadow-xl shadow-sky-950/10 backdrop-blur-md sm:rounded-[28px] sm:p-2.5 sm:shadow-2xl">
      <form onSubmit={handleSubmit}>
        <label htmlFor="learning-goal" className="sr-only">
          你的学习目标
        </label>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        <input type="hidden" name="mode" value={modeValue} />

        <div className="overflow-hidden rounded-[22px] border border-slate-100 bg-white transition focus-within:border-sky-300 focus-within:ring-4 focus-within:ring-sky-100 sm:rounded-[24px]">
          <div className="px-3 pb-3 pt-3 sm:px-5 sm:pb-4 sm:pt-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-sky-800">
              <Sparkles className="h-4 w-4" />
              今天你想学什么？
            </div>
            <textarea
              id="learning-goal"
              name="goal"
              value={goalValue}
              onChange={(event) => setGoalValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder={modeValue === 'image' ? '描述你想生成的图片，例如：未来感 AI 学习助手海报' : '输入你的学习目标，例如：中考英语阅读理解提分、Python 零基础入门、学习摄影构图'}
              rows={4}
              className="block min-h-[92px] w-full resize-none border-0 bg-transparent text-base leading-7 text-slate-950 outline-none placeholder:text-slate-400 sm:min-h-[120px] sm:text-lg lg:min-h-[130px]"
            />
            <div className="mt-2 flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <button
                type="button"
                aria-label="上传图片"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sky-100 bg-sky-50 px-3 text-sm font-semibold text-sky-800 transition hover:border-sky-200 hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300"
              >
                <Plus className="h-4 w-4" />
                上传参考图
              </button>
              <button
                type="submit"
                disabled={isWorking}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 text-sm font-semibold text-white shadow-sm shadow-sky-900/20 transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-sky-400"
              >
                {isAnalyzingImage ? '识别中...' : isWorking ? '准备生成...' : submitLabel}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1 border-t border-slate-100 bg-slate-50/70 p-1 sm:gap-0 sm:p-0">
            {planningModes.map((mode, index) => {
              const selected = modeValue === mode.value;

              return (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => selectMode(mode.value)}
                  aria-pressed={selected}
                  data-mode-option={mode.value}
                  data-selected={selected ? 'true' : 'false'}
                  className={[
                    'min-h-12 w-full rounded-2xl px-2 py-2 text-center transition-all sm:min-h-[92px] sm:rounded-none sm:px-5 sm:py-3 sm:text-left',
                    index > 0 ? 'sm:border-l sm:border-slate-200' : '',
                    'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-400',
                    selected ? 'bg-white text-sky-900 shadow-sm sm:shadow-[inset_0_3px_0_#0284c7]' : 'text-slate-600 hover:bg-white hover:text-slate-950',
                  ].join(' ')}
                >
                  <span className="flex items-center justify-center gap-1 text-xs font-semibold sm:justify-start sm:gap-2 sm:text-base">
                    {mode.title}
                    {mode.value === 'deep' ? <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-700">推荐</span> : null}
                    {mode.value === 'deep' && membershipLoaded && !canUseDeepPlan ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">Pro</span> : null}
                  </span>
                  <span className="mt-1 hidden text-xs leading-5 text-slate-500 sm:block sm:text-sm">{mode.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedImageFile && selectedImagePreviewUrl ? (
          <div className="mt-2.5 flex items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50/70 p-3 text-left">
            <img
              src={selectedImagePreviewUrl}
              alt={selectedImageFile.name || '已上传图片预览'}
              className="h-16 w-16 shrink-0 rounded-xl border border-white object-cover shadow-sm"
            />
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-semibold text-slate-900">{selectedImageFile.name}</p>
              <p className="mt-1 text-xs text-slate-500">{formatFileSize(selectedImageFile.size)} · {modeValue === 'image' ? '生图请先使用文字描述' : '将结合图片内容生成学习目标'}</p>
            </div>
            <button
              type="button"
              aria-label="移除图片"
              onClick={clearSelectedImage}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {imageError ? (
          <div className="mt-2.5 rounded-2xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
            <p>{imageError}</p>
            {imageError.includes('Pro 功能') ? <a href="/membership" className="mt-2 inline-flex font-semibold text-sky-800 underline underline-offset-4">查看会员方案</a> : null}
          </div>
        ) : null}
      </form>

      {(isSubmittingPlan || isGeneratingImage || isAnalyzingImage) ? (
        <div className="mt-4 text-left">
          <AilinesGeneratingState
            type={submittingMode === 'image' ? 'image' : submittingMode === 'lite' ? 'lite-plan' : 'deep-plan'}
            compact
            showSkeleton={false}
            estimatedSeconds={submittingMode === 'lite' ? 8 : submittingMode === 'image' ? 18 : 22}
          />
        </div>
      ) : null}

      <div className="mobile-prompt-examples mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center sm:overflow-visible sm:pb-0">
        {(promptExamples.length > 0 ? promptExamples : modeValue === 'image' ? defaultImagePromptExamples : defaultStudyPromptExamples).map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setGoalValue(example)}
            className="shrink-0 whitespace-nowrap rounded-full border border-sky-100 bg-white/70 px-3 py-2 text-sm font-medium text-sky-900 transition hover:border-sky-200 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300 sm:min-w-0 sm:whitespace-normal sm:break-words"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
