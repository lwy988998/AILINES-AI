import { detectLearningDomain } from '@/lib/learningDomain';
import type { PlanMode } from '@/lib/ai/types';
import type { SearchResource } from '@/lib/search/resourceTypes';

export type LearningReference = {
  title: string;
  source: string;
  url: string;
  type: string;
};

export type LearningLessonStep = {
  title: string;
  explanation: string;
  example: string;
  action: string;
  check: string;
};

export type LearningExample = {
  title: string;
  content: string;
  solution: string[];
};

export type LearningPractice = {
  title: string;
  difficulty: string;
  task: string;
  check: string;
};

export type LearningAnswer = {
  title: string;
  summary: string;
  keyConcepts: string[];
  lessonSteps: LearningLessonStep[];
  examples: LearningExample[];
  practice: LearningPractice[];
  commonMistakes: string[];
  checkpoint: string[];
  resourceSummary: string;
  references: LearningReference[];
  notice?: string;
};

export type LearningAnswerInput = {
  goal: string;
  phaseName: string;
  topic: string;
  mode: PlanMode;
  resources?: SearchResource[];
  notice?: string;
};

function cleanText(value: string, fallback: string) {
  const trimmed = value.trim();
  return trimmed || fallback;
}

export function referencesFromResources(resources: SearchResource[] = []): LearningReference[] {
  return resources.slice(0, 8).map((resource) => ({
    title: resource.title,
    source: resource.source,
    url: resource.url,
    type: resource.type,
  }));
}

