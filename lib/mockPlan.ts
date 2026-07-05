export type RoadmapStage = {
  name: string;
  duration: string;
  goal: string;
  description: string;
};

export type CourseStage = {
  stage: string;
  topics: string[];
};

export type ResourceItem = {
  name: string;
  type: 'GitHub' | '官方文档' | '视频' | '文章';
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

export function getMockPlanByGoal(goal: string): MockPlan {
  const normalizedGoal = goal.trim().toLowerCase();

  if (/(python|数据分析|pandas|sql)/i.test(goal) || normalizedGoal.includes('python')) {
    return pythonPlan;
  }

  if (/(react|前端|javascript|typescript)/i.test(goal)) {
    return reactPlan;
  }

  if (/(机器学习|machine learning|\bml\b|深度学习|\bai\b)/i.test(goal)) {
    return mlPlan;
  }

  if (/(excel|表格|数据透视表|办公)/i.test(goal)) {
    return excelPlan;
  }

  return genericPlan;
}

export const getMockPlan = getMockPlanByGoal;
