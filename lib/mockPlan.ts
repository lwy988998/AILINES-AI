import type { PlanMode } from '@/lib/ai/types';
import { createSpecificStepContent, normalizeCoursePlanContent } from '@/lib/courseContentQuality';

export type CourseStep = {
  title: string;
  explanation: string;
  example?: string;
  action: string;
  check: string;
};

export type CourseSlide = {
  title: string;
  subtitle?: string;
  content: string;
  bullets?: string[];
  speakerNote?: string;
  relatedPhase?: string;
};

export type MindMapNode = {
  id: string;
  label: string;
  children?: MindMapNode[];
};

export type CourseMindMap = {
  title: string;
  nodes: MindMapNode[];
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
  tasks?: string[];
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
  courseIntro?: string;
  overview?: string;
  audience?: string;
  prerequisites?: string[];
  outcome?: string;
  learningOutcomes?: string[];
  slides?: CourseSlide[];
  mindMap?: CourseMindMap;
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

const aiToolPlan = createPlan({
  title: '从零开发自己的 AI 工具课程',
  duration: '10 周',
  summary: '这门课程会带你从需求定义开始，理解 AI 工具的基本组成：用户输入、Prompt 设计、模型 接口调用、结果展示、资料搜索整合和部署发布。你会逐步完成一个可用的 AI 工具原型，而不是只学习抽象的机器学习理论。',
  roadmap: [
    { name: '阶段一：明确 AI 工具的使用场景和核心功能', duration: '1 周', goal: '把想做的 AI 工具拆成清晰需求', description: '确定目标用户、输入内容、输出结果、使用频率和最小可用功能，避免一开始就做成泛泛的聊天机器人。' },
    { name: '阶段二：理解大模型接口 与 Prompt 设计', duration: '2 周', goal: '掌握模型调用和提示词迭代方法', description: '学习 API 请求、系统提示词、用户提示词、结构化输出、质量评估和安全边界。' },
    { name: '阶段三：搭建前端输入界面和交互流程', duration: '2 周', goal: '做出用户可操作的输入与结果页面', description: '设计表单、模式切换、加载状态、重新生成、错误提示和结果展示，让工具能被真实使用。' },
    { name: '阶段四：接入后端模型调用与错误处理', duration: '2 周', goal: '通过后端稳定调用模型接口', description: '实现服务端接口、环境变量配置、超时、重试、JSON 解析、异常提示和日志记录，避免把密钥暴露到前端。' },
    { name: '阶段五：增加搜索资料整合或知识库能力', duration: '2 周', goal: '让工具能结合外部资料或私有知识回答', description: '按需求接入搜索接口、文档解析、向量检索或轻量 RAG，并设计引用、去重和可信度检查。' },
    { name: '阶段六：部署、测试和持续优化', duration: '1 周', goal: '把 AI 工具发布为可维护产品', description: '完成部署、监控、缓存、用户反馈收集、成本控制和版本迭代，让原型变成稳定工具。' },
  ],
  courseStructure: [
    { stage: '阶段一：明确 AI 工具的使用场景和核心功能', topics: ['目标用户', '核心任务', '输入输出', 'MVP 范围', '验收标准'] },
    { stage: '阶段二：理解大模型接口 与 Prompt 设计', topics: ['模型选择', '接口请求结构', 'Prompt 模板', '结构化 JSON 输出', '效果评估'] },
    { stage: '阶段三：搭建前端输入界面和交互流程', topics: ['输入表单', '模式切换', '加载状态', '结果卡片', '重新生成交互'] },
    { stage: '阶段四：接入后端模型调用与错误处理', topics: ['服务端接口', '密钥隔离', '超时/重试', 'JSON 修复', '异常提示文案'] },
    { stage: '阶段五：增加搜索资料整合或知识库能力', topics: ['搜索接口', '资料筛选', '知识库/RAG', '引用展示', '可信度检查'] },
    { stage: '阶段六：部署、测试和持续优化', topics: ['部署上线', '端到端测试', '日志监控', '成本控制', '用户反馈'] },
  ],
  resources: [
    { name: 'OpenAI 开发文档', type: '官方文档', difficulty: '入门', free: true, description: '理解 Chat Completions、结构化输出和模型调用方式。', href: 'https://platform.openai.com/docs' },
    { name: 'Vercel AI SDK 文档', type: '官方文档', difficulty: '中级', free: true, description: '学习在前后端应用中接入模型、流式输出和工具调用。', href: 'https://sdk.vercel.ai/docs' },
    { name: 'Next.js 官方文档', type: '官方文档', difficulty: '入门', free: true, description: '搭建前端页面、服务端接口和部署 AI 工具的基础资料。', href: 'https://nextjs.org/docs' },
    { name: 'LangChain RAG 教程', type: '官方文档', difficulty: '中级', free: true, description: '需要知识库能力时，可参考检索增强生成的基本流程。', href: 'https://js.langchain.com/docs/tutorials/rag/' },
  ],
  projects: [
    { name: 'Prompt 生成助手', difficulty: '入门', duration: '3 天', output: '一个输入目标并生成结构化 Prompt 的小工具。', acceptance: '包含输入表单、模型调用、结果展示和重新生成按钮。' },
    { name: '资料总结 AI 工具', difficulty: '中级', duration: '1 周', output: '一个能整合搜索结果并输出学习摘要的工具。', acceptance: '能展示资料来源、摘要、关键步骤和异常提示。' },
    { name: '个人知识库问答原型', difficulty: '进阶', duration: '2 周', output: '一个支持上传资料或检索资料的 RAG 原型。', acceptance: '包含文档处理、检索、模型回答、引用展示和测试记录。' },
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


function createSlug(value: string, fallback: string) {
  const ascii = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (ascii) return ascii.slice(0, 48);
  return fallback;
}

function buildSlidesFromPlan(plan: MockPlan, goal: string): CourseSlide[] {
  const safeGoal = goal.trim() || plan.title || '课程';
  const roadmap = Array.isArray(plan.roadmap) ? plan.roadmap : [];
  const slides: CourseSlide[] = [
    {
      title: '目标学习路径',
      subtitle: `为什么要学 ${safeGoal}`,
      content: plan.courseIntro || plan.overview || plan.summary || `这门课程会把「${safeGoal}」拆成可学习、可练习、可检查的阶段。`,
      bullets: [`确认「${safeGoal}」要解决的问题`, '拆成可学习的阶段和任务', '用练习结果和检查点判断是否达标'],
      speakerNote: `AILINES AI 会先帮你建立整体认知，再带你逐阶段学习。不要只看路线，要跟着每一阶段的行动建议做出成果。`,
    },
  ];

  roadmap.forEach((stage, index) => {
    slides.push({
      title: stage.name || `阶段 ${index + 1}`,
      subtitle: stage.goal || stage.output || `第 ${index + 1} 阶段`,
      content: stage.description || stage.why || `围绕「${stage.name || `阶段 ${index + 1}`}」完成具体学习点和可检查练习。`,
      bullets: [stage.duration, stage.output || stage.goal, stage.checkpoint || '完成阶段检查点'].filter(Boolean),
      speakerNote: stage.why || `这一阶段的重点是把「${safeGoal}」中的关键能力落到具体练习和产出。`,
      relatedPhase: stage.name,
    });

    const steps = Array.isArray(stage.steps) ? stage.steps : [];
    steps.slice(0, 2).forEach((step, stepIndex) => {
      slides.push({
        title: step.title || `第 ${stepIndex + 1} 步`,
        subtitle: stage.name,
        content: step.explanation || stage.description || `围绕「${step.title || stage.name || safeGoal}」完成具体学习动作。`,
        bullets: [step.example ? `例子：${step.example}` : '', `行动：${step.action || `完成「${step.title || stage.name || safeGoal}」对应练习`}`, `检查：${step.check || '能拿出练习结果并说明关键步骤'}`].filter(Boolean),
        speakerNote: `讲解这一页时，先说明具体场景和用途，再让用户完成行动建议，最后按检查标准判断是否达标。`,
        relatedPhase: stage.name,
      });
    });
  });

  return slides.slice(0, 12);
}

function buildMindMapFromPlan(plan: MockPlan, goal: string): CourseMindMap {
  const roadmap = Array.isArray(plan.roadmap) ? plan.roadmap : [];
  return {
    title: '课程知识结构',
    nodes: [
      {
        id: 'root',
        label: goal.trim() || plan.title || 'AILINES AI 课程',
        children: roadmap.slice(0, 6).map((stage, index) => ({
          id: createSlug(stage.name || '', `phase-${index + 1}`),
          label: stage.name || `阶段 ${index + 1}`,
          children: (Array.isArray(stage.steps) && stage.steps.length > 0
            ? stage.steps.map((step) => step.title.replace(/^第\s*\d+\s*步[:：]?\s*/, ''))
            : [stage.goal, stage.output, stage.checkpoint]
          )
            .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
            .slice(0, 5)
            .map((label, childIndex) => ({ id: `${createSlug(stage.name || '', `phase-${index + 1}`)}-${childIndex + 1}`, label })),
        })),
      },
    ],
  };
}

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
        title: `第 1 步：把「${stageName}」拆成输入、处理和输出`,
        explanation: `开发自己的 AI 工具时，不要一开始就追求复杂功能。先把本阶段要解决的问题拆成三个部分：用户会输入什么，后端要怎样组织 Prompt 和上下文，最终要展示什么结果。这个拆解能帮助你判断需要表单、文件上传、搜索资料、知识库还是普通模型调用，也能避免把所有需求都塞进一个聊天框。`,
        example: '如果做学习规划工具，输入可以是目标和模式，处理过程是 Prompt + 模型接口 + JSON 解析，输出是阶段路线、课件和资源。',
        action: '写出本阶段功能的输入字段、处理流程、输出格式和异常提示。',
        check: '能用一张流程图说明用户操作到 AI 返回结果的完整链路。',
      },
      {
        title: `第 2 步：设计 Prompt、接口调用和结果格式`,
        explanation: `AI 工具的稳定性很大程度取决于 Prompt 和接口约束。你需要明确系统角色、用户任务、输出字段、长度要求和禁止事项，并让模型尽量返回结构化结果。后端调用时要把访问密钥放在服务端，设置超时、重试和错误分类；前端只接收已经整理好的结果，不直接接触密钥或服务细节。`,
        example: '例如要求模型返回 JSON：title、summary、steps、resources，并在服务端做结果校验，异常时给出可继续学习的课程结构。',
        action: '为本阶段写一个 Prompt 模板，并设计一个服务端 API 返回结构。',
        check: '能说明哪些参数会影响输出质量，以及异常时如何给出清晰提示。',
      },
      {
        title: `第 3 步：做出可测试的最小原型`,
        explanation: `AI 工具必须能被实际点击和测试。完成本阶段后，你应该有一个最小原型：前端可以输入目标，后端能调用模型，页面能展示结果，并在超时、限流或 JSON 异常时给出清晰提示。原型阶段先保证链路稳定，再逐步加入搜索、RAG、图片上传或复杂工作流。`,
        example: '最小原型可以是一个“AI 学习计划生成器”：输入目标，点击生成，展示课程标题、阶段、资源和重新生成按钮。',
        action: '实现一个从页面输入到后端模型调用再到结果展示的闭环。',
        check: '至少测试成功、超时提示、空输入和重新生成 4 种情况。',
      },
    ];
  }

  return [
    {
      title: `第 1 步：拆清「${stageName}」的具体场景`,
      explanation: `学习「${safeGoal}」不能只看任务列表。你需要先明确本阶段要解决什么问题、为什么现在学它、完成后应该能做出什么。把目标说清楚后，后面的资料选择、练习安排和验收标准才不会散。建议用“我现在不会什么—这一阶段要学会什么—我用什么成果证明”来写一段目标说明。`,
      example: '例子：如果目标是学习一个工具，就写清楚要用于哪个工作场景、最终做出什么模板或成果。',
      action: '写下本阶段目标、应用场景和阶段产出。',
      check: '能用 1 分钟向别人解释本阶段为什么值得学。',
    },
    {
      title: `第 2 步：完成「${stageName}」专项练习`,
      explanation: `看资料只是输入，练习才会暴露真正的理解程度。每学一个知识点，都要立刻安排一个小任务：操作一次、解一道题、写一段代码、做一个表格、输出一段表达或整理一个案例。练习要足够小，能在 30-60 分钟内完成，这样你可以快速获得反馈并调整学习方向。`,
      example: '练习格式：目标 → 步骤 → 结果 → 遇到的问题 → 下一次怎么改。',
      action: '完成 2-3 个小练习，并保留过程记录。',
      check: '能指出练习中的一个问题，并知道如何改进。',
    },
    {
      title: `第 3 步：整理「${stageName}」可检查成果`,
      explanation: `阶段学习结束时，不要只打勾完成，要整理一个可展示的成果。这个成果可以是笔记、错题集、小项目、模板、演示稿或练习报告。复盘时重点回答三个问题：我已经掌握了什么，哪里还不稳定，下一阶段应该优先补什么。这样每个阶段都会留下积累，而不是学完就忘。`,
      example: '阶段产出可以是一页总结：核心概念、3 个例子、2 个常见错误、1 个下一步计划。',
      action: '整理阶段成果，并写一段 100 字复盘。',
      check: '看到成果后能判断自己是否适合进入下一阶段。',
    },
  ];
}


