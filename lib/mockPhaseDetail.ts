import { detectLearningDomain, type LearningDomain } from '@/lib/learningDomain';

export type PhaseTask = {
  title: string;
  duration: string;
  description: string;
  output: string;
};

export type PhaseResource = {
  name: string;
  type: '官方文档' | '互动课程' | '视频' | '文章' | '工具' | '教材' | '练习册';
  difficulty: '入门' | '中级' | '进阶';
  free: boolean;
  description: string;
  href: string;
};

export type PhasePractice = {
  name: string;
  difficulty: '入门' | '中级' | '进阶';
  duration: string;
  goal: string;
  acceptance: string;
};

export type PhaseStep = {
  title: string;
  explanation: string;
  example?: string;
  action: string;
  check: string;
};

export type MockPhaseDetail = {
  phaseName: string;
  goal: string;
  duration: string;
  objective: string;
  audience: string;
  why: string;
  output: string;
  commonMistakes: string[];
  steps: PhaseStep[];
  tasks: PhaseTask[];
  resources: PhaseResource[];
  practices: PhasePractice[];
  checklist: string[];
};

type PhaseTheme = {
  duration: string;
  objective: string;
  audience: string;
  tasks: [string, string, string, string][];
  practices: PhasePractice[];
  checklist: string[];
};

function getProgrammingTheme(goal: string, phaseName: string, phaseIndex: number): PhaseTheme {
  if (phaseIndex === 1 || /基础|语法|入门|环境/i.test(phaseName)) {
    return {
      duration: '1-2 周',
      objective: '建立基础概念、开发环境和最小练习闭环，为后续编码实践打底。',
      audience: '适合刚开始编程、基础不稳或需要重新梳理工具链的学习者。',
      tasks: [
        ['配置开发与学习环境', '1-2 小时', '安装必要工具，建立项目文件夹和学习笔记模板。', '可运行的本地环境和一份环境配置记录。'],
        ['理解核心概念与术语', '2-3 小时', '梳理变量、流程、模块、调试等高频概念。', '一页核心概念速查笔记。'],
        ['完成基础语法练习', '4-6 小时', '围绕输入输出、条件、循环、函数做小练习。', '至少 10 个可复盘的小练习。'],
        ['阅读官方入门章节', '2-3 小时', '优先阅读官方或权威入门资料，建立正确心智模型。', '整理 5 个关键知识点和 3 个常见坑。'],
        ['完成阶段小项目', '4-8 小时', '用本阶段知识完成一个小而完整的任务。', '一个可运行、可展示、可说明的小项目。'],
      ],
      practices: [
        { name: `${phaseName} 语法练习`, difficulty: '入门', duration: '2-3 小时', goal: '确认能独立写出基础逻辑。', acceptance: '能完成 8-10 道基础题，并解释关键代码。' },
        { name: `${phaseName} 小项目`, difficulty: '中级', duration: '4-8 小时', goal: `围绕「${goal}」完成一个可运行的小成果。`, acceptance: '有明确输入、处理过程、输出结果和简短 README。' },
        { name: '阶段调试挑战', difficulty: '中级', duration: '1-2 小时', goal: '练习定位错误和修复问题。', acceptance: '记录至少 3 个错误原因和修复方法。' },
      ],
      checklist: ['能独立解释本阶段核心概念', '能完成基础代码练习', '能运行并说明阶段小项目', '能总结常见报错和解决办法', '能判断自己是否适合进入下一阶段学习'],
    };
  }

  return commonApplicationTheme(goal, phaseName, 'programming');
}

