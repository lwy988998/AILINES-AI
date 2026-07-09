export type CourseStep = {
  title: string;
  explanation: string;
  example?: string;
  action: string;
  check: string;
};

export type RoadmapStage = {
  name: string;
  duration: string;
  goal: string;
  description: string;
  why?: string;
  output?: string;
  practice?: string;
  checkpoint?: string;
  commonMistakes?: string[];
  steps?: CourseStep[];
};

export type CourseStage = {
  stage: string;
  topics: string[];
};

export type ResourceItem = {
  name: string;
  type:
    | 'GitHub'
    | '官方文档'
    | '视频'
    | '文章'
    | '在线课程'
    | '视频教程'
    | '图文教程'
    | '开源项目'
    | '工具环境'
    | '项目实战'
    | '练习题库'
    | '社区资源'
    | '其他';
  difficulty: '入门' | '中级' | '进阶';
  free: boolean;
  description: string;
  href: string;
};

export type ProjectItem = {
  name: string;
  difficulty: '入门' | '中级' | '进阶';
  duration: string;
  output: string;
  acceptance: string;
};

export type MockPlan = {
  title: string;
  duration: string;
  summary: string;
  overview?: string;
  audience?: string;
  prerequisites?: string[];
  outcome?: string;
  roadmap: RoadmapStage[];
  courseStructure: CourseStage[];
  resources: ResourceItem[];
  projects: ProjectItem[];
};

function createPlan(plan: MockPlan): MockPlan {
  return plan;
}

const pythonPlan = createPlan({
  title: 'Python 数据分析学习方案',
  duration: '10 周',
  summary: '从 Python 基础到 Pandas 数据处理、可视化和完整分析报告，适合想用数据解决实际问题的学习者。',
  roadmap: [
    { name: '阶段一：Python 基础', duration: '2 周', goal: '掌握 Python 基础语法与开发环境', description: '完成变量、条件、循环、函数、文件读取等基础能力，为数据分析打底。' },
    { name: '阶段二：NumPy / Pandas', duration: '3 周', goal: '能清洗和整理常见表格数据', description: '学习 Series、DataFrame、缺失值处理、分组聚合和数据合并。' },
    { name: '阶段三：数据可视化', duration: '2 周', goal: '把分析结果转化为清晰图表', description: '使用 Matplotlib / Seaborn 展示趋势、分布、对比和相关性。' },
    { name: '阶段四：综合分析项目', duration: '3 周', goal: '完成一份可展示的数据分析报告', description: '选择公开数据集，完成问题定义、清洗、分析、可视化和结论输出。' },
  ],
  courseStructure: [
    { stage: '阶段一：Python 基础', topics: ['安装 Python 与编辑器', '变量与数据类型', '条件与循环', '函数与模块', '文件读写'] },
    { stage: '阶段二：NumPy / Pandas', topics: ['数组与向量化计算', 'DataFrame 基础', '数据筛选与排序', '缺失值处理', '分组聚合', '多表合并'] },
    { stage: '阶段三：数据可视化', topics: ['图表类型选择', 'Matplotlib 基础', 'Seaborn 统计图', '中文字体与样式', '图表解读'] },
    { stage: '阶段四：综合分析项目', topics: ['提出分析问题', '寻找公开数据集', '数据清洗流程', '指标设计', '报告结构', '结论与建议'] },
  ],
  resources: [
    { name: 'Python 官方文档', type: '官方文档', difficulty: '入门', free: true, description: '查询语法、标准库和基础用法的一手资料。', href: 'https://docs.python.org/zh-cn/3/' },
    { name: 'Pandas 官方文档', type: '官方文档', difficulty: '中级', free: true, description: '学习 DataFrame、数据清洗和分析 API 的核心资料。', href: 'https://pandas.pydata.org/docs/' },
    { name: 'Kaggle Learn Pandas', type: '文章', difficulty: '入门', free: true, description: '短小练习驱动，适合快速上手数据分析。', href: 'https://www.kaggle.com/learn/pandas' },
    { name: 'Seaborn Gallery', type: '官方文档', difficulty: '中级', free: true, description: '通过图表示例学习可视化表达。', href: 'https://seaborn.pydata.org/examples/index.html' },
  ],
  projects: [
    { name: '个人消费分析报告', difficulty: '入门', duration: '3 天', output: '一份包含分类统计和趋势图的消费分析报告。', acceptance: '至少完成数据清洗、3 个核心指标、4 张图表和结论说明。' },
    { name: '电商销售数据分析', difficulty: '中级', duration: '1 周', output: '销售趋势、品类贡献和用户行为分析 Notebook。', acceptance: '能解释销售变化原因，并给出 3 条业务建议。' },
    { name: '公开数据综合分析', difficulty: '中级', duration: '2 周', output: '完整 README、Notebook 和可视化结果。', acceptance: '问题清晰、流程完整、图表可读、结论可复现。' },
  ],
});