function cleanGoalTitle(goal: string) {
  return goal.trim().replace(/[。！？!?\s]+$/g, '') || '你的目标';
}

function isPracticalSkillGoal(goal: string) {
  return /(如何|怎么|怎样|学会|练习|使用|安装|修|换|做|打结|绑|捆绑|剪视频|做饭|鱼钩|工具)/i.test(goal);
}

function createPracticalSkillPlan(goal: string, mode: PlanMode): MockPlan {
  const safeGoal = cleanGoalTitle(goal);
  const isFishingHook = /鱼钩|绑钩|捆绑鱼钩|鱼线/i.test(safeGoal);
  const isPcBuild = /配电脑|装机|电脑配置|攒机|组装电脑|选电脑|台式机配置/i.test(safeGoal);
  const materialItems = isFishingHook
    ? ['鱼钩', '鱼线', '剪刀或线剪', '一小杯水用于润湿线结', '明亮桌面，方便观察线圈']
    : isPcBuild
      ? ['用途和预算清单', 'CPU/GPU/内存/硬盘/电源候选型号', '主板接口和机箱尺寸信息', '价格记录表']
      : ['完成操作所需工具或材料', '可反复练习的小样本', '记录问题的纸笔或手机备忘录'];
  const mistakes = isFishingHook
    ? ['绕线太少，线结受力后容易松', '没有拉紧主线和线头，结没有真正锁住', '拉紧前没有润湿，摩擦发热会伤线', '线头留太短，受力后容易滑脱', '绑完没有做拉力测试']
    : isPcBuild
      ? ['不先明确用途和预算就选型号', 'CPU 和主板接口不兼容', '忽略显卡长度、电源功率或机箱散热', '只看单个跑分不看整机取舍', '没有准备可替代型号']
      : ['只看示范不亲手练', '跳过准备和安全检查', '一次失败后没有记录原因', '没有用明确标准判断是否合格', '急着学复杂技巧，基础动作还不稳定'];
  const stepNames = isFishingHook
    ? ['准备鱼钩、鱼线和剪刀', '理解线结固定的核心原理', '学习一种基础绑钩方法', '反复练习拉紧和修剪', '检查牢固度和常见错误']
    : isPcBuild
      ? ['明确用途、预算和性能目标', '选择 CPU/GPU/内存/硬盘/电源', '按不同预算练习配置清单', '检查兼容性并修正配置', '输出最终购买或装机方案']
      : ['准备材料和练习环境', '理解关键动作和安全边界', '跟着示例完成第一次操作', '按不同场景重复练习', '按验收标准检查并修正'];

  const roadmap = stepNames.map((name, index) => ({
    name: `第 ${index + 1} 步：${name}`,
    duration: index === 0 ? '10-20 分钟' : '20-40 分钟',
    goal: index === 0 ? `准备好练习「${safeGoal}」所需条件` : `完成${name}`,
    description: isFishingHook
      ? [
          '先把鱼钩、鱼线和剪刀放在明亮桌面，剪一段方便练习的鱼线。初学不要直接在复杂钓组上操作，先用单钩反复练手，保证能看清线头、主线和钩柄位置。',
          '绑钩的本质是让鱼线绕住钩柄并通过线结自锁。你要观察线圈方向、主线受力方向和线头位置，理解为什么拉紧后线圈会抱住钩柄，而不是只记一个动作顺序。',
          '先固定一种基础绑法：让线沿钩柄放置，线头绕钩柄和主线多圈，再从预留线圈穿回。整个过程慢一点，重点保持线圈整齐，不要交叉压线。',
          '每次绑完先轻轻收紧，再润湿线结，最后同时拉主线和线头让线圈锁紧。修剪线头时不要贴着线结剪，保留少量余量，避免受力滑脱。',
          '用手稳定拉主线做小幅拉力测试，观察线结是否滑动、线圈是否散开、钩柄是否偏斜。如果不牢，拆掉重绑，不要带着隐患继续使用。',
        ][index]
      : createSpecificStepContent({ goal: safeGoal, phaseName: '快速上手', title: name, index }).explanation,
    why: index === 0 ? '准备充分可以减少第一次练习的挫败感。' : '快速规划强调马上行动，每一步都要能被检查。',
    output: index === 4 ? '一份可复现的操作流程和错误清单' : name,
    practice: isFishingHook ? (index === 3 ? '连续绑 5 次，每次记录是否松动、线圈是否整齐。' : `完成“${name}”并拍照或目视检查结果。`) : `完成 2-3 次“${name}”练习。`,
    checkpoint: isFishingHook ? (index === 4 ? '线结受力不滑动，线头长度合适，线圈整齐贴住钩柄。' : '能说出这一步的作用，并独立复现。') : '能不看提示复现，并指出一个可改进点。',
    commonMistakes: mistakes.slice(0, 3),
    steps: [{
      title: name,
      ...(isFishingHook
        ? {
            explanation: `针对「${safeGoal}」，这一步要做到可观察、可重复、可检查。初学时动作慢一点比速度更重要：先确认线和钩的位置，再完成绕线、穿线、润湿、拉紧和修剪。每次练习后都要做拉力测试，线结不稳就拆掉重来。`,
            example: '例如先用粗一点的鱼线练习，更容易看清绕线方向；熟练后再换实际使用的线径。',
            action: `完成“${name}”，并至少重复 3 次。`,
            check: '线结不散、不滑，自己能解释线头和主线分别往哪里走。',
          }
        : createSpecificStepContent({ goal: safeGoal, phaseName: '快速上手', title: name, index })),
    }],
  }));

  return normalizeCoursePlanContent(applyModeToFallbackPlan({
    title: `${safeGoal}快速学习方案`,
    duration: mode === 'lite' ? '1-3 天' : '2 周',
    summary: isFishingHook
      ? '这是一份轻量实践方案，帮助你先掌握鱼线与鱼钩连接的基本方法，重点是线结牢固、步骤正确、练习可重复。'
      : `这是一份围绕「${safeGoal}」的轻量实践方案，重点告诉你先准备什么、按什么步骤做、如何练习和检查。`,
    courseIntro: `先用最短路径完成「${safeGoal}」的基础操作，再根据练习中的问题决定是否深入学习。`,
    overview: `按准备、理解、操作、练习、自检推进「${safeGoal}」。`,
    audience: '想快速上手一个具体操作技能的学习者。',
    prerequisites: materialItems,
    outcome: `能独立完成「${safeGoal}」的基础流程，并知道如何检查和修正错误。`,
    learningOutcomes: ['知道需要准备什么', '能按步骤完成一次操作', '能识别常见错误', '能做基础自检'],
    roadmap,
    courseStructure: [{ stage: '快速上手', topics: stepNames }],
    resources: [
      { name: `${safeGoal} 图文教程`, type: '图文教程', difficulty: '入门', free: true, description: '优先找带步骤图的资料，对照动作练习。', href: `https://www.bing.com/search?q=${encodeURIComponent(safeGoal + ' 图文教程')}` },
      { name: `${safeGoal} 视频示范`, type: '视频教程', difficulty: '入门', free: true, description: '看手部动作和拉紧过程，注意暂停模仿。', href: `https://www.bing.com/search?q=${encodeURIComponent(safeGoal + ' 视频 教程')}` },
      { name: `${safeGoal} 常见错误`, type: '文章', difficulty: '入门', free: true, description: '练习后对照错误清单排查。', href: `https://www.bing.com/search?q=${encodeURIComponent(safeGoal + ' 常见错误')}` },
    ],
    projects: [
      { name: '完成 5 次连续练习', difficulty: '入门', duration: '30-60 分钟', output: '5 次练习记录和 1 份错误清单。', acceptance: '至少 4 次能通过自检标准。' },
      { name: '复述并示范完整流程', difficulty: '入门', duration: '15 分钟', output: '一次完整演示。', acceptance: '能边做边说出关键注意点。' },
    ],
  }, mode), safeGoal);
}