function buildMathAnswer(goal: string, phaseName: string, topic: string, mode: PlanMode, references: LearningReference[], notice?: string): LearningAnswer {
  const deep = mode === 'deep';
  const lessonSteps: LearningLessonStep[] = [
    {
      title: `第 1 步：先把「${topic}」放回数学图像里`,
      explanation: `学习 ${topic} 时，先不要急着记公式。你要先弄清它解决的是哪类问题：角度如何表示、函数值如何对应图像、题目给出的条件如何转成可计算的信息。以三角函数为例，角度制适合日常描述，弧度制更适合函数、图像和后续微积分。把概念放进单位圆或坐标图里，公式才不是孤立结论。`,
      example: '如果题目说 180 度，你要能立刻想到它等于 pi 弧度，也能在单位圆上找到对应位置。',
      action: '画一条数轴或单位圆，把 0、90、180、270、360 度和对应弧度标出来。',
      check: '不看资料也能说出角度制和弧度制的换算关系。',
    },
    {
      title: '第 2 步：建立公式和含义的对应关系',
      explanation: `公式不是背诵任务，而是表达关系的工具。比如角度和弧度的核心关系是 180 度 = pi 弧度，所以 1 度 = pi/180 弧度，1 弧度 = 180/pi 度。学习时要把“为什么这样换算”和“什么时候这样换算”一起记住：看到三角函数图像、周期、弧长、扇形面积时，通常要优先使用弧度制。`,
      example: '60 度 = 60 * pi / 180 = pi / 3；3pi / 2 弧度 = 270 度。',
      action: '写 6 个常见特殊角，并完成角度和弧度双向换算。',
      check: '能在 30 秒内把 30、45、60、90、180、270 度换成弧度。',
    },
    {
      title: '第 3 步：用例题检验计算步骤',
      explanation: `做题时要把步骤写完整：先识别单位，再选择换算公式，然后化简，最后检查结果是否合理。很多错误不是不会公式，而是把度数和弧度混用，或者把 pi 当成普通角度单位。写清楚单位能明显减少错题。`,
      example: '把 225 度化为弧度：225 * pi / 180 = 5pi / 4。结果大于 pi 且小于 3pi/2，位置在第三象限，合理。',
      action: '完成 8 道换算题，每道题写出公式、代入、化简和合理性检查。',
      check: '能发现“sin 90”和“sin(pi/2)”其实表达同一个角。',
    },
  ];

  if (deep) {
    lessonSteps.push(
      {
        title: '第 4 步：连接图像、周期和后续知识',
        explanation: `弧度制真正重要的地方在函数图像和周期。三角函数的标准周期常写成 2pi，而不是 360 度，是因为弧度制能让图像变化、弧长关系和函数运算更自然。后面学习 sin x、cos x 的图像，横轴通常就是弧度。现在把特殊角标在横轴上，会让你后续看图像时更快判断零点、最值和周期。`,
        example: 'sin x 在 x = 0、pi、2pi 处为 0，在 pi/2 处为 1，在 3pi/2 处为 -1。',
        action: '画出 0 到 2pi 的 sin x 简图，并标出 5 个关键点。',
        check: '能解释为什么三角函数图像横轴常用 pi、2pi 这样的刻度。',
      },
      {
        title: '第 5 步：用错题复盘稳定掌握',
        explanation: `最后要用错题把薄弱点找出来。每做错一道题，标出错误类型：单位看错、换算公式写反、化简出错、特殊角记错，还是图像位置判断错。复盘时不要只改答案，而要补一句“下次看到什么信号就要警惕”。这样你会形成稳定的解题习惯。`,
        example: '错因：把 pi/6 看成 60 度。修正：pi/6 是 30 度，pi/3 才是 60 度。',
        action: '整理 3 道错题，每道写出错因和避免方法。',
        check: '重新做同类题时能一次写对单位和换算过程。',
      },
    );
  }

  return {
    title: `${topic}：AILINES AI 整合课程`,
    summary: `这节课会围绕「${goal}」中的「${phaseName}」，把 ${topic} 拆成概念、公式、图像、例题和练习，帮助你从会背变成会用。`,
    keyConcepts: ['角度制', '弧度制', '单位圆', '特殊角', '三角函数图像'],
    lessonSteps,
    examples: [
      {
        title: '例题：把 150 度化为弧度',
        content: '已知角为 150 度，求它对应的弧度表示。',
        solution: ['使用公式：弧度 = 角度 * pi / 180。', '代入：150 * pi / 180。', '约分：150/180 = 5/6。', '答案：150 度 = 5pi/6。'],
      },
      {
        title: '例题：判断 pi/3 对应的角度',
        content: '已知角为 pi/3 弧度，求它对应多少度。',
        solution: ['使用公式：角度 = 弧度 * 180 / pi。', '代入：pi/3 * 180 / pi。', '约去 pi，得到 60。', '答案：pi/3 = 60 度。'],
      },
    ],
    practice: [
      { title: '基础练习', difficulty: '入门', task: '把 30、45、90、120、270 度分别换成弧度。', check: '至少 4 个结果正确，并能写出换算过程。' },
      { title: '图像练习', difficulty: '中级', task: '在 0 到 2pi 的横轴上标出 pi/6、pi/4、pi/3、pi/2、pi。', check: '标注顺序正确，能说明每个点对应多少度。' },
      { title: '综合练习', difficulty: '进阶', task: '用单位圆解释为什么 3pi/2 对应 270 度。', check: '能把角的位置、旋转方向和函数值联系起来。' },
    ],
    commonMistakes: ['把 pi/6 和 pi/3 对应角度记反。', '度数和弧度混用，题目要求弧度却写成度。', '换算时忘记约分，导致结果不清晰。', '只背公式，不会在单位圆或图像上定位。'],
    checkpoint: ['能完成角度和弧度双向换算。', '能在单位圆上标出常见特殊角。', '能解释弧度制为什么适合三角函数图像。', '能独立完成基础换算和图像标注题。'],
    resourceSummary: references.length ? 'AILINES AI 已参考联网资料摘要，并将其整理为上面的课程、例题和练习。' : '暂未获取到可用资料，已先提供基础课程。',
    references,
    notice,
  };
}