function getMathTheme(goal: string, phaseName: string, phaseIndex: number): PhaseTheme {
  if (phaseIndex === 1 || /基础|概念|函数|三角|代数|几何/i.test(phaseName)) {
    return {
      duration: '1-2 周',
      objective: '理解核心定义、图像关系和基础公式，先把概念讲清楚，再进入题型训练。',
      audience: '适合刚接触该知识点、概念混乱或做题容易套公式的学习者。',
      tasks: [
        ['明确三角函数学习范围', '1 小时', `围绕「${goal}」明确角度制、弧度制、单位圆、图像、公式和基础题型边界。`, '一份学习范围清单。'],
        ['理解角度制与弧度制', '1-2 小时', '理解角度与弧度的换算关系，知道为什么三角函数常用弧度制。', '一张角度/弧度换算表。'],
        ['掌握单位圆定义', '2-3 小时', '用单位圆理解 sin、cos、tan 的定义和正负变化。', '一张标注象限和关键角的单位圆。'],
        ['记忆特殊角函数值', '2-3 小时', '整理 0°、30°、45°、60°、90° 等特殊角的函数值。', '一套特殊角函数值卡片。'],
        ['完成基础练习题', '3-5 小时', '练习基础求值、象限判断和简单图像识别。', '20 道基础练习题和订正记录。'],
        ['整理公式卡片', '1-2 小时', '把定义、特殊值、基础恒等式整理成可复习卡片。', '一页公式卡片。'],
      ],
      practices: [
        { name: '特殊角函数值练习', difficulty: '入门', duration: '1-2 小时', goal: '熟练记忆并使用常见特殊角函数值。', acceptance: '能在 5 分钟内完成特殊角函数值表，正确率达到 90% 以上。' },
        { name: '三角函数图像识别', difficulty: '中级', duration: '2-3 小时', goal: '识别 sin、cos、tan 的基础图像和变化特征。', acceptance: '能画出基础图像，并指出周期、零点、最值或渐近线。' },
        { name: '三角恒等式基础证明', difficulty: '中级', duration: '2-3 小时', goal: '理解基础恒等式的变形思路。', acceptance: '能独立完成 5 道基础恒等式证明或化简题。' },
      ],
      checklist: ['能解释 sin/cos/tan 的定义', '能在单位圆上找到特殊角', '能画出基础三角函数图像', '能完成基础求值题', '能总结常用公式'],
    };
  }

  return {
    duration: '2-3 周',
    objective: '通过题型归纳、综合练习和错题复盘，把数学知识从“看懂”推进到“会用”。',
    audience: '适合已经理解基础概念，需要提升解题稳定性和综合应用能力的学习者。',
    tasks: [
      ['归纳题型结构', '2 小时', '把常见题型按条件、问法和解题入口分类。', '一份题型分类表。'],
      ['训练公式变形', '3-5 小时', '练习等价变形、代换、化简和条件转换。', '10 道公式变形练习。'],
      ['完成综合题练习', '5-8 小时', '选择中等难度题目，训练多知识点联动。', '15 道综合题和解题步骤。'],
      ['建立错题本', '2-3 小时', '按错误类型整理错题，并写出正确思路。', '一份错题归因表。'],
      ['限时小测', '1-2 小时', '模拟阶段验收，检查准确率和速度。', '一次限时测验记录。'],
    ],
    practices: [
      { name: `${phaseName} 题型归纳`, difficulty: '中级', duration: '2 小时', goal: '看题能判断解题入口。', acceptance: '至少整理 4 类题型及对应方法。' },
      { name: `${phaseName} 综合练习`, difficulty: '中级', duration: '4-6 小时', goal: '提升综合应用和计算稳定性。', acceptance: '完成 10 道综合题，正确率达到 70% 以上。' },
      { name: '阶段小测复盘', difficulty: '中级', duration: '1-2 小时', goal: '明确下一步补弱方向。', acceptance: '列出 3 个薄弱点和对应补练计划。' },
    ],
    checklist: ['能识别主要题型', '能完成公式变形和条件转换', '能独立写出清晰解题步骤', '能复盘错题并避免重复错误', '能通过一次阶段小测'],
  };
}

function getLanguageTheme(goal: string, phaseName: string): PhaseTheme {
  return {
    duration: '1-2 周',
    objective: '通过输入、模仿和输出练习，建立稳定的语言学习节奏。',
    audience: '适合希望提升词汇、语法、听说读写或考试能力的学习者。',
    tasks: [
      ['明确使用场景', '1 小时', `确定学习「${goal}」主要用于考试、工作、旅行还是日常交流。`, '一份学习场景说明。'],
      ['建立词汇与表达清单', '2-3 小时', '整理本阶段高频词、短语和例句。', '30-50 个词汇表达卡片。'],
      ['完成输入练习', '3-5 小时', '进行精听、阅读或跟读，积累真实表达。', '3 份输入材料笔记。'],
      ['进行输出练习', '3-5 小时', '完成口语复述、短文写作或场景对话。', '2-3 份输出练习。'],
      ['复盘错误表达', '1-2 小时', '整理发音、语法、用词或表达不自然的问题。', '一份错句修正清单。'],
    ],
    practices: [
      { name: `${phaseName} 跟读复述`, difficulty: '入门', duration: '1-2 小时', goal: '提升语感和表达流畅度。', acceptance: '能复述一段 1-2 分钟材料。' },
      { name: `${phaseName} 写作练习`, difficulty: '中级', duration: '2 小时', goal: '把输入内容转化为自己的表达。', acceptance: '完成一篇短文并修正明显错误。' },
      { name: '表达复盘', difficulty: '中级', duration: '1 小时', goal: '建立可复用表达库。', acceptance: '整理 10 条可复用表达。' },
    ],
    checklist: ['能掌握本阶段高频词汇', '能听懂或读懂基础材料', '能完成短口语或短文输出', '能修正常见表达错误', '能制定下一阶段输入材料'],
  };
}

