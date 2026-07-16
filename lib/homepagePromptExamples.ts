export type HomepagePromptMode = 'lite' | 'deep' | 'image';
export type HomepagePromptExampleMode = 'study' | 'image' | 'both';

export type HomepagePromptExample = {
  text: string;
  category: string;
  mode: HomepagePromptExampleMode;
};

export const homepagePromptExamples: HomepagePromptExample[] = [
  { text: '小学语文阅读理解答题方法训练', category: '中小学学习', mode: 'study' },
  { text: '小学数学应用题审题与列式训练', category: '中小学学习', mode: 'study' },
  { text: '初中历史时间线梳理与记忆', category: '中小学学习', mode: 'study' },
  { text: '初中物理力学入门学习路线', category: '中小学学习', mode: 'study' },
  { text: '初中英语完形填空专项提升', category: '中小学学习', mode: 'study' },
  { text: '中考英语阅读理解提分', category: '中考 / 高考', mode: 'study' },
  { text: '中考数学压轴题解题思路训练', category: '中考 / 高考', mode: 'study' },
  { text: '高考语文现代文阅读答题模板', category: '中考 / 高考', mode: 'study' },
  { text: '高考英语作文提分训练计划', category: '中考 / 高考', mode: 'study' },
  { text: '高中数学函数专题复习', category: '中考 / 高考', mode: 'study' },
  { text: '大学线性代数从矩阵到特征值', category: '大学课程', mode: 'study' },
  { text: '大学概率论期末复习路线', category: '大学课程', mode: 'study' },
  { text: '计算机网络七层模型系统学习', category: '大学课程', mode: 'study' },
  { text: '操作系统进程与内存管理入门', category: '大学课程', mode: 'study' },
  { text: '经济学原理供需模型学习计划', category: '大学课程', mode: 'study' },
  { text: 'Python 零基础入门到做一个小工具', category: '编程开发', mode: 'study' },
  { text: 'JavaScript 异步编程与 Promise 专题', category: '编程开发', mode: 'study' },
  { text: 'React 组件状态管理入门到实践', category: '编程开发', mode: 'study' },
  { text: 'Next.js 全栈项目从 0 到上线', category: '编程开发', mode: 'study' },
  { text: 'SQL 查询与数据分析实战训练', category: '编程开发', mode: 'study' },
  { text: 'AI 绘画提示词入门', category: 'AI / 大模型', mode: 'study' },
  { text: '大模型 Prompt 工程系统学习', category: 'AI / 大模型', mode: 'study' },
  { text: 'RAG 知识库应用开发路线', category: 'AI / 大模型', mode: 'study' },
  { text: 'AI Agent 工作流设计入门', category: 'AI / 大模型', mode: 'study' },
  { text: '用大模型做个人学习助手', category: 'AI / 大模型', mode: 'study' },
  { text: '学习摄影构图与光线', category: '设计 / 摄影 / 绘画', mode: 'study' },
  { text: '用 Figma 设计一个 App 首页', category: '设计 / 摄影 / 绘画', mode: 'study' },
  { text: '零基础学习色彩搭配与版式', category: '设计 / 摄影 / 绘画', mode: 'study' },
  { text: '30 天入门 AI 绘画', category: '设计 / 摄影 / 绘画', mode: 'study' },
  { text: '手机摄影人像拍摄与修图训练', category: '设计 / 摄影 / 绘画', mode: 'study' },
  { text: 'Excel 数据透视表与办公自动化', category: '职场技能', mode: 'study' },
  { text: '职场邮件写作与高效沟通', category: '职场技能', mode: 'study' },
  { text: '项目管理从需求到交付流程', category: '职场技能', mode: 'study' },
  { text: 'PPT 汇报结构与视觉表达训练', category: '职场技能', mode: 'study' },
  { text: '会议纪要与行动项整理方法', category: '职场技能', mode: 'study' },
  { text: '产品经理从 0 到 1 学习路线', category: '产品 / 运营 / 商业', mode: 'study' },
  { text: '用户调研与需求分析入门', category: '产品 / 运营 / 商业', mode: 'study' },
  { text: '内容运营选题策划与复盘', category: '产品 / 运营 / 商业', mode: 'study' },
  { text: '商业模式画布实战学习', category: '产品 / 运营 / 商业', mode: 'study' },
  { text: '增长运营指标体系搭建', category: '产品 / 运营 / 商业', mode: 'study' },
  { text: '英语口语 30 天表达训练', category: '语言学习', mode: 'study' },
  { text: '考研英语长难句训练', category: '语言学习', mode: 'study' },
  { text: '日语五十音到基础会话入门', category: '语言学习', mode: 'study' },
  { text: '雅思听力地图题专项练习', category: '语言学习', mode: 'study' },
  { text: '商务英语会议表达训练', category: '语言学习', mode: 'study' },
  { text: '公务员行测资料分析提分计划', category: '考证 / 考公 / 考研', mode: 'study' },
  { text: '考研数学一高数复习路线', category: '考证 / 考公 / 考研', mode: 'study' },
  { text: '教师资格证教育知识备考计划', category: '考证 / 考公 / 考研', mode: 'study' },
  { text: '注册会计师会计科目入门', category: '考证 / 考公 / 考研', mode: 'study' },
  { text: '法考民法重点章节学习路线', category: '考证 / 考公 / 考研', mode: 'study' },
  { text: '高中物理电磁学专题复习', category: '数学 / 物理 / 化学', mode: 'study' },
  { text: '高中化学有机反应类型梳理', category: '数学 / 物理 / 化学', mode: 'study' },
  { text: '微积分极限与导数入门', category: '数学 / 物理 / 化学', mode: 'study' },
  { text: '初中几何辅助线思路训练', category: '数学 / 物理 / 化学', mode: 'study' },
  { text: '物理实验题数据处理方法', category: '数学 / 物理 / 化学', mode: 'study' },
  { text: '公众号文章选题与结构写作', category: '写作 / 演讲 / 表达', mode: 'study' },
  { text: '即兴演讲表达与逻辑训练', category: '写作 / 演讲 / 表达', mode: 'study' },
  { text: '小说人物设定与情节设计', category: '写作 / 演讲 / 表达', mode: 'study' },
  { text: '学术论文摘要与引言写作', category: '写作 / 演讲 / 表达', mode: 'study' },
  { text: '短视频脚本写作入门', category: '写作 / 演讲 / 表达', mode: 'study' },
  { text: '30 天建立健身训练计划', category: '健身 / 健康', mode: 'study' },
  { text: '跑步入门到 5 公里训练', category: '健身 / 健康', mode: 'study' },
  { text: '办公室肩颈放松与体态改善', category: '健身 / 健康', mode: 'study' },
  { text: '健康饮食基础与一周菜单规划', category: '健身 / 健康', mode: 'study' },
  { text: '睡眠习惯改善与精力管理', category: '健身 / 健康', mode: 'study' },
  { text: '吉他零基础和弦入门', category: '音乐 / 艺术', mode: 'study' },
  { text: '钢琴识谱与节奏训练', category: '音乐 / 艺术', mode: 'study' },
  { text: '音乐乐理音程与和弦学习', category: '音乐 / 艺术', mode: 'study' },
  { text: '水彩画入门到完成一幅风景', category: '音乐 / 艺术', mode: 'study' },
  { text: '书法基础笔画与结构训练', category: '音乐 / 艺术', mode: 'study' },
  { text: '个人预算管理与记账入门', category: '财商 / 投资基础', mode: 'study' },
  { text: '基金定投基础与风险理解', category: '财商 / 投资基础', mode: 'study' },
  { text: '财务报表三张表入门', category: '财商 / 投资基础', mode: 'study' },
  { text: '投资组合分散风险基础', category: '财商 / 投资基础', mode: 'study' },
  { text: '复利、通胀与长期储蓄规划', category: '财商 / 投资基础', mode: 'study' },
  { text: '一周家庭收纳整理计划', category: '生活技能', mode: 'study' },
  { text: '新手做饭从备菜到三菜一汤', category: '生活技能', mode: 'study' },
  { text: '旅行攻略规划与预算控制', category: '生活技能', mode: 'study' },
  { text: '时间管理与每日计划复盘', category: '生活技能', mode: 'study' },
  { text: '租房看房避坑清单学习', category: '生活技能', mode: 'study' },
  { text: '高中数学知识图谱插画', category: '生图创意 / 教育视觉', mode: 'image' },
  { text: '赛博朋克机器人老师', category: '生图创意 / 角色概念', mode: 'image' },
  { text: '水彩风学习计划海报', category: '生图创意 / 海报设计', mode: 'image' },
  { text: 'AI 绘画提示词入门视觉图', category: '生图创意 / 教育视觉', mode: 'image' },
  { text: '未来感 AI 学习助手海报', category: '生图创意 / 海报设计', mode: 'image' },
  { text: '极简蓝色科技课程封面', category: '生图创意 / 封面设计', mode: 'image' },
  { text: '手绘风英语单词记忆卡片', category: '生图创意 / 教育视觉', mode: 'image' },
  { text: '温暖书房里的深夜学习场景', category: '生图创意 / 场景氛围', mode: 'image' },
  { text: '低多边形风格物理实验插图', category: '生图创意 / 科普插画', mode: 'image' },
  { text: '扁平插画风职场成长路线图', category: '生图创意 / 信息图', mode: 'image' },
  { text: '3D 风格编程学习桌面场景', category: '生图创意 / 场景氛围', mode: 'image' },
  { text: '国风水墨学习目标海报', category: '生图创意 / 海报设计', mode: 'image' },
  { text: '可爱扁平风数学公式笔记页', category: '生图创意 / 教育视觉', mode: 'image' },
  { text: '渐变玻璃质感课程 App 图标', category: '生图创意 / 图标设计', mode: 'image' },
  { text: '未来城市中的在线学习中心', category: '生图创意 / 场景氛围', mode: 'image' },
  { text: '黑板粉笔风知识点总结海报', category: '生图创意 / 教育视觉', mode: 'image' },
  { text: '清新杂志风摄影构图教程封面', category: '生图创意 / 封面设计', mode: 'image' },
  { text: '等距插画风学习进度仪表盘', category: '生图创意 / 信息图', mode: 'image' },
  { text: '柔和灯光下的阅读计划插画', category: '生图创意 / 场景氛围', mode: 'image' },
  { text: '极简线条风产品经理工作流图', category: '生图创意 / 信息图', mode: 'image' },
];

