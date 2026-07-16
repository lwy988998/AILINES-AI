import type { CourseSlide, CourseStage, CourseStep, MockPlan, RoadmapStage } from '@/lib/mockPlan';

export type CourseDomain = 'guitar' | 'nextjs' | 'aiDrawing' | 'pcBuild' | 'examEnglish' | 'photography' | 'math' | 'programming' | 'general';

type DomainModule = {
  name: string;
  topics: string[];
  goal: string;
  description: string;
  output: string;
  checkpoint: string;
};

const forbiddenCoursePatterns = [
  /它是理解【?[^】]*】?的关键抓手/,
  /学习时请同时记住含义、使用场景和一个自己的例子/,
  /提示[:：]?不要只背名词/,
  /不要只背名词/,
  /至少完成一次解释和练习/,
  /理解[「“]?.*[」”]?的?核心目标/,
  /理解阶段目标/,
  /用练习把知识变成能力/,
  /复盘并形成阶段产出/,
  /掌握基本概念/,
  /提升综合能力/,
  /建立学习节奏/,
  /完成一次输出/,
  /深度整合暂时未完成/,
  /基础课程/,
  /fallback|mock|demo|debug|第一版/i,
];

const genericExactTexts = [
  '学习目标定义',
  '能力地图',
  '工具准备',
  '时间安排',
  '验收标准',
  '基础概念',
  '常用工具',
  '典型流程',
  '小任务练习',
  '问题定位',
  '资料查询',
  '结果优化',
  '复盘记录',
  '项目选题',
  '成果整理',
  '展示说明',
  '反馈收集',
  '下一步计划',
  '课程导入',
  '阶段目标',
];