const reactPlan = createPlan({
  title: 'React 前端开发学习方案',
  duration: '10 周',
  summary: '从 Web 基础到 React 组件、状态管理、路由和项目实战，适合想入门现代前端开发的学习者。',
  roadmap: [
    { name: '阶段一：HTML/CSS/JS 基础', duration: '2 周', goal: '建立网页结构、样式和交互基础', description: '掌握语义化 HTML、响应式 CSS 和 JavaScript 基础语法。' },
    { name: '阶段二：React 组件与状态', duration: '3 周', goal: '能拆分组件并管理页面状态', description: '学习 JSX、props、state、事件处理、列表渲染和表单。' },
    { name: '阶段三：路由与数据请求', duration: '2 周', goal: '构建多页面前端应用', description: '掌握路由、API 请求、加载状态、错误处理和基础 TypeScript。' },
    { name: '阶段四：前端项目实战', duration: '3 周', goal: '完成一个可部署的前端作品', description: '围绕真实需求完成页面、组件、状态、接口模拟和部署。' },
  ],
  courseStructure: [
    { stage: '阶段一：HTML/CSS/JS 基础', topics: ['HTML 语义化', 'Flex/Grid 布局', '响应式设计', 'JavaScript 基础', 'DOM 与事件'] },
    { stage: '阶段二：React 组件与状态', topics: ['JSX 语法', '组件拆分', 'props 与 state', '条件和列表渲染', '表单处理', 'Hooks 基础'] },
    { stage: '阶段三：路由与数据请求', topics: ['React Router / App Router 概念', 'fetch 数据请求', '加载与错误状态', 'TypeScript Props 类型', '组件复用'] },
    { stage: '阶段四：前端项目实战', topics: ['需求拆解', '页面结构设计', '组件库整理', 'Mock 数据', '部署上线', '性能与可访问性基础'] },
  ],
  resources: [
    { name: 'React 官方文档', type: '官方文档', difficulty: '入门', free: true, description: '学习现代 React 思维和 Hooks 的首选资料。', href: 'https://react.dev/' },
    { name: 'MDN Web Docs', type: '官方文档', difficulty: '入门', free: true, description: 'HTML、CSS、JavaScript 权威参考。', href: 'https://developer.mozilla.org/' },
    { name: 'TypeScript Handbook', type: '官方文档', difficulty: '中级', free: true, description: '为 React 项目补齐类型系统基础。', href: 'https://www.typescriptlang.org/docs/' },
    { name: 'Awesome React', type: 'GitHub', difficulty: '中级', free: true, description: 'React 生态资源、工具和项目集合。', href: 'https://github.com/enaqx/awesome-react' },
  ],
  projects: [
    { name: '个人作品集主页', difficulty: '入门', duration: '3 天', output: '响应式作品集页面。', acceptance: '包含首页、项目列表、联系入口，并适配移动端。' },
    { name: '任务管理 Todo App', difficulty: '中级', duration: '1 周', output: '支持新增、完成、筛选和本地保存的任务应用。', acceptance: '组件拆分清晰，状态更新稳定，刷新后数据保留。' },
    { name: '学习路线 Dashboard', difficulty: '中级', duration: '2 周', output: '包含列表、详情、进度和问答入口的前端项目。', acceptance: '页面完整、路由可用、Mock 数据清晰、README 可运行。' },
  ],
});