function buildProgrammingAnswer(goal: string, phaseName: string, topic: string, mode: PlanMode, references: LearningReference[], notice?: string): LearningAnswer {
  const deep = mode === 'deep';
  const lessonSteps: LearningLessonStep[] = [
    {
      title: `第 1 步：明确「${topic}」解决什么开发问题`,
      explanation: `编程学习不能只看语法，要知道这一步在真实项目中解决什么问题。围绕「${goal}」，你需要先判断 ${topic} 是环境准备、语法基础、数据处理、界面交互还是调试能力。明确用途后，再写一个最小可运行例子，把输入、处理、输出分清楚。`,
      example: '学习函数时，不只是记 def，而是理解如何把重复逻辑封装成可复用步骤。',
      action: '写下本主题的输入、处理过程、输出结果和一个最小示例。',
      check: '能用 3 句话解释这项能力在项目中的作用。',
    },
    {
      title: '第 2 步：写出最小代码并运行',
      explanation: `先写最小版本，不要一开始堆复杂功能。最小代码的目标是确认概念能跑通：变量是否正确、函数是否返回预期、依赖是否安装、命令是否能执行。运行结果比“看懂教程”更重要，因为真实报错会暴露你还没掌握的细节。`,
      example: 'print("Hello AILINES AI") 可以验证解释器、终端和文件运行链路是否正常。',
      action: '为当前主题写一个 10-30 行的小例子，并保存运行输出。',
      check: '能复现运行步骤，并说明每一段代码的作用。',
    },
    {
      title: '第 3 步：按报错信息调试',
      explanation: `遇到错误时，先读错误类型和行号，再缩小问题范围。不要直接复制一大段新代码覆盖原文件。常见流程是：确认命令、确认文件路径、确认变量名、确认依赖版本、添加临时输出，再逐步定位。这个习惯会让你从“靠答案”变成“会排查”。`,
      example: 'ModuleNotFoundError 通常说明包没安装、虚拟环境不对，或运行的 Python 解释器不是你以为的那个。',
      action: '故意制造一个小错误，记录报错、原因和修复步骤。',
      check: '能说出至少 3 个排查方向，而不是只说“代码坏了”。',
    },
  ];

  if (deep) {
    lessonSteps.push(
      {
        title: '第 4 步：把知识点接入一个小任务',
        explanation: `单点知识要通过任务串起来。你可以做一个命令行工具、数据处理脚本、页面组件或接口请求，把当前主题放进真实流程里。任务要有明确输入和验收标准，这样你才能判断自己是否真的掌握，而不是只完成了教程里的固定步骤。`,
        example: '学习文件读写后，做一个统计文本行数和关键词出现次数的小脚本。',
        action: '设计一个 30-60 分钟能完成的小任务，并写出验收标准。',
        check: '任务能独立运行，结果能被检查。',
      },
      {
        title: '第 5 步：整理代码和复盘',
        explanation: `最后把代码、运行方式、遇到的错误和修复方法写成笔记。复盘不是形式主义，它能帮你下次快速定位同类问题。尤其是环境、依赖、路径、类型、异步请求这些问题，记录一次就能少踩很多坑。`,
        example: 'README 可以包含：如何安装依赖、如何运行、输入示例、输出示例、常见报错。',
        action: '为这次练习写一份 8-10 行 README。',
        check: '隔天重新打开项目时，能根据 README 独立跑起来。',
      },
    );
  }

  return {
    title: `${topic}：AILINES AI 编程课`,
    summary: `这节课把「${phaseName}」中的 ${topic} 转成可运行、可调试、可复盘的学习流程。`,
    keyConcepts: ['最小可运行示例', '输入处理输出', '报错定位', '调试记录', '项目验收'],
    lessonSteps,
    examples: [
      { title: '代码案例：最小运行检查', content: '用一个最小脚本确认环境和运行链路。', solution: ['创建 main.py。', '写入 print("Hello AILINES AI")。', '运行 python main.py。', '如果失败，检查解释器、路径和命令。'] },
    ],
    practice: [
      { title: '基础练习', difficulty: '入门', task: '写一个最小示例并运行成功。', check: '能展示输入、输出和运行命令。' },
      { title: '调试练习', difficulty: '中级', task: '记录一个报错并写出排查过程。', check: '包含错误信息、原因判断和修复方法。' },
      { title: '小项目练习', difficulty: '进阶', task: '把本主题做成一个 30-60 分钟的小任务。', check: '有 README 和可复现结果。' },
    ],
    commonMistakes: ['只复制代码，不运行最小示例。', '遇到报错不看行号和错误类型。', '依赖装在一个环境，运行却用了另一个解释器。', '没有保存运行步骤，隔天无法复现。'],
    checkpoint: ['能写出最小代码。', '能读懂基础报错。', '能完成一个小任务。', '能整理复盘记录。'],
    resourceSummary: references.length ? 'AILINES AI 已把联网资料摘要转成编程学习步骤和调试练习。' : '暂未获取到可用资料，已先提供基础编程课程。',
    references,
    notice,
  };
}

