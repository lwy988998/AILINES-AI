export type PhaseTask = {
  title: string;
  duration: string;
  description: string;
  output: string;
};

export type PhaseResource = {
  name: string;
  type: '官方文档' | '互动课程' | '视频' | '文章' | '工具';
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

export type MockPhaseDetail = {
  phaseName: string;
  goal: string;
  duration: string;
  objective: string;
  audience: string;
  tasks: PhaseTask[];
  resources: PhaseResource[];
  practices: PhasePractice[];
  checklist: string[];
};

function getPhaseTheme(phaseName: string, phaseIndex: number) {
  const normalizedName = phaseName.toLowerCase();

  if (/python|基础|语法|html|css|js|数学|函数|目标/.test(normalizedName) || phaseIndex === 1) {
    return {
      duration: '1-2 周',
      objective: '建立稳定的基础概念、工具环境和最小练习闭环，为后续阶段打底。',
      audience: '适合刚开始学习、基础不稳或希望重新梳理学习路径的学习者。',
      tasks: [
        ['配置开发与学习环境', '1-2 小时', '安装必要工具，建立项目文件夹和学习笔记模板。', '可运行的本地环境和一份环境配置记录。'],
        ['理解核心概念与术语', '2-3 小时', '梳理本阶段最常见概念，避免后续学习只会照抄。', '一页核心概念速查笔记。'],
        ['完成基础语法或基础操作练习', '4-6 小时', '围绕变量、流程、常用操作或基础工具做小练习。', '至少 10 个可复盘的小练习。'],
        ['阅读官方入门章节', '2-3 小时', '优先阅读官方或权威入门资料，建立正确心智模型。', '整理 5 个关键知识点和 3 个常见坑。'],
        ['完成阶段小项目', '4-8 小时', '用本阶段知识完成一个小而完整的任务。', '一个可运行、可展示、可说明的小项目。'],
      ],
    };
  }

  if (/pandas|numpy|数据|组件|状态|算法|清洗|核心/.test(normalizedName) || phaseIndex === 2) {
    return {
      duration: '2-3 周',
      objective: '掌握核心工具和高频工作流，能独立完成常见任务。',
      audience: '适合已了解基础知识，准备进入真实任务练习的学习者。',
      tasks: [
        ['拆解核心工作流', '2 小时', '把本阶段常见任务拆成输入、处理、输出三个部分。', '一张任务流程图或步骤清单。'],
        ['学习关键 API 与操作', '5-8 小时', '集中练习最高频的函数、组件、算法或操作。', '一份常用操作示例集。'],
        ['完成 3 个主题练习', '6-10 小时', '用不同小场景反复训练同一类能力。', '3 个独立练习结果和复盘记录。'],
        ['整理错误与调试清单', '2-3 小时', '记录报错、边界情况和排查路径。', '一份常见问题排查清单。'],
        ['做一个中等复杂度任务', '1-2 天', '串联本阶段核心能力完成完整任务。', '一个结构清晰的阶段作品。'],
        ['复盘并补齐薄弱点', '2 小时', '根据练习结果找出不熟练的概念并补学。', '下一阶段前的补强列表。'],
      ],
    };
  }

  if (/可视化|路由|评估|透视|场景|训练/.test(normalizedName) || phaseIndex === 3) {
    return {
      duration: '2-3 周',
      objective: '把核心知识应用到更接近真实需求的场景中，提升表达和判断能力。',
      audience: '适合已能完成基础任务，希望提升项目化应用能力的学习者。',
      tasks: [
        ['选择真实练习场景', '1-2 小时', '从自己的目标中选一个具体应用场景，明确产出。', '一份场景说明和验收标准。'],
        ['学习场景化方法', '4-6 小时', '围绕图表、路由、评估、分析或自动化等场景学习方法。', '一份方法卡片和示例。'],
        ['完成对比型练习', '4-6 小时', '对比不同方案、参数、表达方式或实现方式。', '一份对比结论。'],
        ['优化结果表达', '3-5 小时', '关注可读性、结构、命名、说明和复现流程。', '一版经过整理的输出结果。'],
        ['接受一次自测或反馈', '2 小时', '按 checklist 检查阶段产出，记录问题。', '一份自测记录。'],
      ],
    };
  }

  return {
    duration: '2-3 周',
    objective: '完成可展示的综合作品，把前面阶段的知识串成完整能力闭环。',
    audience: '适合已经完成基础与核心练习，准备沉淀作品或进入实战的人。',
    tasks: [
      ['确定项目题目与范围', '2 小时', '选择一个足够小但完整的项目，明确边界和验收标准。', '项目说明文档。'],
      ['设计项目结构', '2-4 小时', '规划文件结构、数据流、页面结构或分析流程。', '项目结构草图或 README 大纲。'],
      ['完成第一版实现', '1-2 天', '先保证主流程跑通，不追求一次做到完美。', '可运行的项目初版。'],
      ['补充说明和复现步骤', '3-5 小时', '整理安装、运行、结果解释和关键决策。', '完整 README 或报告。'],
      ['完成验收与复盘', '2-3 小时', '按阶段目标检查结果，记录问题和下一步。', '复盘记录和下一阶段计划。'],
    ],
  };
}

function getResources(goal: string, phaseName: string): PhaseResource[] {
  if (/(python|数据分析|pandas|numpy)/i.test(`${goal} ${phaseName}`)) {
    return [
      { name: 'Python 官方教程', type: '官方文档', difficulty: '入门', free: true, description: '适合系统补齐 Python 基础语法和标准库认知。', href: 'https://docs.python.org/zh-cn/3/tutorial/' },
      { name: 'Pandas Getting Started', type: '官方文档', difficulty: '中级', free: true, description: '学习数据读取、清洗、筛选和分析的核心入口。', href: 'https://pandas.pydata.org/docs/getting_started/index.html' },
      { name: 'Kaggle Learn: Python', type: '互动课程', difficulty: '入门', free: true, description: '短练习驱动，适合快速建立实践手感。', href: 'https://www.kaggle.com/learn/python' },
      { name: 'Seaborn Example Gallery', type: '官方文档', difficulty: '中级', free: true, description: '通过图表示例学习数据可视化表达。', href: 'https://seaborn.pydata.org/examples/index.html' },
    ];
  }

  if (/(react|前端|javascript|typescript|html|css)/i.test(`${goal} ${phaseName}`)) {
    return [
      { name: 'React 官方文档', type: '官方文档', difficulty: '入门', free: true, description: '学习组件、状态和现代 React 思维的首选资料。', href: 'https://react.dev/' },
      { name: 'MDN Web Docs', type: '官方文档', difficulty: '入门', free: true, description: 'HTML、CSS、JavaScript 权威参考。', href: 'https://developer.mozilla.org/' },
      { name: 'TypeScript Handbook', type: '官方文档', difficulty: '中级', free: true, description: '为前端项目补齐类型系统基础。', href: 'https://www.typescriptlang.org/docs/' },
    ];
  }

  return [
    { name: '官方入门文档', type: '官方文档', difficulty: '入门', free: true, description: '优先阅读官方入门章节，建立准确概念。', href: 'https://developer.mozilla.org/' },
    { name: 'freeCodeCamp 学习文章', type: '文章', difficulty: '入门', free: true, description: '用案例文章补充基础知识和实践思路。', href: 'https://www.freecodecamp.org/news/' },
    { name: 'GitHub Explore', type: '工具', difficulty: '中级', free: true, description: '寻找相关开源项目，学习真实项目结构。', href: 'https://github.com/explore' },
  ];
}

export function getMockPhaseDetail(goal: string, phaseName: string, phaseIndex: number): MockPhaseDetail {
  const safeGoal = goal.trim() || '当前学习目标';
  const safePhaseName = phaseName.trim() || `阶段${phaseIndex || 1}`;
  const safePhaseIndex = Number.isFinite(phaseIndex) && phaseIndex > 0 ? phaseIndex : 1;
  const theme = getPhaseTheme(safePhaseName, safePhaseIndex);

  return {
    phaseName: safePhaseName,
    goal: safeGoal,
    duration: theme.duration,
    objective: theme.objective,
    audience: theme.audience,
    tasks: theme.tasks.map(([title, duration, description, output]) => ({ title, duration, description, output })),
    resources: getResources(safeGoal, safePhaseName),
    practices: [
      {
        name: `${safePhaseName} 概念练习`,
        difficulty: '入门',
        duration: '2-3 小时',
        goal: '确认自己能解释本阶段核心概念，而不是只会跟着教程操作。',
        acceptance: '能用自己的话说明 5 个核心概念，并写出对应例子。',
      },
      {
        name: `${safePhaseName} 小项目`,
        difficulty: '中级',
        duration: '4-8 小时',
        goal: `围绕「${safeGoal}」完成一个可运行、可展示的小成果。`,
        acceptance: '有明确输入、处理过程、输出结果和简短复盘。',
      },
      {
        name: '阶段复盘挑战',
        difficulty: '中级',
        duration: '1-2 小时',
        goal: '整理本阶段问题，判断是否可以进入下一阶段。',
        acceptance: '列出已掌握内容、仍卡住的问题和下一阶段行动。',
      },
    ],
    checklist: [
      '能独立解释本阶段核心概念',
      '能完成至少 3 个基础练习',
      '能运行并说明阶段小项目',
      '能总结常见问题和解决办法',
      '能判断自己是否适合进入下一阶段学习',
    ],
  };
}