function applyModeToFallbackPlan(plan: MockPlan, mode: PlanMode): MockPlan {
  if (mode === 'deep') {
    return plan;
  }

  return {
    ...plan,
    duration: /天/.test(plan.duration) ? plan.duration : plan.duration.replace(/\d+/, (value) => String(Math.max(1, Math.min(3, Number(value) || 2)))),
    summary: `${plan.summary} 当前为快速规划 / 轻量学习课程版本，优先保留最关键步骤、练习和少量资料。`,
    roadmap: plan.roadmap.slice(0, 5).map((stage) => ({
      ...stage,
      steps: Array.isArray(stage.steps) ? stage.steps.slice(0, 2) : stage.steps,
      commonMistakes: Array.isArray(stage.commonMistakes) ? stage.commonMistakes.slice(0, 2) : stage.commonMistakes,
    })),
    courseStructure: plan.courseStructure.slice(0, 5).map((stage) => ({
      ...stage,
      topics: stage.topics.slice(0, 5),
    })),
    resources: plan.resources.slice(0, 5),
    projects: plan.projects.slice(0, 2),
    slides: Array.isArray(plan.slides) ? plan.slides.slice(0, 6) : plan.slides,
    mindMap: plan.mindMap,
  };
}

function enhancePlan(plan: MockPlan, goal: string, domain: 'python' | 'math' | 'gpt' | 'tool' | 'general', mode: PlanMode): MockPlan {
  const enhanced: MockPlan = {
    ...plan,
    courseIntro: plan.courseIntro || plan.overview || plan.summary,
    overview: plan.overview || plan.summary,
    audience: plan.audience || '适合希望获得分步讲解、练习路径和阶段产出的学习者。',
    prerequisites: plan.prerequisites || ['能保持稳定练习时间', '愿意记录问题和复盘过程'],
    outcome: plan.outcome || '完成后能形成阶段作品、练习记录或可复用学习笔记。',
    learningOutcomes: plan.learningOutcomes || ['理解核心概念', '完成阶段练习', '产出可复盘的学习成果'],
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

  return normalizeCoursePlanContent(applyModeToFallbackPlan({
    ...enhanced,
    slides: Array.isArray(enhanced.slides) && enhanced.slides.length > 0 ? enhanced.slides : buildSlidesFromPlan(enhanced, goal),
    mindMap: enhanced.mindMap || buildMindMapFromPlan(enhanced, goal),
  }, mode), goal);
}

export function getMockPlanByGoal(goal: string, mode: PlanMode = 'deep'): MockPlan {
  const normalizedGoal = goal.trim().toLowerCase();
  const aiToolKeywords = /(ai\s*工具|ailines\s*ai\s*工具|gpt|chatgpt|llm|大模型|智能体|agent|prompt|提示词|\bapi\b|rag|工作流|自动化|应用开发|ai\s*应用|人工智能应用|开发.*ai|ai.*开发)/i;
  const machineLearningKeywords = /(机器学习|machine learning|\bml\b|深度学习|模型训练|算法|分类|回归|sklearn|scikit-learn)/i;

  if (aiToolKeywords.test(goal) || aiToolKeywords.test(normalizedGoal)) {
    return enhancePlan(aiToolPlan, goal, 'gpt', mode);
  }

  if (machineLearningKeywords.test(goal) || machineLearningKeywords.test(normalizedGoal)) {
    return enhancePlan(mlPlan, goal, 'gpt', mode);
  }

  if (/(python|数据分析|pandas|sql)/i.test(goal) || normalizedGoal.includes('python')) {
    return enhancePlan(pythonPlan, goal, 'python', mode);
  }

  if (/(react|前端|javascript|typescript)/i.test(goal)) {
    return enhancePlan(reactPlan, goal, 'python', mode);
  }

  if (/(三角函数|数学|代数|几何|微积分|函数|公式|方程)/i.test(goal)) {
    return enhancePlan(genericPlan, goal, 'math', mode);
  }

  if (/(excel|表格|数据透视表|办公)/i.test(goal)) {
    return enhancePlan(excelPlan, goal, 'tool', mode);
  }

  if (isPracticalSkillGoal(goal)) {
    return createPracticalSkillPlan(goal, mode);
  }

  return enhancePlan({ ...genericPlan, title: `${cleanGoalTitle(goal)}学习方案`, summary: `围绕「${cleanGoalTitle(goal)}」建立基础认知、核心步骤、练习路径和可检查成果。` }, goal, 'general', mode);
}

export const getMockPlan = getMockPlanByGoal;