function getOfficeTheme(goal: string, phaseName: string): PhaseTheme {
  return {
    duration: '1-2 周',
    objective: '围绕真实办公场景掌握高频功能，形成可复用的操作流程。',
    audience: '适合希望提升表格、文档、演示或办公效率的学习者。',
    tasks: [
      ['明确办公场景', '1 小时', `确定「${goal}」要解决的具体工作问题。`, '一份场景和成果要求。'],
      ['熟悉核心功能', '2-4 小时', '学习本阶段最高频的按钮、函数、模板或流程。', '一份操作步骤笔记。'],
      ['完成案例练习', '3-5 小时', '用模拟或真实数据完成一份小成果。', '一份可查看的表格、文档或演示稿。'],
      ['检查格式和准确性', '1-2 小时', '检查公式、排版、数据和表达是否准确。', '一份质量检查清单。'],
      ['整理可复用模板', '2 小时', '把本次成果整理成下次可复用的模板。', '一个可复用模板。'],
    ],
    practices: [
      { name: `${phaseName} 功能练习`, difficulty: '入门', duration: '2 小时', goal: '掌握高频办公操作。', acceptance: '能独立完成 5 个高频操作。' },
      { name: `${phaseName} 场景案例`, difficulty: '中级', duration: '3-5 小时', goal: '解决一个真实办公问题。', acceptance: '成果格式清晰、数据准确、可复用。' },
      { name: '效率优化复盘', difficulty: '中级', duration: '1 小时', goal: '减少重复操作。', acceptance: '总结 3 个可复用步骤或快捷方式。' },
    ],
    checklist: ['能完成核心功能操作', '能独立做出阶段成果', '能检查数据或格式错误', '能整理可复用模板', '能说明下一步效率提升方向'],
  };
}

function getDesignTheme(goal: string, phaseName: string): PhaseTheme {
  return {
    duration: '1-2 周',
    objective: '通过审美分析、工具练习和小作品输出，建立设计学习闭环。',
    audience: '适合希望学习设计、影像、排版、UI 或视觉表达的学习者。',
    tasks: [
      ['明确设计目标', '1 小时', `确定「${goal}」的使用场景、受众和风格方向。`, '一份设计需求简述。'],
      ['分析优秀参考', '2-3 小时', '拆解 5 个优秀案例的版式、颜色、层级和细节。', '一份参考分析笔记。'],
      ['练习基础工具', '3-5 小时', '掌握本阶段必要工具和基础操作。', '3 个基础操作练习。'],
      ['完成小型设计稿', '4-8 小时', '根据明确需求完成一份小作品。', '一份可展示设计稿。'],
      ['根据反馈修改', '1-2 小时', '检查对齐、层级、配色和可读性。', '一版修改后的成果。'],
    ],
    practices: [
      { name: `${phaseName} 临摹练习`, difficulty: '入门', duration: '2-3 小时', goal: '理解优秀案例的结构和细节。', acceptance: '完成一份临摹并标注 5 个设计要点。' },
      { name: `${phaseName} 原创小稿`, difficulty: '中级', duration: '4-6 小时', goal: '把原则应用到自己的作品中。', acceptance: '作品有清晰层级、统一风格和基础规范。' },
      { name: '设计复盘', difficulty: '中级', duration: '1 小时', goal: '提升审美判断和修改能力。', acceptance: '列出 3 个问题和 3 个修改点。' },
    ],
    checklist: ['能说明设计目标和受众', '能分析参考案例优缺点', '能完成基础工具操作', '能产出一份阶段作品', '能根据反馈修改细节'],
  };
}