export const defaultStudyPromptExamples = homepagePromptExamples
  .filter((example) => example.mode === 'study' || example.mode === 'both')
  .slice(0, 5)
  .map((example) => example.text);

export const defaultImagePromptExamples = homepagePromptExamples
  .filter((example) => example.mode === 'image' || example.mode === 'both')
  .slice(0, 5)
  .map((example) => example.text);

function shuffle<T>(items: T[]) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function getEligibleExamples(mode: HomepagePromptMode) {
  if (mode === 'image') {
    return homepagePromptExamples.filter((example) => example.mode === 'image' || example.mode === 'both');
  }

  return homepagePromptExamples.filter((example) => example.mode === 'study' || example.mode === 'both');
}

export function getRandomPromptExamples(mode: HomepagePromptMode, count = 5) {
  const eligibleExamples = getEligibleExamples(mode);
  const examplesByCategory = new Map<string, HomepagePromptExample[]>();

  for (const example of eligibleExamples) {
    const categoryExamples = examplesByCategory.get(example.category) || [];
    categoryExamples.push(example);
    examplesByCategory.set(example.category, categoryExamples);
  }

  const selected: HomepagePromptExample[] = [];
  const selectedTexts = new Set<string>();
  const shuffledCategories = shuffle([...examplesByCategory.keys()]);

  for (const category of shuffledCategories) {
    const categoryExamples = examplesByCategory.get(category) || [];
    const candidate = shuffle(categoryExamples).find((example) => !selectedTexts.has(example.text));

    if (candidate) {
      selected.push(candidate);
      selectedTexts.add(candidate.text);
    }

    if (selected.length >= count) break;
  }

  if (selected.length < count) {
    for (const candidate of shuffle(eligibleExamples)) {
      if (!selectedTexts.has(candidate.text)) {
        selected.push(candidate);
        selectedTexts.add(candidate.text);
      }

      if (selected.length >= count) break;
    }
  }

  return selected.slice(0, count).map((example) => example.text);
}