function buildAiToolAnswer(goal: string, phaseName: string, topic: string, mode: PlanMode, references: LearningReference[], notice?: string): LearningAnswer {
  const deep = mode === 'deep';
  const lessonSteps: LearningLessonStep[] = [
    {
      title: `第 1 步：定义「${topic}」的用户任务`,
      explanation: `开发 AI 工具时，第一步不是选模型，而是确定用户要完成什么任务。你需要写清楚用户输入什么、希望得到什么、结果要多详细、失败时如何提示。任务越清楚，Prompt、API、页面和 fallback 才越容易设计。`,
      example: '学习计划工具的输入是目标和模式，输出是阶段路线、课程、资源和练习。',
      action: '写出本工具的输入字段、输出结构和最小可用功能。',
      check: '能判断哪些功能必须做，哪些可以后续迭代。',
    },
    {
      title: '第 2 步：设计 Prompt 和结构化输出',
      explanation: `Prompt 要把角色、任务、约束、输出格式写清楚。后端应要求模型返回结构化 JSON，再做解析和校验。不要让前端直接拿一段不可控文本硬展示；稳定的 AI 工具需要可验证的数据结构。`,
      example: '要求返回 title、summary、lessonSteps、practice、references 等字段。',
      action: '为当前主题写一个系统提示词和 JSON 输出 schema。',
      check: '能说明每个字段为什么需要，以及失败时如何 fallback。',
    },
    {
      title: '第 3 步：服务端调用模型 API',
      explanation: `API Key 必须放在服务端环境变量里，前端只调用自己的后端接口。后端负责 timeout、retry、错误分类、日志和降级。这样即使 provider 超时，用户也能看到基础课程或可操作提示，而不是暴露内部错误。`,
      example: '页面请求 /api/generate-plan，服务端调用 provider，失败后返回 fallback plan。',
      action: '画出前端、后端、provider、fallback 的调用链路。',
      check: '能指出密钥在哪里、错误在哪里处理、用户看到什么。',
    },
  ];

  if (deep) {
    lessonSteps.push(
      {
        title: '第 4 步：接入搜索或 RAG',
        explanation: `如果工具需要真实资料，就要先搜索或检索资料，再让 AI 整合。关键是不要把搜索结果原样丢给用户，而是提取标题、来源、摘要、链接，交给 AI 生成课程式回答，最后把资料作为参考入口。`,
        example: '学习卡片流程：topic -> 搜索资料 -> AI 整合 -> 课程讲解 -> 参考资料。',
        action: '设计资源摘要格式，只保留 title、source、description、url、type。',
        check: '页面主体是课程，不是搜索结果列表。',
      },
      {
        title: '第 5 步：测试、部署和迭代',
        explanation: `AI 工具要测试成功、超时、空输入、JSON 解析失败、搜索失败和重试按钮等场景。部署后还要关注成本、日志、用户反馈和缓存策略。先把主链路稳定，再逐步增加更复杂功能。`,
        example: '对同一个学习点测试 provider 成功和失败两种结果，确认页面都可用。',
        action: '列出 6 个测试用例，并至少手动验证 3 个。',
        check: '失败时用户仍能继续学习，且不会看到密钥或内部错误。',
      },
    );
  }

  return {
    title: `${topic}：AILINES AI 工具开发课`,
    summary: `这节课围绕「${goal}」中的「${phaseName}」，把 ${topic} 拆成产品需求、Prompt、API、搜索/RAG、fallback 和部署验证。`,
    keyConcepts: ['用户任务', 'Prompt', '模型 API', '结构化输出', '搜索/RAG', 'fallback'],
    lessonSteps,
    examples: [
      { title: '案例：学习卡片生成课程', content: '用户点击一个学习点后，系统先搜索资料，再由 AI 整合成课程。', solution: ['构造搜索 query。', '裁剪资源摘要。', '调用 generateLearningAnswer。', '展示课程主体。', '最后展示参考资料入口。'] },
    ],
    practice: [
      { title: '需求练习', difficulty: '入门', task: '为一个 AI 工具写输入、输出和失败状态。', check: '字段清楚，失败状态不暴露内部错误。' },
      { title: 'Prompt 练习', difficulty: '中级', task: '写一个要求 JSON 输出的 Prompt。', check: '包含角色、任务、约束和字段说明。' },
      { title: '链路练习', difficulty: '进阶', task: '画出搜索 -> 整合 -> 展示 -> 引用的流程图。', check: '能解释每一步的输入和输出。' },
    ],
    commonMistakes: ['直接把 API Key 放到前端。', '把搜索结果当课程主体。', 'Prompt 没有约束输出结构。', '没有 timeout 和 fallback。'],
    checkpoint: ['能设计 AI 工具的最小链路。', '能写出结构化 Prompt。', '能说明搜索资料如何被整合。', '能设计失败降级体验。'],
    resourceSummary: references.length ? 'AILINES AI 已将联网资料摘要整理为 AI 工具开发课程。' : '暂未获取到可用资料，已先提供基础 AI 工具课程。',
    references,
    notice,
  };
}