function normalizeForCompare(value: string) {
  return value.replace(/[\s，。；：、,.!?！？;:「」“”'"（）()【】\[\]-]/g, '').toLowerCase();
}

function cleanGoal(goal: string) {
  return goal.trim().replace(/[。！？!?.\s]+$/g, '') || '当前目标';
}

function isNonEmptyText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function detectCourseDomain(goal: string): CourseDomain {
  const text = goal.trim();
  if (/吉他|尤克里里|弹唱|和弦|拨弦|扫弦|乐器/i.test(text)) return 'guitar';
  if (/next\.js|nextjs|全栈|app router|server actions|vercel/i.test(text)) return 'nextjs';
  if (/AI\s*绘画|AI绘画|文生图|图生图|Midjourney|Stable Diffusion|绘画|提示词/i.test(text)) return 'aiDrawing';
  if (/配电脑|装机|电脑配置|攒机|组装电脑|选电脑|台式机配置/i.test(text)) return 'pcBuild';
  if (/中考.*英语|英语.*中考|阅读理解|英语阅读/i.test(text)) return 'examEnglish';
  if (/摄影|拍照|相机|人像|风景|后期|光圈|快门|ISO/i.test(text)) return 'photography';
  if (/数学|三角函数|代数|几何|微积分|概率|统计|函数|公式|方程|题型/i.test(text)) return 'math';
  if (/python|javascript|typescript|react|vue|node|前端|后端|编程|代码|数据库|sql/i.test(text)) return 'programming';
  return 'general';
}

export function isGenericCourseText(text: string): boolean {
  const value = text.trim();
  if (!value) return true;
  if (forbiddenCoursePatterns.some((pattern) => pattern.test(value))) return true;
  const normalized = normalizeForCompare(value);
  if (genericExactTexts.some((item) => normalizeForCompare(item) === normalized)) return true;
  if (value.length <= 6 && !/[A-Za-z0-9]|吉他|和弦|节奏|拨弦|Next|数据库|认证|提示词|构图|CPU|GPU|词汇|长难句|光圈|快门|公式|题型/.test(value)) return true;
  return false;
}

export function dedupeCourseItems<T extends string>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalizeForCompare(item || '');
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function modulesForGoal(goal: string): DomainModule[] {
  switch (detectCourseDomain(goal)) {
    case 'guitar':
      return [
        { name: '第一部分：认识吉他', topics: ['吉他结构', '琴弦编号', '调音器使用', '坐姿与站姿'], goal: '认识吉他的组成和基础准备', description: '了解琴头、品格、琴弦、音孔和调音方式，先把乐器拿对、调准。', output: '一张吉他结构与调音检查表。', checkpoint: '能说出 6 根弦名称，并用调音器完成标准调音。' },
        { name: '第二部分：基本持琴和拨弦', topics: ['持琴姿势', '右手拨弦', '左手按弦', '手指放松'], goal: '建立稳定的双手动作', description: '练习身体、手腕和手指位置，避免一开始形成紧张或压弦不准的习惯。', output: '一段空弦拨弦练习记录。', checkpoint: '能保持姿势稳定，用节拍器拨 6 根空弦。' },
        { name: '第三部分：节奏训练', topics: ['四分音符', '八分音符', '节拍器', '分拍练习'], goal: '建立基础节奏感', description: '用节拍器练习稳定拍点，把手部动作和节奏计数连接起来。', output: '60 BPM 节奏练习记录。', checkpoint: '能在 60 BPM 下稳定完成 4 小节拨弦。' },
        { name: '第四部分：基础和弦', topics: ['C 和弦', 'G 和弦', 'Am 和弦', 'F 简化和弦'], goal: '掌握常用开放和弦', description: '逐个练习按弦位置、发声清晰度和手指转换准备。', output: '基础和弦按法图和发声检查。', checkpoint: 'C/G/Am/F 每个和弦至少 5 次清晰发声。' },
        { name: '第五部分：和弦转换', topics: ['C-G 转换', 'G-Am 转换', 'Am-F 转换', '慢速循环'], goal: '提升和弦切换稳定性', description: '从慢速开始练常见和弦连接，记录卡顿手指和转换路径。', output: '一份和弦转换速度记录。', checkpoint: '能用 60 BPM 完成 C-G-Am-F 循环 2 分钟。' },
        { name: '第六部分：弹唱练习', topics: ['扫弦节奏', '歌词进拍', '分句练习', '伴奏稳定'], goal: '把和弦、节奏和歌唱合在一起', description: '先分开练扫弦和歌词，再合并到简单弹唱片段。', output: '一段 30 秒弹唱录音。', checkpoint: '能边扫弦边唱一段副歌，节奏基本不断。' },
        { name: '第七部分：完整曲目练习', topics: ['选曲', '分段练习', '完整串联', '录音复盘'], goal: '完成一首入门曲目', description: '选择 3-4 个和弦的歌曲，按前奏、主歌、副歌分段练到完整演奏。', output: '一首完整曲目演奏记录。', checkpoint: '能完整弹唱一首歌，并指出 2 个下一步改进点。' },
      ];
    case 'nextjs':
      return [
        { name: '第一部分：项目初始化与 App Router', topics: ['create-next-app', 'App Router', '页面路由', '布局组件', 'TypeScript 配置'], goal: '搭建可运行的 Next.js 项目骨架', description: '完成项目初始化，理解 app 目录、layout、page 和基础路由组织。', output: '一个可启动的 Next.js 项目仓库。', checkpoint: '首页、详情页和全局布局能正常访问。' },
        { name: '第二部分：组件拆分与页面搭建', topics: ['组件拆分', 'Tailwind 样式', '表单输入', '加载状态', '错误提示'], goal: '搭出可交互页面', description: '把页面拆成 Header、Form、Card、List 等组件，形成清晰 UI 结构。', output: '一套可复用页面组件。', checkpoint: '能独立新增一个页面并复用组件。' },
        { name: '第三部分：API 与 Server Actions', topics: ['Route Handler', 'Server Actions', '请求校验', '错误处理', '响应结构'], goal: '实现前后端数据交互', description: '建立服务端接口，处理表单提交、数据读取和异常返回。', output: '2-3 个可测试服务端接口。', checkpoint: '能用页面操作触发接口并看到结果。' },
        { name: '第四部分：数据库建模与 Prisma', topics: ['数据模型', 'Prisma Client', '迁移', '查询关系', '种子数据'], goal: '建立业务数据层', description: '设计用户、项目或课程等核心表，并完成增删改查。', output: '一套 Prisma schema 和 CRUD 代码。', checkpoint: '能创建、读取并更新一条核心业务数据。' },
        { name: '第五部分：登录认证与权限', topics: ['注册登录', 'Session', '权限校验', '受保护页面', '用户数据隔离'], goal: '保护用户数据和关键操作', description: '实现登录状态、服务端权限检查和页面访问控制。', output: '登录后可访问的个人功能。', checkpoint: '未登录用户无法访问受保护数据。' },
        { name: '第六部分：部署上线与运维', topics: ['环境变量', '生产构建', 'Vercel/服务器部署', '日志监控', '错误排查'], goal: '把项目发布为可访问服务', description: '完成 build、环境变量配置、部署和线上验证。', output: '一个线上可访问的 Next.js 全栈项目。', checkpoint: '生产地址可打开，核心流程能跑通。' },
      ];
    case 'aiDrawing':
      return [
        { name: '第一部分：AI 绘画工具和流程', topics: ['文生图', '图生图', '模型选择', '生成流程'], goal: '理解 AI 绘画的基础流程', description: '认识常见工具、模型类型和从描述到图片的生成链路。', output: '一份工具和流程对照表。', checkpoint: '能说清文生图和图生图的区别。' },
        { name: '第二部分：提示词结构', topics: ['主体描述', '风格关键词', '画面细节', '负面提示词'], goal: '写出稳定可复用的提示词', description: '把主体、风格、构图、光影和限制条件写成清晰提示词。', output: '10 条提示词样例。', checkpoint: '能根据同一主题生成 3 个风格版本。' },
        { name: '第三部分：构图、光影和参数', topics: ['构图', '镜头语言', '光影', '色彩', '参数'], goal: '提升画面控制力', description: '练习用构图、光线和参数控制画面质量与稳定性。', output: '一组参数对比图。', checkpoint: '能解释参数变化对结果的影响。' },
        { name: '第四部分：作品复盘和作品集', topics: ['多版本对比', '缺陷标注', '提示词迭代', '作品复盘', '作品集整理'], goal: '形成持续改进的创作流程', description: '对每次生成结果做质量评估，整理个人提示词模板和作品集。', output: '一份 AI 绘画作品集。', checkpoint: '能对作品指出优点、问题和下一轮提示词修改。' },
      ];
    case 'pcBuild':
      return [
        { name: '第一部分：使用场景和预算', topics: ['使用场景', '预算上限', '分辨率', '软件需求', '升级空间'], goal: '明确配电脑需求边界', description: '先确定电脑用于游戏、剪辑、办公、AI 还是开发，再决定预算投入。', output: '一份需求和预算清单。', checkpoint: '能说明预算优先投向 CPU、GPU、内存还是硬盘。' },
        { name: '第二部分：核心硬件选择', topics: ['CPU', 'GPU', '主板', '内存', '硬盘', '电源'], goal: '选择匹配用途的硬件', description: '逐项理解性能指标、价格区间和适合场景。', output: '两套不同预算配置表。', checkpoint: '配置能对应用途且没有明显性能瓶颈。' },
        { name: '第三部分：兼容性和散热检查', topics: ['接口兼容性', '显卡长度', '电源功率', '散热器', '机箱风道'], goal: '避免买错和装不上', description: '检查 CPU 主板接口、内存规格、显卡尺寸、电源接口和散热空间。', output: '一份兼容性检查表。', checkpoint: '每个核心配件都能说出兼容依据。' },
        { name: '第四部分：配置清单和购买决策', topics: ['配置清单', '价格对比', '可替代型号', '购买渠道', '装机顺序'], goal: '输出可购买配置方案', description: '整理最终清单、替代方案、预算汇总和升级建议。', output: '一份最终购买或装机清单。', checkpoint: '别人拿到清单后知道买什么和为什么买。' },
      ];
    case 'examEnglish':
      return [
        { name: '第一部分：阅读问题诊断', topics: ['词汇障碍', '长难句', '题型错因', '限时基线'], goal: '找出阅读丢分原因', description: '用真题统计词汇、长难句、定位、主旨和推断题错误。', output: '一份阅读错因诊断表。', checkpoint: '能说出最影响分数的 1-2 类问题。' },
        { name: '第二部分：题型方法训练', topics: ['主旨题', '细节题', '推断题', '猜词题', '定位技巧'], goal: '掌握中考阅读常见题型方法', description: '按题型学习定位原文、排除干扰项和找依据句。', output: '一份题型方法卡片。', checkpoint: '能给每道题标出原文依据。' },
        { name: '第三部分：限时阅读练习', topics: ['限时训练', '高频词汇', '长难句翻译', '选项排除'], goal: '提高速度和准确率', description: '用真题限时训练，同时记录定位时间和错误原因。', output: '5 篇限时阅读记录。', checkpoint: '正确率和完成时间都有可见提升。' },
        { name: '第四部分：错题复盘和考前策略', topics: ['错题复盘', '高频词回顾', '阅读顺序', '考场策略'], goal: '稳定阅读得分', description: '把错题归因到词汇、长句、定位、推断或主旨判断，并形成考前流程。', output: '一份错题复盘表和考前策略。', checkpoint: '重做错题能说出正确依据和排除理由。' },
      ];
    case 'photography':
      return [
        { name: '第一部分：相机曝光基础', topics: ['光圈', '快门', 'ISO', '曝光补偿'], goal: '理解曝光三要素', description: '掌握光圈、快门、ISO 对亮度、景深和运动的影响。', output: '一组曝光参数对比照片。', checkpoint: '能根据场景选择基本曝光设置。' },
        { name: '第二部分：构图和光线', topics: ['三分法', '引导线', '自然光', '逆光', '色彩'], goal: '提升画面表达', description: '练习构图、光线方向和色彩关系，让照片有明确主体。', output: '10 张构图练习照片。', checkpoint: '能说明每张照片的主体和构图选择。' },
        { name: '第三部分：人像与风景场景', topics: ['人像', '风景', '街拍', '焦段选择'], goal: '把参数用于真实拍摄', description: '在不同场景练习焦段、景深、快门和光线控制。', output: '一组主题拍摄作品。', checkpoint: '能针对人像或风景选择合适设置。' },
        { name: '第四部分：后期和作品点评', topics: ['选片', '裁剪', '色彩调整', '作品点评'], goal: '完成作品整理和改进', description: '学习基础后期和自我点评，把拍摄问题转成下一次练习目标。', output: '一组修图前后对比作品。', checkpoint: '能指出 3 个画面问题和修改方案。' },
      ];
    case 'math':
      return [
        { name: '第一部分：概念定义和公式来源', topics: ['概念定义', '公式推导', '适用条件', '反例辨析'], goal: '先把数学概念讲清楚', description: '理解定义、公式来源和适用条件，避免只背结论。', output: '一页概念与公式卡片。', checkpoint: '能用例子解释公式为什么成立。' },
        { name: '第二部分：典型题型和解题步骤', topics: ['典型题型', '解题入口', '步骤书写', '条件转换'], goal: '建立稳定解题路径', description: '按题型拆解已知条件、目标量和可用方法。', output: '一份题型分类表。', checkpoint: '看到题目能判断第一步从哪里入手。' },
        { name: '第三部分：变式训练和易错点', topics: ['变式训练', '易错点', '错题复盘', '限时练习'], goal: '提升准确率和稳定性', description: '通过变式题和错题归因，减少重复错误。', output: '一份错题归因表。', checkpoint: '重做错题能写出正确步骤和错误原因。' },
      ];
    default:
      return [];
  }
}

function stepForModule(goal: string, module: DomainModule, topic: string, index: number): CourseStep {
  const domain = detectCourseDomain(goal);
  const prefix = `第 ${index + 1} 步：${topic}`;
  if (domain === 'guitar') return {
    title: prefix,
    explanation: `练「${topic}」时，先确认姿势、手型、节拍和声音是否稳定。每次只练一个动作，用节拍器从慢速开始，听每根弦是否清楚，卡住时记录是哪根手指、哪个和弦或哪个拍点出问题。`,
    example: topic.includes('和弦') ? '例如练 C 和弦时，逐根拨弦检查是否有闷音，再慢慢切到 G 或 Am。' : '例如右手拨弦先从 60 BPM 开始，每拍拨一次，保持音量均匀。',
    action: `用节拍器完成「${topic}」5-10 分钟专项练习，并记录卡顿位置。`,
    check: `能稳定完成「${topic}」的基础动作，声音清楚，节奏不断。`,
  };
  if (domain === 'nextjs') return {
    title: prefix,
    explanation: `围绕「${topic}」做 Next.js 全栈项目时，要把概念落到代码里：先确认它属于页面、组件、接口、数据库、认证还是部署，再写一个可运行的小功能，并用浏览器或接口请求验证结果。`,
    example: topic.includes('API') || topic.includes('Server') ? '例如写一个 Route Handler 返回课程列表，再在页面中请求并展示加载状态。' : '例如新增一个 dashboard 页面，把布局、列表卡片和空状态拆成独立组件。',
    action: `在项目中实现一个和「${topic}」相关的最小功能，提交代码并记录测试方式。`,
    check: `本地运行后能访问或触发「${topic}」功能，并能说明关键文件位置。`,
  };
  if (domain === 'aiDrawing') return {
    title: prefix,
    explanation: `学习「${topic}」时，要把提示词、画面结果和调整原因连起来。每次生成至少保留 2-3 个版本，对比主体、风格、构图、光影和参数变化，再写下下一轮要修改的提示词。`,
    example: topic.includes('负面') ? '例如加入 low quality、extra fingers 等负面提示词，对比人物手部和画面细节变化。' : '例如同一主题分别尝试水彩、赛博朋克和电影光三种风格。',
    action: `围绕「${topic}」生成 3 张图，并记录提示词、参数和改进点。`,
    check: `能解释「${topic}」如何影响画面，并给出下一轮优化提示词。`,
  };
  if (domain === 'pcBuild') return {
    title: prefix,
    explanation: `学习「${topic}」时，要把硬件参数和真实用途连接起来。先确认预算、使用场景和性能目标，再比较型号、接口、功耗、尺寸和可替代方案，避免只看单个跑分或热门推荐。`,
    example: topic.includes('电源') ? '例如根据 CPU 和 GPU 功耗估算整机功耗，再留出 20%-30% 余量选择电源。' : '例如游戏电脑优先看 GPU 和分辨率，剪辑电脑更要关注 CPU、内存和硬盘。',
    action: `完成「${topic}」相关配置对比，写出选择理由和待确认风险。`,
    check: `能说明「${topic}」与预算、性能和兼容性的关系。`,
  };
  if (domain === 'examEnglish') return {
    title: prefix,
    explanation: `训练「${topic}」时，要回到中考阅读原文找证据。先读题干关键词，再定位原文句子，最后判断选项是否偷换范围、因果或主旨。练习后把错因归到词汇、长难句、定位、推断或主旨判断。`,
    example: topic.includes('细节') ? '例如细节题要画出原文对应句，不能凭印象选择同义词最多的选项。' : '例如推断题要找上下文依据，不能加入文章没有说的信息。',
    action: `完成 1 篇阅读中「${topic}」相关题目，并标出原文依据。`,
    check: `能说明正确选项为什么对、错误选项为什么不成立。`,
  };
  if (domain === 'photography') return {
    title: prefix,
    explanation: `练「${topic}」时，要用同一场景做参数或构图对比。拍摄后不要只选好看的照片，要记录光线方向、焦段、快门、光圈、ISO 和构图选择，找到画面变好的原因。`,
    example: topic.includes('快门') ? '例如用 1/30、1/125、1/500 拍同一动作，对比拖影和凝固效果。' : '例如用三分法和居中构图拍同一主体，对比画面稳定感。',
    action: `围绕「${topic}」拍 5 张对比照片，并写下参数和观察。`,
    check: `能解释「${topic}」对画面亮度、清晰度或表达的影响。`,
  };
  return {
    title: prefix,
    explanation: `围绕「${cleanGoal(goal)}」学习「${topic}」时，先明确它在本阶段解决什么问题，再完成一个可检查的小任务。把资料、操作过程、结果和卡点记录下来，便于下一步继续改进。`,
    example: `例如把「${topic}」整理成一张清单：关键材料、操作步骤、产出结果和判断标准。`,
    action: `完成「${topic}」对应练习，并保留结果。`,
    check: `能说明「${topic}」的用途，并拿出一个可检查成果。`,
  };
}

function buildPlanFromModules(plan: MockPlan, goal: string, modules: DomainModule[]): MockPlan {
  const roadmap: RoadmapStage[] = modules.map((module, index) => ({
    name: module.name,
    duration: plan.roadmap?.[index]?.duration || (modules.length >= 6 ? '3-5 天' : '1-2 周'),
    goal: module.goal,
    description: module.description,
    why: module.description,
    output: module.output,
    practice: `围绕「${module.topics.slice(0, 3).join('、')}」完成专项练习，并保留过程记录。`,
    checkpoint: module.checkpoint,
    commonMistakes: ['跳过基础动作直接追求速度', '没有记录卡点和错误原因', '没有用可检查标准验收'],
    tasks: module.topics.slice(0, 6),
    steps: module.topics.slice(0, 5).map((topic, stepIndex) => stepForModule(goal, module, topic, stepIndex)),
  }));
  const courseStructure: CourseStage[] = modules.map((module) => ({ stage: module.name, topics: module.topics }));
  const slides: CourseSlide[] = roadmap.flatMap((stage) => [
    { title: stage.name, subtitle: stage.goal, content: stage.description, bullets: [stage.output || '', stage.checkpoint || '', ...(stage.tasks || []).slice(0, 3)].filter(isNonEmptyText), speakerNote: stage.why, relatedPhase: stage.name },
    ...(stage.steps || []).slice(0, 1).map((step) => ({ title: step.title, subtitle: stage.name, content: step.explanation, bullets: [step.example || '', step.action, step.check].filter(isNonEmptyText), speakerNote: step.check, relatedPhase: stage.name })),
  ]).slice(0, 14);
  return {
    ...plan,
    title: plan.title && !isGenericCourseText(plan.title) ? plan.title : `${cleanGoal(goal)}系统课程`,
    summary: `围绕「${cleanGoal(goal)}」拆成 ${modules.length} 个具体部分，每部分包含学习点、练习任务、阶段产出和检查标准。`,
    courseIntro: `这门课会从「${modules[0]?.name || cleanGoal(goal)}」开始，逐步推进到可展示成果。`,
    overview: `按 ${modules.map((module) => module.name.replace(/^第[一二三四五六七八九十]+部分[:：]/, '')).slice(0, 5).join('、')} 等模块推进。`,
    outcome: modules[modules.length - 1]?.output || plan.outcome,
    learningOutcomes: modules.slice(0, 6).map((module) => module.checkpoint),
    roadmap,
    courseStructure,
    slides,
  };
}

function visiblePlanTexts(plan: MockPlan) {
  return [
    plan.title,
    plan.summary,
    plan.courseIntro || '',
    plan.overview || '',
    ...(plan.roadmap || []).flatMap((stage) => [stage.name, stage.goal, stage.description, stage.why || '', stage.output || '', stage.practice || '', stage.checkpoint || '', ...(stage.tasks || []), ...((stage.steps || []).flatMap((step) => [step.title, step.explanation, step.example || '', step.action, step.check]))]),
    ...(plan.courseStructure || []).flatMap((stage) => [stage.stage, ...stage.topics]),
    ...((plan.slides || []).flatMap((slide) => [slide.title, slide.subtitle || '', slide.content, slide.speakerNote || '', ...(slide.bullets || [])])),
  ].filter(isNonEmptyText);
}

function shouldRebuildPlan(plan: MockPlan, goal: string, modules: DomainModule[]) {
  if (modules.length === 0) return false;
  const texts = visiblePlanTexts(plan);
  if (texts.some(isGenericCourseText)) return true;
  const joined = texts.join(' / ');
  const expected = modules.flatMap((module) => module.topics).slice(0, 16);
  return expected.filter((term) => joined.includes(term)).length < Math.min(5, expected.length);
}

function sanitizeStage(stage: RoadmapStage, goal: string): RoadmapStage {
  const sourceTopics = dedupeCourseItems([...(stage.tasks || []), ...((stage.steps || []).map((step) => step.title.replace(/^第\s*\d+\s*步[:：]?\s*/, '')))]).filter((item) => !isGenericCourseText(item));
  const anchor = sourceTopics[0] || stage.name || goal;
  return {
    ...stage,
    goal: isGenericCourseText(stage.goal) ? `掌握「${anchor}」相关能力` : stage.goal,
    description: isGenericCourseText(stage.description) ? `围绕「${stage.name}」学习 ${sourceTopics.slice(0, 3).join('、')}，并完成对应练习。` : stage.description,
    practice: stage.practice && !isGenericCourseText(stage.practice) ? stage.practice : `围绕「${sourceTopics.slice(0, 3).join('、') || stage.name}」完成专项练习，并保留过程记录。`,
    checkpoint: stage.checkpoint && !isGenericCourseText(stage.checkpoint) ? stage.checkpoint : `能完成「${anchor}」任务，并拿出可检查成果。`,
    tasks: sourceTopics.length > 0 ? sourceTopics.slice(0, 6) : stage.tasks,
  };
}

function sanitizeSlides(slides: CourseSlide[] | undefined) {
  if (!Array.isArray(slides)) return slides;
  return slides.map((slide) => ({
    ...slide,
    title: isGenericCourseText(slide.title) ? (slide.relatedPhase || '课程重点') : slide.title,
    content: isGenericCourseText(slide.content) ? `围绕「${slide.title}」学习本页知识点，并完成对应练习和检查标准。` : slide.content,
    bullets: dedupeCourseItems(slide.bullets || []).filter((item) => !isGenericCourseText(item)).slice(0, 6),
    speakerNote: slide.speakerNote && !isGenericCourseText(slide.speakerNote) ? slide.speakerNote : slide.content,
  }));
}

export function normalizeSpecificCoursePlan(plan: MockPlan, goal: string): MockPlan {
  const modules = modulesForGoal(goal);
  const sourcePlan = shouldRebuildPlan(plan, goal, modules) ? buildPlanFromModules(plan, goal, modules) : plan;
  return {
    ...sourcePlan,
    summary: isGenericCourseText(sourcePlan.summary) ? `围绕「${cleanGoal(goal)}」拆成具体阶段、学习点、练习任务和可检查成果。` : sourcePlan.summary,
    roadmap: Array.isArray(sourcePlan.roadmap) ? sourcePlan.roadmap.map((stage) => sanitizeStage(stage, goal)) : sourcePlan.roadmap,
    courseStructure: Array.isArray(sourcePlan.courseStructure)
      ? sourcePlan.courseStructure.map((stage) => ({
          ...stage,
          topics: dedupeCourseItems(stage.topics || []).filter((topic) => !isGenericCourseText(topic)).slice(0, 8),
        })).filter((stage) => stage.topics.length > 0)
      : sourcePlan.courseStructure,
    slides: sanitizeSlides(sourcePlan.slides),
  };
}

export function buildDomainSpecificFallbackStep(input: { goal: string; phaseName: string; title: string; index: number }): CourseStep | null {
  const module = modulesForGoal(input.goal).find((item) => item.name === input.phaseName) || modulesForGoal(input.goal)[0];
  if (!module) return null;
  return stepForModule(input.goal, module, input.title.replace(/^第\s*\d+\s*步[:：]?\s*/, ''), input.index);
}

export function buildDomainSpecificText(input: { goal: string; phaseName?: string; topic?: string; taskTitle?: string; index?: number }) {
  const title = input.taskTitle || input.topic || input.phaseName || cleanGoal(input.goal);
  const step = buildDomainSpecificFallbackStep({ goal: input.goal, phaseName: input.phaseName || '', title, index: input.index || 0 });
  return step?.explanation || `围绕「${cleanGoal(input.goal)}」完成「${title}」：先明确用途，再做一个可检查练习，最后记录结果和卡点。`;
}
