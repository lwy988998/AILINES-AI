'use client';

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Plus, X } from 'lucide-react';
import { getOrCreateAnonymousId } from '@/lib/anonymousId';

const homepageExamples = ['GPT 高效使用', 'Python 数据分析', 'React 前端开发', '三角函数'];
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
    description: '快速生成基础学习方案',
  },
  {
    value: 'deep',
    title: '深度 AILINES AI 规划',
    description: '完整生成路线、资料和实战路径',
  },
  {
    value: 'image',
    title: '生图模式',
    description: '根据需求生成对应图片',
  },
];

const imageExamples = ['AI 学习助手海报', '赛博朋克风格机器人老师', '高中数学知识图谱插画', '极简蓝色科技 Logo 背景'];

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
  const [goalValue, setGoalValue] = useState('');
  const [modeValue, setModeValue] = useState<PlanningMode>('deep');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState('');
  const [imageError, setImageError] = useState('');
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [canUseDeepPlan, setCanUseDeepPlan] = useState(true);
  const [membershipLoaded, setMembershipLoaded] = useState(false);

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

    if (mode === 'image') {
      if (selectedImageFile) {
        setImageError('当前生图模式暂只支持文字描述，参考图能力后续开放。');
      }
      setIsGeneratingImage(true);
      routeToTarget(goal, mode);
      return;
    }

    if (!selectedImageFile) {
      routeToTarget(goal, mode);
      return;
    }

    setIsAnalyzingImage(true);

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
        const params = new URLSearchParams({ goal: result.goal.trim(), mode });
        router.push(`/plan?${params.toString()}`);
        return;
      }

      if (goal) {
        setImageError(result.message || '图片识别暂不可用，已按文字描述生成学习路线');
        routeToTarget(goal, mode);
        return;
      }

      setImageError(result.message || '图片识别暂不可用，请补充文字描述');
    } catch {
      if (goal) {
        setImageError('图片识别暂不可用，已按文字描述生成学习路线');
        routeToTarget(goal, mode);
        return;
      }

      setImageError('图片识别暂不可用，请补充文字描述');
    } finally {
      setIsAnalyzingImage(false);
      setIsGeneratingImage(false);
    }
  }

  return (
    <div className="rounded-[2rem] border border-white/70 bg-white/72 p-4 shadow-2xl shadow-sky-950/20 backdrop-blur-md sm:p-5">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label htmlFor="learning-goal" className="sr-only">
          你的学习目标
        </label>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex min-h-14 flex-1 items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/90 px-2 transition hover:border-sky-300 focus-within:border-sky-500 focus-within:ring-4 focus-within:ring-sky-100">
            <button
              type="button"
              aria-label="上传图片"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-800 transition hover:border-sky-200 hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300"
            >
              <Plus className="h-5 w-5" />
            </button>
            <input
              id="learning-goal"
              name="goal"
              value={goalValue}
              onChange={(event) => setGoalValue(event.target.value)}
              placeholder={modeValue === 'image' ? '描述你想生成的图片，例如：未来感 AI 学习助手海报' : '在这里输入需求'}
              className="min-h-12 flex-1 border-0 bg-transparent px-2 text-base text-slate-950 outline-none placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            disabled={isAnalyzingImage || isGeneratingImage}
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-sky-700 px-6 text-sm font-semibold text-white shadow-sm shadow-sky-900/20 transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-sky-400"
          >
            {isAnalyzingImage ? '识别中...' : isGeneratingImage ? '准备生成...' : modeValue === 'image' ? '生成图片' : '生成学习路线'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {selectedImageFile && selectedImagePreviewUrl ? (
          <div className="flex items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50/70 p-3 text-left">
            <img
              src={selectedImagePreviewUrl}
              alt={selectedImageFile.name || '已上传图片预览'}
              className="h-16 w-16 shrink-0 rounded-xl border border-white object-cover shadow-sm"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{selectedImageFile.name}</p>
              <p className="mt-1 text-xs text-slate-500">{formatFileSize(selectedImageFile.size)} · {modeValue === 'image' ? '当前生图模式暂只支持文字描述' : '将结合图片内容生成学习目标'}</p>
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
          <div className="rounded-2xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
            <p>{imageError}</p>
            {imageError.includes('Pro 功能') ? <a href="/membership" className="mt-2 inline-flex font-semibold text-sky-800 underline underline-offset-4">查看会员方案</a> : null}
          </div>
        ) : null}

        <fieldset className="rounded-2xl border border-sky-100 bg-white/55 p-3">
          <legend className="px-1 text-xs font-semibold text-slate-600">生成模式</legend>
          <input type="hidden" name="mode" value={modeValue} />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {planningModes.map((mode) => {
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
                    'relative w-full cursor-pointer rounded-2xl border p-4 text-left transition-all',
                    'focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2',
                    selected
                      ? 'border-sky-500 bg-sky-50 shadow-sm ring-1 ring-sky-200'
                      : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50/60',
                  ].join(' ')}
                >
                  <span className="flex items-start gap-3">
                    <span
                      className={[
                        'mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                        selected ? 'border-sky-600 bg-sky-600' : 'border-sky-200 bg-white',
                      ].join(' ')}
                    >
                      {selected ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
                    </span>
                    <span>
                      <span className="flex items-center gap-2 font-semibold text-slate-950">
                        {mode.title}
                        {mode.value === 'deep' && membershipLoaded && !canUseDeepPlan ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">Pro</span> : null}
                      </span>
                      <span className="mt-1 block text-sm text-slate-500">{mode.description}</span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-center text-xs text-slate-500" data-selected-mode={modeValue}>
            已选择：{planningModes.find((mode) => mode.value === modeValue)?.title || '深度 AILINES AI 规划'}
          </p>
        </fieldset>
      </form>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {(modeValue === 'image' ? imageExamples : homepageExamples).map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setGoalValue(example)}
            className="rounded-full border border-sky-100 bg-white/70 px-3 py-2 text-sm font-medium text-sky-900 transition hover:border-sky-200 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