function buildGeneralAnswer(goal: string, phaseName: string, topic: string, mode: PlanMode, references: LearningReference[], notice?: string): LearningAnswer {
  const deep = mode === 'deep';
  const lessonSteps: LearningLessonStep[] = [
    {
      title: `第 1 步：明确「${topic}」要解决的问题`,
      explanation: `先把这个学习点变成一个具体问题：我现在不会什么，学完要能做什么，用什么成果证明掌握。这样你不会停留在“看过资料”，而会进入可检查的学习。`,
      example: `如果主题是「${topic}」，可以把目标写成：我能解释核心概念，并完成一个小练习。`,
      action: '写出本主题的学习目标和验收标准。',
      check: '目标能被实际检查，而不是一句泛泛的“学会”。',
    },
    {
      title: '第 2 步：抓住核心概念和典型案例',
      explanation: `学习时先抓 3-5 个核心概念，再找一个典型案例拆解。概念让你知道“是什么”，案例让你知道“怎么用”。不要同时打开太多资料，先形成自己的结构，再补充细节。`,
      example: '读一篇教程后，用自己的话写出 5 个关键词和 1 个应用场景。',
      action: '整理关键词、定义和一个案例。',
      check: '能不用原文复述主要意思。',
    },
    {
      title: '第 3 步：立刻做小练习',
      explanation: `练习要跟在讲解后面。只阅读会造成“好像懂了”的错觉，做题、操作、输出或讲解给别人听，才能暴露真正的问题。练习不需要大，但要能检查。`,
      example: '用 20 分钟完成一个小任务，然后写下哪里卡住。',
      action: '完成一个 20-40 分钟的小练习。',
      check: '练习有明确产出，并能指出一个待改进点。',
    },
  ];

  if (deep) {
    lessonSteps.push(
      {
        title: '第 4 步：复盘错误和薄弱点',
        explanation: `复盘时不要只写“粗心”。要把错误拆成概念不清、步骤遗漏、工具不熟、练习不足、资料理解偏差等类型。错误类型越清楚，下一轮学习越容易调整。`,
        example: '错因：只记结论，没理解适用条件。改法：补一条例子和反例。',
        action: '记录 3 个问题，并给每个问题写一个改进动作。',
        check: '能说出下一次练习要重点避免什么。',
      },
      {
        title: '第 5 步：形成可复用笔记',
        explanation: `最后把学习内容整理成简短笔记：概念、例子、练习、错因、下一步。笔记不是复制资料，而是把资料转成你的理解。以后遇到类似问题，可以直接复用这套结构。`,
        example: '一页笔记包含：定义、关键步骤、例题、易错点、练习链接。',
        action: '写一页结构化学习笔记。',
        check: '隔天能靠这页笔记复现主要内容。',
      },
    );
  }

  return {
    title: `${topic}：AILINES AI 整合课程`,
    summary: `这节课会把「${phaseName}」中的 ${topic} 转成目标、概念、案例、练习和复盘。`,
    keyConcepts: ['学习目标', '核心概念', '典型案例', '小练习', '复盘'],
    lessonSteps,
    examples: [
      { title: '案例：把学习点转成可检查任务', content: `主题是「${topic}」，不要只写“看教程”。`, solution: ['写出要解决的问题。', '列出 3 个关键词。', '做一个小练习。', '用检查标准判断是否掌握。'] },
    ],
    practice: [
      { title: '概念练习', difficulty: '入门', task: '用自己的话解释本主题。', check: '不少于 100 字，不能直接复制资料原句。' },
      { title: '应用练习', difficulty: '中级', task: '完成一个围绕本主题的小任务。', check: '有结果、有过程、有复盘。' },
    ],
    commonMistakes: ['只看资料不做练习。', '直接复制资料，没有转成自己的理解。', '目标太大，无法检查。', '学完不复盘，后续容易遗忘。'],
    checkpoint: ['能解释本主题。', '能完成一个小练习。', '能说出常见错误。', '能整理一页笔记。'],
    resourceSummary: references.length ? 'AILINES AI 已根据联网资料摘要整理成本课内容。' : '暂未获取到可用资料，已先提供基础课程。',
    references,
    notice,
  };
}

export function getMockLearningAnswer({ goal, phaseName, topic, mode, resources = [], notice }: LearningAnswerInput): LearningAnswer {
  const safeGoal = cleanText(goal, '学习');
  const safePhaseName = cleanText(phaseName, '当前阶段');
  const safeTopic = cleanText(topic, safeGoal);
  const references = referencesFromResources(resources);
  const domain = detectLearningDomain(`${safeGoal} ${safePhaseName} ${safeTopic}`);

  if (domain === 'math') return buildMathAnswer(safeGoal, safePhaseName, safeTopic, mode, references, notice);
  if (domain === 'programming') return buildProgrammingAnswer(safeGoal, safePhaseName, safeTopic, mode, references, notice);
  if (domain === 'ai') return buildAiToolAnswer(safeGoal, safePhaseName, safeTopic, mode, references, notice);
  return buildGeneralAnswer(safeGoal, safePhaseName, safeTopic, mode, references, notice);
}