function getAiTheme(goal: string, phaseName: string): PhaseTheme {
  return {
    duration: '1-2 周',
    objective: '理解 AILINES AI 核心概念、典型场景和基本使用方法，避免只会套模板。',
    audience: '适合希望学习人工智能、机器学习、大模型或 AILINES AI 应用的学习者。',
    tasks: [
      ['梳理核心概念', '2 小时', '理解模型、数据、训练、推理、提示词等基础概念。', '一份术语表。'],
      ['分析应用场景', '2-3 小时', `围绕「${goal}」整理可落地的使用场景。`, '3 个场景卡片。'],
      ['练习结构化提问', '2-4 小时', '学习描述目标、约束、输入和输出格式。', '5 个提示词样例。'],
      ['评估输出质量', '2 小时', '从准确性、完整性、可执行性和风险角度检查结果。', '一份评估清单。'],
      ['完成小型应用练习', '4-6 小时', '用 AILINES AI 辅助完成一个学习或工作任务。', '一份可展示成果和复盘。'],
    ],
    practices: [
      { name: `${phaseName} 概念解释`, difficulty: '入门', duration: '1 小时', goal: '建立正确认知。', acceptance: '能解释 5 个 AILINES AI 相关术语。' },
      { name: `${phaseName} 场景练习`, difficulty: '中级', duration: '2-4 小时', goal: '把 AILINES AI 用到具体任务中。', acceptance: '完成 3 次提示迭代并记录差异。' },
      { name: '质量评估挑战', difficulty: '中级', duration: '1 小时', goal: '避免盲目信任输出。', acceptance: '能指出输出中的不足和修正方案。' },
    ],
    checklist: ['能解释核心概念', '能设计清晰提示词', '能判断输出质量', '能完成一个小型应用练习', '能说明风险和限制'],
  };
}

function commonApplicationTheme(goal: string, phaseName: string, domain: LearningDomain): PhaseTheme {
  const isProgramming = domain === 'programming';

  return {
    duration: '2-3 周',
    objective: isProgramming ? '把核心知识用于更完整的编码任务，形成可运行成果。' : '把核心知识用于真实场景，形成可检查、可复盘的阶段成果。',
    audience: '适合已了解基础知识，准备进入场景练习和能力巩固的学习者。',
    tasks: [
      ['拆解阶段目标', '1-2 小时', `明确「${phaseName}」要解决的问题和验收标准。`, '一份目标拆解清单。'],
      ['学习关键方法', '4-6 小时', '集中学习本阶段最高频的方法、流程或工具。', '一份方法笔记。'],
      ['完成主题练习', '5-8 小时', '用多个小练习巩固同一类能力。', '3 个练习结果和复盘。'],
      ['整理常见问题', '2 小时', '记录卡点、错误和解决路径。', '一份问题排查清单。'],
      ['完成阶段成果', '1-2 天', isProgramming ? '串联核心能力完成可运行任务。' : '串联核心能力完成可展示成果。', isProgramming ? '一个结构清晰的阶段项目。' : '一份结构清晰的阶段成果。'],
    ],
    practices: [
      { name: `${phaseName} 主题练习`, difficulty: '入门', duration: '2-3 小时', goal: '巩固本阶段关键方法。', acceptance: '完成 3 个小练习并写出复盘。' },
      { name: `${phaseName} 场景任务`, difficulty: '中级', duration: '4-8 小时', goal: `围绕「${goal}」完成一个阶段成果。`, acceptance: '目标明确、过程可复现、结果能说明。' },
      { name: '阶段复盘挑战', difficulty: '中级', duration: '1-2 小时', goal: '整理问题，判断是否可以进入下一阶段。', acceptance: '列出已掌握内容、仍卡住的问题和下一阶段行动。' },
    ],
    checklist: ['能独立解释本阶段核心概念', '能完成至少 3 个基础练习', isProgramming ? '能运行并说明阶段项目' : '能展示并说明阶段成果', '能总结常见问题和解决办法', '能判断自己是否适合进入下一阶段学习'],
  };
}

function getGeneralTheme(goal: string, phaseName: string): PhaseTheme {
  return commonApplicationTheme(goal, phaseName, 'general');
}

