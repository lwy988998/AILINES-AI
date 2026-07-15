import type { MockPlan, RoadmapStage, CourseStep } from '@/lib/mockPlan';

type StepContext = {
  goal: string;
  phaseName: string;
  phaseGoal?: string;
  title: string;
  index: number;
};

const repeatedTemplatePatterns = [
  /这一步要把抽象目标变成一个能立刻执行的小动作/,
  /先照着示例做一遍/,
  /再独立做一遍/,
  /最后记录卡住的位置/,
  /不用看教程也能复现/,
  /并知道失败原因/,
];

function clean(value: string | undefined, fallback: string) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed || fallback;
}

function stripPrefix(value: string) {
  return value.replace(/^第\s*\d+\s*[步阶段]?[:：、-]?\s*/, '').trim();
}

function normalizeForCompare(value: string) {
  return value.replace(/[\s，。；：、,.!?！？;:「」“”'"（）()【】\[\]-]/g, '').toLowerCase();
}

function tokenSet(value: string) {
  const normalized = normalizeForCompare(value);
  const tokens = new Set<string>();
  for (let index = 0; index < normalized.length - 1; index += 1) {
    tokens.add(normalized.slice(index, index + 2));
  }
  return tokens;
}

function similarity(left: string, right: string) {
  const a = tokenSet(left);
  const b = tokenSet(right);
  if (a.size === 0 || b.size === 0) return 0;
  let overlap = 0;
  a.forEach((token) => {
    if (b.has(token)) overlap += 1;
  });
  return overlap / Math.min(a.size, b.size);
}

function isRepeatedTemplate(value: string) {
  return repeatedTemplatePatterns.some((pattern) => pattern.test(value));
}

function isHardwarePcGoal(goal: string) {
  return /配电脑|装机|电脑配置|攒机|组装电脑|选电脑|台式机配置/i.test(goal);
}

function isExamEnglishGoal(goal: string) {
  return /中考.*英语|英语.*中考|阅读理解|英语阅读/i.test(goal);
}

function isPythonBeginnerGoal(goal: string) {
  return /python|零基础.*编程|编程.*入门/i.test(goal);
}

function pickByTitle(title: string, candidates: Array<[RegExp, number]>, fallback: number) {
  const normalized = stripPrefix(title);
  const matched = candidates.find(([pattern]) => pattern.test(normalized));
  return matched ? matched[1] : fallback;
}

function genericStepContent(context: StepContext) {
  const title = stripPrefix(context.title) || `步骤 ${context.index + 1}`;
  return {
    explanation: `围绕「${context.goal}」完成「${title}」时，先确认本步骤要处理的对象和资料来源，再做一次能留下证据的小任务。不要只停留在理解标题：要把关键材料、操作过程、输出结果和遇到的问题写下来，方便下一步接着修正。`,
    example: `例如把「${title}」整理成一张小清单：需要看的材料、要完成的动作、产出的文件或记录、判断合格的标准。`,
    action: `完成「${title}」对应的小任务，保留过程记录和最终产出。`,
    check: `能说明「${title}」解决了什么问题，并拿出一个可检查的结果。`,
  };
}

function hardwarePcStepContent(context: StepContext) {
  const variants = [
    {
      match: /目标|场景|用途|需求|预算|准备|明确/,
      explanation: `先把配电脑需求写清楚：主要用途是游戏、剪辑、办公、AI、本地开发还是学习；预算上限是多少；是否已有显示器、键盘、硬盘等可复用配件。再列出常用软件或游戏、分辨率和便携性要求，避免一开始就盯着单个硬件型号。`,
      example: '示例：预算 5000 元，主要玩 1080p 网游和做 Python 学习，需要 1TB 固态，不需要独显外观灯效。',
      action: '写一份用途、预算、已有设备、性能目标和不能接受项清单。',
      check: '能根据清单判断应该优先投入 CPU、GPU、内存、硬盘还是显示器。',
    },
    {
      match: /CPU|GPU|显卡|内存|硬盘|电源|配件|选择|核心|配置/,
      explanation: `按用途逐项选择硬件：CPU 看核心数和平台寿命，GPU 看目标分辨率和游戏/生产力需求，内存至少确认容量和频率，硬盘区分系统盘和资料盘，电源按整机功耗留余量。每个选择都要写明为什么适合当前预算，而不是只抄热门型号。`,
      example: '如果主要剪辑，优先考虑 CPU、多内存和大容量固态；如果主要 3A 游戏，显卡预算占比要更高。',
      action: '列出 2 套不同预算配置，并为每个关键配件写一句选择理由。',
      check: '配置清单能对应具体用途，且没有明显超预算或性能瓶颈。',
    },
    {
      match: /练习|重复|记录|清单|方案|对比|取舍/,
      explanation: `用 2-3 个预算场景反复练习配单，例如 3000 元办公学习、5000 元游戏、8000 元剪辑。每套都要写出 CPU、主板、显卡、内存、硬盘、电源和机箱，并记录不确定的地方，比如显卡是否过强、电源是否够、主板是否支持升级。`,
      example: '同样 5000 元预算，分别做一套偏游戏和一套偏生产力配置，比较显卡、CPU 和内存投入差异。',
      action: '完成 2-3 份配置清单，对每份记录一个预算取舍和一个待确认问题。',
      check: '能解释每套配置适合的人群，并指出至少一个可以降级或升级的配件。',
    },
    {
      match: /自检|修正|兼容|标准|检查|错误|验收/,
      explanation: `对配置做兼容性检查：CPU 和主板接口是否一致，内存规格是否被主板支持，显卡长度是否放得进机箱，电源功率和接口是否够用，散热器高度和机箱风道是否合理，硬盘接口和数量是否满足需求。发现不匹配就替换配件并写明原因。`,
      example: '例如 AM5 CPU 不能配 LGA1700 主板；高端显卡要同时检查机箱长度、电源瓦数和供电接口。',
      action: '逐项检查接口、尺寸、功耗、散热和预算，把问题配件替换成兼容型号。',
      check: '清单中每个核心配件都能说出兼容依据，预算和用途仍然成立。',
    },
    {
      match: /输出|最终|购买|装机|成果|交付/,
      explanation: `把最终方案整理成可购买或可装机的清单：包含配件型号、预估价格、购买渠道备注、用途解释、升级空间和风险提醒。最后再写一段给非专业用户也能看懂的说明，解释这套电脑为什么适合当前预算和需求。`,
      example: '最终表格包含：配件、型号、价格、选择理由、可替代型号、升级建议。',
      action: '输出一份完整装机或购买清单，并附上预算汇总和升级建议。',
      check: '别人拿到清单后能知道买什么、为什么买、哪里可以替换。',
    },
  ];
  return variants[pickByTitle(context.title, variants.map((item, index) => [item.match, index]), Math.min(context.index, variants.length - 1))];
}

function englishReadingStepContent(context: StepContext) {
  const variants = [
    {
      match: /目标|诊断|错题|现状|准备/,
      explanation: `先用一套中考英语阅读真题诊断问题：统计词汇看不懂、长句断不开、定位慢、推理题错、主旨题错分别出现几次。把错因按题型和文章类型记录下来，后面训练才不会变成盲目刷题。`,
      example: '记录表：文章类型、错题题型、原文定位句、错误原因、正确解法。',
      action: '完成 1 篇真题阅读并做错因分类。',
      check: '能说出当前最影响分数的 1-2 类问题。',
    },
    {
      match: /词汇|长句|基础|材料|输入/,
      explanation: `围绕中考高频阅读材料补基础：每天从真题文章中摘出 10 个影响理解的词组和 3 个长句，先猜意思，再查证并拆分主谓宾、从句和修饰成分。重点学会在文章里理解词义，而不是孤立背单词表。`,
      example: '遇到 however、therefore、although 这类连接词时，标出前后句关系。',
      action: '整理一页真题词组和长句拆解笔记。',
      check: '能复述文章大意，并解释 3 个长句的结构。',
    },
    {
      match: /练习|题型|定位|阅读|速度/,
      explanation: `按题型练阅读方法：细节题先读题干关键词再回原文定位，推理题找依据句和上下文，主旨题看首尾段和反复出现的核心词。每篇限时完成，做完必须标出每道题的原文依据，训练速度和准确率一起提升。`,
      example: '细节题答案不能只凭印象，要在原文中画出对应句。',
      action: '完成 2 篇限时阅读，每题标出定位句和判断理由。',
      check: '正确率和定位速度都有记录，错题能归因到具体题型。',
    },
    {
      match: /自检|修正|复盘|标准|验收/,
      explanation: `复盘时不要只改答案，要把每道错题归到词汇、长句、定位、推理或主旨判断。然后重读原文依据句，写出“为什么正确选项对、为什么自己选项错”。这种复盘能避免同一类题连续丢分。`,
      example: '错因：看到原文同词就选，忽略了题干问的是原因而不是结果。',
      action: '整理 5 道错题，每道写出原文依据和排除理由。',
      check: '隔天重做错题能说明答案依据，而不是记住选项。',
    },
  ];
  return variants[pickByTitle(context.title, variants.map((item, index) => [item.match, index]), Math.min(context.index, variants.length - 1))];
}

function pythonBeginnerStepContent(context: StepContext) {
  const variants = [
    {
      match: /环境|安装|准备|目标|入门/,
      explanation: `先把 Python 学习环境跑通：确认 Python 版本、编辑器、终端命令和文件保存位置。用一个最小脚本验证从编写、运行到看到输出的链路，避免后面把路径、解释器和语法问题混在一起。`,
      example: '创建 hello.py，写入 print("Hello Python")，在终端运行 python hello.py。',
      action: '完成环境安装和第一个脚本运行，保存命令和输出截图或记录。',
      check: '能重新创建文件并独立运行，不依赖教程截图。',
    },
    {
      match: /变量|类型|输入|输出|基础|语法/,
      explanation: `从变量、字符串、数字、列表和输入输出开始。每学一个语法点都写一个小例子，观察输入如何变成输出。重点理解变量保存什么、类型决定能做什么操作，而不是一次性背完整语法表。`,
      example: '做一个自我介绍脚本：输入姓名和年龄，输出一句格式化介绍。',
      action: '写 3 个 10 行以内的小脚本，分别练变量、输入输出和列表。',
      check: '能修改输入并预测输出，结果和运行一致。',
    },
    {
      match: /条件|循环|函数|练习|项目/,
      explanation: `用条件、循环和函数完成可运行小任务。先写直线流程，再把重复逻辑改成循环，把可复用步骤封装成函数。每次只加一个功能，运行通过后再继续，避免代码还没理解就堆复杂需求。`,
      example: '做一个成绩等级判断或猜数字小游戏，包含输入、条件判断、循环和结果提示。',
      action: '完成一个 30-60 分钟小程序，并写出每个函数的作用。',
      check: '程序能处理正常输入和至少一种异常输入。',
    },
    {
      match: /调试|错误|自检|复盘|验收/,
      explanation: `学习调试基础：读懂报错类型、行号和调用位置。遇到问题先缩小范围，再用 print 或临时变量检查中间结果。把常见错误记录成清单，比如拼写错误、缩进错误、类型错误、路径错误。`,
      example: 'NameError 多半是变量名不一致；IndentationError 通常是缩进层级错。',
      action: '记录 3 个真实报错，写出原因、定位过程和修复方式。',
      check: '再次遇到同类报错时能先读行号和错误类型。',
    },
  ];
  return variants[pickByTitle(context.title, variants.map((item, index) => [item.match, index]), Math.min(context.index, variants.length - 1))];
}

export function createSpecificStepContent(context: StepContext): CourseStep {
  const base = isHardwarePcGoal(context.goal)
    ? hardwarePcStepContent(context)
    : isExamEnglishGoal(context.goal)
      ? englishReadingStepContent(context)
      : isPythonBeginnerGoal(context.goal)
        ? pythonBeginnerStepContent(context)
        : genericStepContent(context);

  return {
    title: context.title,
    explanation: base.explanation,
    example: base.example,
    action: base.action,
    check: base.check,
  };
}

function shouldReplace(value: string, seen: string[]) {
  if (!value.trim()) return true;
  if (isRepeatedTemplate(value)) return true;
  return seen.some((existing) => normalizeForCompare(existing) === normalizeForCompare(value) || similarity(existing, value) >= 0.86);
}

function normalizeSteps(goal: string, stage: RoadmapStage): CourseStep[] | undefined {
  if (!Array.isArray(stage.steps) || stage.steps.length === 0) return stage.steps;
  const seenExplanations: string[] = [];
  const seenActions: string[] = [];
  const seenChecks: string[] = [];

  return stage.steps.map((step, index) => {
    const title = clean(step.title, `第 ${index + 1} 步：${stage.name || '学习本阶段重点'}`);
    const fallback = createSpecificStepContent({ goal, phaseName: stage.name || '当前阶段', phaseGoal: stage.goal, title, index });
    const explanation = shouldReplace(step.explanation || '', seenExplanations) ? fallback.explanation : step.explanation;
    const action = shouldReplace(step.action || '', seenActions) ? fallback.action : step.action;
    const check = shouldReplace(step.check || '', seenChecks) ? fallback.check : step.check;
    const normalized = {
      ...step,
      title,
      explanation,
      example: clean(step.example, fallback.example || ''),
      action,
      check,
    };
    seenExplanations.push(normalized.explanation);
    seenActions.push(normalized.action);
    seenChecks.push(normalized.check);
    return normalized;
  });
}

export function normalizeCoursePlanContent(plan: MockPlan, goal: string): MockPlan {
  return {
    ...plan,
    roadmap: Array.isArray(plan.roadmap)
      ? plan.roadmap.map((stage) => ({
          ...stage,
          steps: normalizeSteps(goal, stage),
        }))
      : plan.roadmap,
  };
}

export function createTaskDescription(input: { goal: string; stageName: string; taskTitle: string; index: number }) {
  const content = createSpecificStepContent({
    goal: input.goal,
    phaseName: input.stageName,
    title: input.taskTitle,
    index: input.index,
  });
  return content.explanation;
}

export function createTaskOutput(input: { goal: string; stageName: string; taskTitle: string; index: number }) {
  const content = createSpecificStepContent({
    goal: input.goal,
    phaseName: input.stageName,
    title: input.taskTitle,
    index: input.index,
  });
  if (isHardwarePcGoal(input.goal)) return `一份「${stripPrefix(input.taskTitle)}」相关配置记录、检查结果或最终清单`;
  if (isExamEnglishGoal(input.goal)) return `一份「${stripPrefix(input.taskTitle)}」阅读训练记录和错因复盘`;
  if (isPythonBeginnerGoal(input.goal)) return `一个「${stripPrefix(input.taskTitle)}」小脚本、运行结果和调试记录`;
  return content.action;
}