const mlPlan = createPlan({
  title: '机器学习入门到实战方案',
  duration: '12 周',
  summary: '从 Python、数学基础到经典算法、模型评估和项目实战，帮助你建立机器学习完整工作流。',
  roadmap: [
    { name: '阶段一：Python 与数学基础', duration: '3 周', goal: '补齐建模前置基础', description: '学习 Python 数据处理、线性代数、概率统计和基础可视化。' },
    { name: '阶段二：经典机器学习算法', duration: '3 周', goal: '理解常见监督/无监督算法', description: '掌握回归、分类、聚类、决策树和模型选择思路。' },
    { name: '阶段三：模型训练与评估', duration: '3 周', goal: '能完成规范的训练评估流程', description: '学习数据划分、特征工程、交叉验证、指标选择和调参。' },
    { name: '阶段四：实战项目', duration: '3 周', goal: '完成一个端到端机器学习项目', description: '从数据集选择到训练、评估、解释和报告输出。' },
  ],
  courseStructure: [
    { stage: '阶段一：Python 与数学基础', topics: ['NumPy 基础', 'Pandas 数据处理', '线性代数直觉', '概率统计基础', '可视化探索'] },
    { stage: '阶段二：经典机器学习算法', topics: ['线性回归', '逻辑回归', 'KNN', '决策树与随机森林', 'K-Means 聚类', '过拟合与欠拟合'] },
    { stage: '阶段三：模型训练与评估', topics: ['训练/验证/测试集', '特征工程', '评估指标', '交叉验证', '超参数调优', '模型解释'] },
    { stage: '阶段四：实战项目', topics: ['问题定义', '数据清洗', 'Baseline 模型', '模型优化', '结果可视化', '项目报告'] },
  ],
  resources: [
    { name: 'scikit-learn 官方文档', type: '官方文档', difficulty: '中级', free: true, description: '学习经典机器学习算法和 API 的核心资料。', href: 'https://scikit-learn.org/stable/' },
    { name: 'Kaggle Learn Intro to ML', type: '文章', difficulty: '入门', free: true, description: '用短练习快速理解机器学习基本流程。', href: 'https://www.kaggle.com/learn/intro-to-machine-learning' },
    { name: 'Google Machine Learning Crash Course', type: '视频', difficulty: '入门', free: true, description: '系统理解模型、损失、训练和评估。', href: 'https://developers.google.com/machine-learning/crash-course' },
    { name: 'Awesome Machine Learning', type: 'GitHub', difficulty: '进阶', free: true, description: '机器学习框架、资源和项目集合。', href: 'https://github.com/josephmisiti/awesome-machine-learning' },
  ],
  projects: [
    { name: '房价预测模型', difficulty: '入门', duration: '1 周', output: '一个回归预测 Notebook。', acceptance: '完成特征选择、模型训练、指标评估和误差分析。' },
    { name: '用户流失分类模型', difficulty: '中级', duration: '2 周', output: '一个分类模型与评估报告。', acceptance: '包含混淆矩阵、准确率/召回率/F1，并说明业务含义。' },
    { name: '端到端 Kaggle 项目', difficulty: '进阶', duration: '2-3 周', output: '完整建模流程和可复现实验记录。', acceptance: '有 baseline、调参过程、最终指标和复盘。' },
  ],
});