function getTheme(goal: string, phaseName: string, phaseIndex: number, domain: LearningDomain): PhaseTheme {
  switch (domain) {
    case 'programming':
      return getProgrammingTheme(goal, phaseName, phaseIndex);
    case 'math':
      return getMathTheme(goal, phaseName, phaseIndex);
    case 'language':
      return getLanguageTheme(goal, phaseName);
    case 'office':
      return getOfficeTheme(goal, phaseName);
    case 'design':
      return getDesignTheme(goal, phaseName);
    case 'ai':
      return getAiTheme(goal, phaseName);
    default:
      return getGeneralTheme(goal, phaseName);
  }
}


function createTeachingSteps(goal: string, phaseName: string, domain: LearningDomain, tasks: PhaseTask[]): PhaseStep[] {
  const safeGoal = goal || '当前学习目标';
  const safePhase = phaseName || '当前阶段';
  const baseTasks = Array.isArray(tasks) && tasks.length > 0 ? tasks.slice(0, 4) : [
    { title: `拆清「${safePhase}」学习场景`, duration: '1 小时', description: `明确「${safePhase}」在「${safeGoal}」里要解决的具体问题、使用场景和验收标准。`, output: '一份场景与验收清单' },
    { title: '学习核心方法', duration: '2 小时', description: '掌握本阶段最高频的方法。', output: '方法笔记' },
    { title: '完成练习复盘', duration: '2 小时', description: '用练习检查理解程度。', output: '练习记录' },
  ];

  return baseTasks.slice(0, 4).map((task, index) => {
    const order = index + 1;
    if (domain === 'math') {
      return {
        title: `第 ${order} 步：${task.title}`,
        explanation: `这一阶段学习「${safeGoal}」不能只背结论，要先把题目背后的概念、条件和变化关系讲清楚。你现在要围绕「${task.title}」建立一个可复述的理解：它解决什么问题，和前后知识有什么联系，什么时候使用，容易和哪个概念混淆。学的时候先看定义，再画图或列公式，最后用简单题验证。这样后面遇到综合题时，你不是机械套公式，而是能判断从哪个条件入手。`,
        example: `例题：给出一个基础条件，先标出已知量和要求量，再写出可用公式，最后逐步代入计算；如果是三角函数，可用单位圆或函数图像解释正负、周期和特殊值。`,
        action: `完成「${task.description}」，把每一步推理写出来，不要只写答案。`,
        check: `能用自己的话解释本步骤，并独立完成 3 道同类题且写出清晰过程。`,
      };
    }

    if (domain === 'programming') {
      return {
        title: `第 ${order} 步：${task.title}`,
        explanation: `学习「${safeGoal}」时，这一步不是只看一遍教程，而是要把概念、代码和调试连接起来。你需要先理解「${task.title}」在真实开发中解决什么问题，再写一个最小可运行示例，观察输入、处理和输出分别是什么。遇到报错时，不要急着复制答案，先读错误信息、定位行号、缩小问题范围，再修改验证。这样你会形成“理解—编码—运行—调试—复盘”的闭环，而不是停留在看懂。`,
        example: `示例：为当前知识点写一个 10-20 行的小程序，例如输入数据、处理逻辑、打印结果；如果报错，记录错误原文、原因判断和最终修复方法。`,
        action: `完成「${task.description}」，并把代码、运行截图或关键输出保存到笔记里。`,
        check: `能独立复现示例，改一个参数后仍能解释结果；出现基础报错时能说出排查顺序。`,
      };
    }

    if (domain === 'office' || domain === 'design') {
      return {
        title: `第 ${order} 步：${task.title}`,
        explanation: `这一阶段的关键是把「${safeGoal}」放进真实使用场景里理解。你需要先明确使用者是谁、要完成什么结果、质量标准是什么，再学习对应功能或方法。不要只记按钮位置，而要知道为什么这样操作、错误操作会带来什么后果、成果如何检查。完成后把流程整理成模板，下次遇到类似任务就可以复用。`,
        example: `场景：围绕一个真实任务制作表格、文档、设计稿或模板，先做基础版本，再检查格式、数据、层级或可读性。`,
        action: `按「${task.description}」完成一个可查看成果，并记录操作流程。`,
        check: `成果能被他人打开和理解，关键步骤可复现，并至少发现 1 个可优化点。`,
      };
    }

    if (domain === 'language') {
      return {
        title: `第 ${order} 步：${task.title}`,
        explanation: `语言学习不能只背材料，要把输入、模仿、输出和复盘连成循环。你在「${task.title}」这一步要先接触真实表达，标出高频词句，再用自己的话复述或改写。输出时不要追求一次完美，重点是让表达能被理解，然后根据错误记录修正发音、语法、用词或语序。持续这样练，才能从“看得懂”变成“说得出、写得出”。`,
        example: `例子：选一段短材料，先跟读 3 遍，再整理 10 个表达，最后用这些表达写一段 80-120 字短文或做 1 分钟口头复述。`,
        action: `完成「${task.description}」，保留原始输出和修改后的版本。`,
        check: `能复述材料主旨，并把至少 5 个新表达用在自己的句子里。`,
      };
    }

    return {
      title: `第 ${order} 步：${task.title}`,
      explanation: `学习「${safeGoal}」要避免只看清单式建议。你在「${safePhase}」中需要先理解这一步解决的核心问题，再把它拆成可执行动作：学什么、练什么、产出什么、如何检查。每完成一个动作都要留下证据，例如笔记、练习记录、截图、代码、错题或成果说明。这样学习过程才可追踪，也方便后续让 AILINES AI 根据你的卡点继续讲解。`,
      example: `例子：围绕「${task.title}」做一次小练习，先写目标，再执行 30-60 分钟，最后用 5 句话复盘学到了什么、哪里卡住、下一步怎么改。`,
      action: `完成「${task.description}」，并整理一个阶段小产出。`,
      check: `能清楚说明本步骤的目的、方法和产出，并知道下一步该练什么。`,
    };
  });
}