const excelPlan = createPlan({
  title: 'Excel 高级功能学习方案',
  duration: '8 周',
  summary: '围绕函数、数据清洗、数据透视表和自动化报表，提升办公数据处理效率。',
  roadmap: [
    { name: '阶段一：表格基础与函数', duration: '2 周', goal: '熟练使用常用函数和规范表格', description: '掌握引用、文本、日期、条件统计和查找函数。' },
    { name: '阶段二：数据清洗', duration: '2 周', goal: '能整理不规范业务表格', description: '学习去重、拆分、合并、格式规范和 Power Query 基础。' },
    { name: '阶段三：数据透视表', duration: '2 周', goal: '快速完成多维汇总分析', description: '掌握透视表字段、切片器、计算字段和图表联动。' },
    { name: '阶段四：自动化与报表', duration: '2 周', goal: '形成可复用的周/月报模板', description: '用模板、Power Query 和基础宏思路减少重复操作。' },
  ],
  courseStructure: [
    { stage: '阶段一：表格基础与函数', topics: ['表格规范', '相对/绝对引用', 'IF / SUMIF / COUNTIF', 'XLOOKUP / VLOOKUP', '日期与文本函数'] },
    { stage: '阶段二：数据清洗', topics: ['去重与缺失处理', '文本拆分合并', '格式标准化', 'Power Query 导入', '多表追加与合并'] },
    { stage: '阶段三：数据透视表', topics: ['字段布局', '分组统计', '切片器', '透视图', '计算字段', '动态看板'] },
    { stage: '阶段四：自动化与报表', topics: ['报表模板设计', '条件格式', '数据验证', 'Power Query 刷新', '宏录制入门'] },
  ],
  resources: [
    { name: 'Microsoft Excel 帮助', type: '官方文档', difficulty: '入门', free: true, description: 'Excel 函数、透视表和 Power Query 官方说明。', href: 'https://support.microsoft.com/zh-cn/excel' },
    { name: 'Exceljet', type: '文章', difficulty: '入门', free: true, description: '函数示例清晰，适合按问题查询。', href: 'https://exceljet.net/' },
    { name: 'Microsoft Learn Power Query', type: '官方文档', difficulty: '中级', free: true, description: '系统学习数据清洗和查询转换。', href: 'https://learn.microsoft.com/power-query/' },
    { name: 'Leila Gharani Excel', type: '视频', difficulty: '中级', free: true, description: '通过案例学习 Excel 自动化和报表技巧。', href: 'https://www.youtube.com/c/LeilaGharani' },
  ],
  projects: [
    { name: '个人预算追踪表', difficulty: '入门', duration: '2-3 天', output: '可自动汇总分类支出的预算表。', acceptance: '包含输入表、汇总表、图表和条件格式提醒。' },
    { name: '销售数据透视看板', difficulty: '中级', duration: '1 周', output: '按地区、品类、月份分析的 Excel 看板。', acceptance: '透视表和切片器可联动，指标清晰可读。' },
    { name: '月报自动化模板', difficulty: '中级', duration: '2 周', output: '可刷新数据源并自动生成月报的模板。', acceptance: '替换数据后可一键刷新，减少手动复制粘贴。' },
  ],
});

const genericPlan = createPlan({
  title: '通用技能学习方案',
  duration: '10 周',
  summary: '适合暂未命中特定领域的学习目标，先建立基础认知、核心技能、练习路径和作品产出。',
  roadmap: [
    { name: '阶段一：目标拆解', duration: '2 周', goal: '明确学习边界和应用场景', description: '梳理为什么学、学到什么程度、需要完成哪些可验证成果。' },
    { name: '阶段二：核心知识', duration: '3 周', goal: '掌握该技能的高频概念和工具', description: '围绕常见任务学习核心知识，形成稳定练习节奏。' },
    { name: '阶段三：场景练习', duration: '3 周', goal: '把知识用于真实场景', description: '完成多个小练习，逐步提升独立解决问题的能力。' },
    { name: '阶段四：作品巩固', duration: '2 周', goal: '完成一个可展示成果', description: '整理成果、复盘问题，并规划下一阶段进阶路线。' },
  ],
  courseStructure: [
    { stage: '阶段一：目标拆解', topics: ['学习目标定义', '能力地图', '工具准备', '时间安排', '验收标准'] },
    { stage: '阶段二：核心知识', topics: ['基础概念', '常用工具', '典型流程', '常见错误', '案例拆解'] },
    { stage: '阶段三：场景练习', topics: ['小任务练习', '问题定位', '资料查询', '结果优化', '复盘记录'] },
    { stage: '阶段四：作品巩固', topics: ['项目选题', '成果整理', '展示说明', '反馈收集', '下一步计划'] },
  ],
  resources: [
    { name: 'Coursera', type: '视频', difficulty: '入门', free: true, description: '可按主题搜索系统课程。', href: 'https://www.coursera.org/' },
    { name: 'freeCodeCamp', type: '文章', difficulty: '入门', free: true, description: '大量免费学习文章和实践资源。', href: 'https://www.freecodecamp.org/news/' },
    { name: 'GitHub Explore', type: 'GitHub', difficulty: '中级', free: true, description: '寻找相关开源项目和学习样例。', href: 'https://github.com/explore' },
    { name: 'MDN Learn', type: '官方文档', difficulty: '入门', free: true, description: '适合补齐 Web 和技术学习基础。', href: 'https://developer.mozilla.org/en-US/docs/Learn' },
  ],
  projects: [
    { name: '学习笔记库', difficulty: '入门', duration: '3 天', output: '结构化笔记和案例清单。', acceptance: '至少沉淀 10 个知识点、5 个练习和 1 次复盘。' },
    { name: '小型实践任务', difficulty: '中级', duration: '1 周', output: '围绕真实场景完成一个小成果。', acceptance: '目标明确、过程可复现、结果能展示。' },
    { name: '综合作品', difficulty: '中级', duration: '2 周', output: '一个可对外展示的完整作品或报告。', acceptance: '包含背景、过程、成果、问题和后续优化。' },
  ],
});

function createFallbackSteps(goal: string, stage: RoadmapStage, domain: 'python' | 'math' | 'gpt' | 'tool' | 'general'): CourseStep[] {
  const safeGoal = goal.trim() || '当前目标';
  const stageName = stage.name || '当前阶段';

  if (domain === 'math') {
    return [
      {
        title: `第 1 步：先把「${stageName}」的概念讲清楚`,
        explanation: `学习「${safeGoal}」时，最容易出问题的是直接背公式、直接刷题，却没有弄懂每个符号和条件是什么意思。第一步要把定义、图像、公式来源和适用范围连起来理解：它解决什么问题，题目给出的条件对应哪个概念，为什么这一步可以这样变形。你可以用画图、列表或代入简单数字的方式验证概念，不要只看答案。`,
        example: `如果学习三角函数，就先画单位圆，标出特殊角，再说明 sin、cos、tan 分别对应什么量，而不是直接背表格。`,
        action: '整理一页概念笔记，把定义、图像、公式和典型题型放在一起。',
        check: '能不看资料说出核心定义，并用一个简单例题解释公式为什么能用。',
      },
      {
        title: `第 2 步：用例题练分步解题`,
        explanation: `真正掌握数学不是“看懂解析”，而是能自己写出从已知到结论的路径。做例题时先圈出已知条件，再判断题型入口，然后写出每一步使用的公式或推理依据。遇到不会的题，不要马上看完整答案，可以先看第一步提示，再自己补全后续过程。这样训练能让你形成稳定的解题顺序，减少考试或作业中跳步导致的错误。`,
        example: '例题复盘格式：已知条件 → 目标量 → 可用公式 → 代入/变形 → 检查结果单位或范围。',
        action: '完成 5-8 道基础例题，每道题都写出步骤说明。',
        check: '能独立复现同类题，并能指出每一步用了哪个概念。',
      },
      {
        title: `第 3 步：建立错题和检查点`,
        explanation: `数学学习的提升往往来自错题复盘。每次出错都要判断是概念不清、公式记错、条件漏看、计算失误，还是题型入口判断错误。复盘时不要只抄正确答案，要写下“我当时为什么错”和“下次看到什么信号要改用哪个方法”。当你能稳定识别错误类型，就说明这个阶段开始从被动做题转为主动解题。`,
        example: '错题记录：题目关键词、错误原因、正确入口、关键一步、下次提醒。',
        action: '整理至少 3 道错题，给每道题写出错误原因和修正方法。',
        check: '重新做错题时能不看答案完成，并能讲出避免同类错误的方法。',
      },
    ];
  }

  if (domain === 'python') {
    return [
      {
        title: `第 1 步：理解「${stageName}」在 Python 中解决什么问题`,
        explanation: `学习 Python 不能只复制代码。你要先弄清楚本阶段知识在真实任务中负责哪一部分：是接收输入、存储数据、控制流程、封装函数，还是读取文件和处理表格。理解用途后，再看语法会容易很多。每学一个概念，都用一句话解释“它解决了什么重复问题”，再写一个最小例子运行，观察输入、处理、输出分别是什么。`,
        example: '例如学习循环时，用 for 循环统计列表里的数字总和，再打印每次累加过程，观察变量如何变化。',
        action: '为本阶段每个核心概念写一个 10-20 行的最小可运行示例。',
        check: '能修改示例输入并预测输出，运行结果和预测一致。',
      },
      {
        title: `第 2 步：边写边调试，而不是只看教程`,
        explanation: `编程能力来自运行和调试。写代码时先保证程序能跑起来，再逐步增加功能。遇到报错时先读错误类型和行号，缩小问题范围，再用 print、断点或简化输入定位原因。不要把报错当成失败，它其实是在告诉你程序当前哪里和预期不一致。把每次错误记录下来，你会很快积累自己的排查经验。`,
        example: '如果出现 TypeError，先检查变量类型；如果出现 NameError，先检查变量名和作用域；如果结果不对，先打印中间变量。',
        action: '完成 3 个小练习，并为每个练习记录至少一个调试观察。',
        check: '能说出一个报错的原因、定位过程和修复方式。',
      },
      {
        title: `第 3 步：做出阶段小项目`,
        explanation: `当基础概念能单独运行后，要把它们串成一个小项目。项目不需要复杂，但必须有明确输入、处理过程和输出结果。比如命令行计算器、文件统计器、数据清洗脚本或简单查询工具。项目会暴露教程里看不到的问题：文件路径、异常输入、代码组织、结果检查。解决这些问题后，你对 Python 的理解会从“会写语句”提升到“能完成任务”。`,
        example: '示例项目：读取一份 CSV，统计每列缺失值，输出清洗建议，并保存一份处理后的文件。',
        action: '完成一个阶段小项目，写 5 行 README 说明用途和运行方式。',
        check: '别人按 README 能运行项目，你也能解释每个主要函数的作用。',
      },
    ];
  }

  if (domain === 'gpt') {
    return [
      {
        title: `第 1 步：明确 GPT 任务输入和输出`,
        explanation: `学习 GPT 或 AI 工具时，不要只问“帮我做这个”。高质量使用的第一步是把任务说清楚：目标是什么、已有材料是什么、限制条件是什么、希望输出成什么格式。GPT 的回答质量很大程度取决于你的输入是否具体。如果输入模糊，它只能给通用建议；如果输入包含背景、例子和评价标准，它就更容易生成可执行内容。`,
        example: '低质量提示：帮我写方案。高质量提示：我是零基础，想 2 周学会 Excel 数据透视表，请按每天任务、练习和检查点输出。',
        action: '把当前目标改写成 3 个不同详细程度的提示词。',
        check: '能判断哪一个提示词更清晰，并说明原因。',
      },
      {
        title: `第 2 步：学会追问和迭代`,
        explanation: `GPT 第一次回答通常只是草稿。你需要根据结果继续追问：哪里太笼统、哪里缺例子、哪里需要更适合你的水平。追问时不要只说“不够好”，而要指出具体修改方向，例如“每一步补充例子”“改成初中生能懂的解释”“给出代码和调试步骤”。这种迭代能力比记提示词模板更重要。`,
        example: '追问示例：把第 2 步展开成老师讲课式说明，包含概念、例子、行动建议和检查标准。',
        action: '选择一个回答，连续追问 2 次并记录质量变化。',
        check: '最终回答比初稿更具体、更可执行，并符合你的使用场景。',
      },
      {
        title: `第 3 步：检查输出可靠性`,
        explanation: `AI 工具的输出不能直接全信，尤其涉及事实、资源、代码、公式和决策建议时。你要检查它有没有编造来源、遗漏条件、逻辑跳步或给出过时信息。可以让它列出假设、给出验证方法，再结合官方文档、搜索资源或自己的测试结果确认。这样使用 GPT 才是辅助思考，而不是替代判断。`,
        example: '如果 GPT 给出代码，先本地运行；如果给出学习资源，优先打开官方文档或真实搜索结果验证。',
        action: '为一次 GPT 输出做可靠性检查，标出可信、需验证和需要修改的部分。',
        check: '能说出至少 3 个检查维度，并修正一个不够可靠的输出。',
      },
    ];
  }

  return [
    {
      title: `第 1 步：理解「${stageName}」的核心目标`,
      explanation: `学习「${safeGoal}」不能只看任务列表。你需要先明确本阶段要解决什么问题、为什么现在学它、完成后应该能做出什么。把目标说清楚后，后面的资料选择、练习安排和验收标准才不会散。建议用“我现在不会什么—这一阶段要学会什么—我用什么成果证明”来写一段目标说明。`,
      example: '例子：如果目标是学习一个工具，就写清楚要用于哪个工作场景、最终做出什么模板或成果。',
      action: '写下本阶段目标、应用场景和阶段产出。',
      check: '能用 1 分钟向别人解释本阶段为什么值得学。',
    },
    {
      title: `第 2 步：用练习把知识变成能力`,
      explanation: `看资料只是输入，练习才会暴露真正的理解程度。每学一个知识点，都要立刻安排一个小任务：操作一次、解一道题、写一段代码、做一个表格、输出一段表达或整理一个案例。练习要足够小，能在 30-60 分钟内完成，这样你可以快速获得反馈并调整学习方向。`,
      example: '练习格式：目标 → 步骤 → 结果 → 遇到的问题 → 下一次怎么改。',
      action: '完成 2-3 个小练习，并保留过程记录。',
      check: '能指出练习中的一个问题，并知道如何改进。',
    },
    {
      title: `第 3 步：复盘并形成阶段产出`,
      explanation: `阶段学习结束时，不要只打勾完成，要整理一个可展示的成果。这个成果可以是笔记、错题集、小项目、模板、演示稿或练习报告。复盘时重点回答三个问题：我已经掌握了什么，哪里还不稳定，下一阶段应该优先补什么。这样每个阶段都会留下积累，而不是学完就忘。`,
      example: '阶段产出可以是一页总结：核心概念、3 个例子、2 个常见错误、1 个下一步计划。',
      action: '整理阶段成果，并写一段 100 字复盘。',
      check: '看到成果后能判断自己是否适合进入下一阶段。',
    },
  ];
}