function getResources(goal: string, phaseName: string, domain: LearningDomain): PhaseResource[] {
  if (domain === 'math') {
    return [
      { name: '数学教材对应章节', type: '教材', difficulty: '入门', free: true, description: '优先回到教材定义、例题和课后练习，确保概念准确。', href: '#' },
      { name: 'Khan Academy 三角函数', type: '视频', difficulty: '入门', free: true, description: '通过短视频和练习理解角度、单位圆和三角函数图像。', href: 'https://www.khanacademy.org/math/trigonometry' },
      { name: '3Blue1Brown 三角函数相关视频', type: '视频', difficulty: '中级', free: true, description: '用几何直觉理解三角函数、单位圆和周期变化。', href: 'https://www.3blue1brown.com/' },
      { name: 'B站高中数学三角函数入门视频', type: '视频', difficulty: '入门', free: true, description: '适合配合国内教材节奏学习基础题型。', href: 'https://www.bilibili.com/' },
    ];
  }

  if (domain === 'programming') {
    if (/(python|数据分析|pandas|numpy)/i.test(`${goal} ${phaseName}`)) {
      return [
        { name: 'Python 官方教程', type: '官方文档', difficulty: '入门', free: true, description: '适合系统补齐 Python 基础语法和标准库认知。', href: 'https://docs.python.org/zh-cn/3/tutorial/' },
        { name: 'Pandas Getting Started', type: '官方文档', difficulty: '中级', free: true, description: '学习数据读取、清洗、筛选和分析的核心入口。', href: 'https://pandas.pydata.org/docs/getting_started/index.html' },
        { name: 'Kaggle Learn: Python', type: '互动课程', difficulty: '入门', free: true, description: '短练习驱动，适合快速建立实践手感。', href: 'https://www.kaggle.com/learn/python' },
      ];
    }

    return [
      { name: 'MDN Web Docs', type: '官方文档', difficulty: '入门', free: true, description: '适合查阅 Web 和编程基础概念。', href: 'https://developer.mozilla.org/' },
      { name: 'freeCodeCamp', type: '互动课程', difficulty: '入门', free: true, description: '通过项目和练习学习编程基础。', href: 'https://www.freecodecamp.org/' },
      { name: '官方文档', type: '官方文档', difficulty: '中级', free: true, description: '优先查阅对应技术的官方文档。', href: 'https://developer.mozilla.org/' },
    ];
  }

  if (domain === 'language') {
    return [
      { name: 'BBC Learning English', type: '视频', difficulty: '入门', free: true, description: '适合英语听说和表达练习。', href: 'https://www.bbc.co.uk/learningenglish' },
      { name: 'YouGlish', type: '工具', difficulty: '入门', free: true, description: '通过真实视频例句学习发音和语境。', href: 'https://youglish.com/' },
      { name: '阶段表达库', type: '练习册', difficulty: '入门', free: true, description: '整理本阶段词汇、句型和错句。', href: '#' },
    ];
  }

  if (domain === 'office') {
    return [
      { name: 'Microsoft Support', type: '官方文档', difficulty: '入门', free: true, description: '查询 Excel、Word、PPT 等办公功能说明。', href: 'https://support.microsoft.com/zh-cn' },
      { name: 'Microsoft Learn', type: '官方文档', difficulty: '中级', free: true, description: '系统学习办公工具和数据处理流程。', href: 'https://learn.microsoft.com/' },
      { name: '阶段模板库', type: '工具', difficulty: '入门', free: true, description: '沉淀可复用模板和检查清单。', href: '#' },
    ];
  }

  if (domain === 'design') {
    return [
      { name: 'Figma Learn', type: '官方文档', difficulty: '入门', free: true, description: '学习设计工具和协作流程。', href: 'https://help.figma.com/' },
      { name: 'Canva Design School', type: '文章', difficulty: '入门', free: true, description: '适合学习版式、配色和视觉表达基础。', href: 'https://www.canva.com/learn/design-school/' },
      { name: '阶段参考板', type: '工具', difficulty: '入门', free: true, description: '收集优秀案例并拆解设计要点。', href: '#' },
    ];
  }

  if (domain === 'ai') {
    return [
      { name: 'Google Machine Learning Crash Course', type: '互动课程', difficulty: '入门', free: true, description: '理解机器学习基本概念和流程。', href: 'https://developers.google.com/machine-learning/crash-course' },
      { name: 'Microsoft AI Learning Hub', type: '官方文档', difficulty: '入门', free: true, description: '了解 AILINES AI 应用、概念和实践路线。', href: 'https://learn.microsoft.com/ai/' },
      { name: '阶段提示词记录表', type: '工具', difficulty: '入门', free: true, description: '记录提示词、输出质量和迭代过程。', href: '#' },
    ];
  }

  return [
    { name: '官方或权威入门资料', type: '教材', difficulty: '入门', free: true, description: '优先选择结构清晰、来源可靠的入门资料。', href: '#' },
    { name: '阶段练习清单', type: '练习册', difficulty: '入门', free: true, description: '把知识点转成可完成、可复盘的小练习。', href: '#' },
    { name: '学习复盘模板', type: '工具', difficulty: '入门', free: true, description: '记录目标、过程、问题和下一步计划。', href: '#' },
  ];
}