function enhancePlan(plan: MockPlan, goal: string, domain: 'python' | 'math' | 'gpt' | 'tool' | 'general'): MockPlan {
  return {
    ...plan,
    overview: plan.overview || plan.summary,
    audience: plan.audience || '适合希望获得分步讲解、练习路径和阶段产出的学习者。',
    prerequisites: plan.prerequisites || ['能保持稳定练习时间', '愿意记录问题和复盘过程'],
    outcome: plan.outcome || '完成后能形成阶段作品、练习记录或可复用学习笔记。',
    roadmap: Array.isArray(plan.roadmap)
      ? plan.roadmap.map((stage) => ({
          ...stage,
          why: stage.why || `这个阶段帮助你为「${goal}」建立必要基础，避免后续练习只会模仿。`,
          output: stage.output || stage.goal,
          practice: stage.practice || '每学完一个知识点，都配一个小练习和一次复盘。',
          checkpoint: stage.checkpoint || '能解释核心概念，并完成一个可检查的小成果。',
          commonMistakes: stage.commonMistakes || ['只看资料不练习', '没有记录错误原因', '跳过检查点直接进入下一阶段'],
          steps: Array.isArray(stage.steps) && stage.steps.length > 0 ? stage.steps : createFallbackSteps(goal, stage, domain),
        }))
      : [],
  };
}

export function getMockPlanByGoal(goal: string): MockPlan {
  const normalizedGoal = goal.trim().toLowerCase();

  if (/(python|数据分析|pandas|sql)/i.test(goal) || normalizedGoal.includes('python')) {
    return enhancePlan(pythonPlan, goal, 'python');
  }

  if (/(三角函数|数学|代数|几何|微积分|函数|公式|方程)/i.test(goal)) {
    return enhancePlan(genericPlan, goal, 'math');
  }

  if (/(gpt|chatgpt|提示词|大模型|人工智能|ai)/i.test(goal)) {
    return enhancePlan(mlPlan, goal, 'gpt');
  }

  if (/(react|前端|javascript|typescript)/i.test(goal)) {
    return enhancePlan(reactPlan, goal, 'python');
  }

  if (/(机器学习|machine learning|\bml\b|深度学习|\bai\b)/i.test(goal)) {
    return enhancePlan(mlPlan, goal, 'gpt');
  }

  if (/(excel|表格|数据透视表|办公)/i.test(goal)) {
    return enhancePlan(excelPlan, goal, 'tool');
  }

  return enhancePlan(genericPlan, goal, 'general');
}

export const getMockPlan = getMockPlanByGoal;