export function getMockPhaseDetail(goal: string, phaseName: string, phaseIndex: number): MockPhaseDetail {
  const safeGoal = goal.trim() || '当前学习目标';
  const safePhaseName = phaseName.trim() || `阶段${phaseIndex || 1}`;
  const safePhaseIndex = Number.isFinite(phaseIndex) && phaseIndex > 0 ? phaseIndex : 1;
  const domain = detectLearningDomain(`${safeGoal} ${safePhaseName}`);
  const theme = getTheme(safeGoal, safePhaseName, safePhaseIndex, domain);

  const tasks = Array.isArray(theme.tasks) ? theme.tasks.map(([title, duration, description, output]) => ({ title, duration, description, output })) : [];

  return {
    phaseName: safePhaseName,
    goal: safeGoal,
    duration: theme.duration || '1-2 周',
    objective: theme.objective || '掌握本阶段核心能力。',
    why: `先学「${safePhaseName}」是为了给「${safeGoal}」建立稳定基础，避免直接跳到复杂任务时只会照抄步骤。`,
    output: tasks[tasks.length - 1]?.output || '一份可检查的阶段学习成果。',
    commonMistakes: ['只看教程不动手练习', '没有记录错误原因和修复过程', '跳过阶段检查点直接进入下一阶段'],
    audience: theme.audience || '希望稳步推进当前目标的学习者。',
    steps: createTeachingSteps(safeGoal, safePhaseName, domain, tasks),
    tasks,
    resources: getResources(safeGoal, safePhaseName, domain),
    practices: Array.isArray(theme.practices) ? theme.practices : [],
    checklist: Array.isArray(theme.checklist) ? theme.checklist : [],
  };
}
