import type { CourseMindMap, MockPlan, RoadmapStage } from '@/lib/mockPlan';

const genericNodePatterns = [
  /理解[「“]?.*阶段.*[」”]?的?核心目标/,
  /理解[「“]?.*[」”]?的?核心目标/,
  /用练习把知识变成能力/,
  /复盘并形成阶段产出/,
  /掌握基本概念/,
  /提升综合能力/,
  /学习本阶段重点/,
  /完成关键知识学习/,
  /阶段目标/,
  /学习目标定义/,
  /能力地图/,
  /工具准备/,
  /时间安排/,
  /验收标准/,
  /基础概念/,
  /常用工具/,
  /典型流程/,
  /小任务练习/,
  /问题定位/,
  /资料查询/,
  /结果优化/,
  /复盘记录/,
  /项目选题/,
  /成果整理/,
  /展示说明/,
  /反馈收集/,
  /下一步计划/,
  /能用\s*1\s*分钟.*解释/,
  /课程结构/,
  /分步学习/,
  /练习检查/,
];

function isNonEmptyText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function stripPrefix(value: string) {
  return value
    .replace(/^第\s*\d+\s*[步阶段]?[:：、-]?\s*/, '')
    .replace(/^阶段\s*[一二三四五六七八九十\d]+[:：、-]?\s*/, '')
    .trim();
}

function normalizeForCompare(value: string) {
  return stripPrefix(value).replace(/[\s，。；：、,.!?！？;:「」“”'"（）()【】\[\]-]/g, '').toLowerCase();
}

function isGenericNode(value: string) {
  const text = value.trim();
  if (!text) return true;
  return genericNodePatterns.some((pattern) => pattern.test(text));
}

function compactLabel(value: string, maxLength = 24) {
  const text = stripPrefix(value).replace(/^(例子|现在你要做|完成检查|怎么做|怎么验收|输出|目标|练习|检查点)[:：]\s*/i, '').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

function slug(value: string, fallback: string) {
  const ascii = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return ascii || fallback;
}

function uniqueLabels(values: string[], limit = 6) {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const label = compactLabel(value);
    const key = normalizeForCompare(label);
    if (!label || !key || seen.has(key) || isGenericNode(label)) continue;
    seen.add(key);
    result.push(label);
    if (result.length >= limit) break;
  }

  return result;
}

function getCourseStructureTopics(plan: MockPlan, index: number) {
  const stage = Array.isArray(plan.courseStructure) ? plan.courseStructure[index] : undefined;
  return Array.isArray(stage?.topics) ? stage.topics.filter(isNonEmptyText) : [];
}

function stageCandidates(plan: MockPlan, stage: RoadmapStage, index: number) {
  const fromStructure = getCourseStructureTopics(plan, index);
  const fromTasks = Array.isArray(stage.tasks) ? stage.tasks.filter(isNonEmptyText) : [];
  const fromSteps = Array.isArray(stage.steps)
    ? stage.steps.flatMap((step) => [step.title, step.action, step.check]).filter(isNonEmptyText)
    : [];
  return [
    ...fromStructure,
    ...fromTasks,
    ...fromSteps,
    stage.output,
    stage.practice,
    stage.checkpoint,
    ...(Array.isArray(stage.commonMistakes) ? stage.commonMistakes : []),
  ].filter(isNonEmptyText);
}

type DomainProfile = {
  rootLabel?: string;
  stageKeywords: string[][];
};

function getDomainProfile(goal: string): DomainProfile {
  if (/AI\s*绘画|AI绘画|文生图|图生图|提示词|Midjourney|Stable Diffusion|MJ|绘画/i.test(goal)) {
    return {
      rootLabel: 'ai-drawing',
      stageKeywords: [
        ['明确 AI 绘画学习目标', '认识文生图与图生图', '了解主流工具和模型', '作品复盘方式', '搭建提示词素材库', '形成每日练习节奏'],
        ['提示词结构', '风格关键词', '构图与镜头语言', '光影与色彩', '模型参数与采样设置', '负面提示词'],
        ['人像插画练习', '产品海报练习', '知识图谱插画练习', '风格迁移练习', '提示词迭代优化', '多版本对比评估'],
        ['作品集整理', '质量评估标准', '常见问题复盘', '个人提示词模板库', '系列化作品输出', '发布与展示说明'],
        ['主题创作计划', '视觉风格统一', '参数复用策略', '作品复盘表', '下一阶段提升方向', '个人案例库'],
      ],
    };
  }

  if (/配电脑|装机|电脑配置|攒机|组装电脑|选电脑|台式机配置/i.test(goal)) {
    return {
      rootLabel: 'pc-build',
      stageKeywords: [
        ['使用场景', '预算上限', '性能目标', '显示器分辨率', '已有设备', '升级空间'],
        ['CPU 选择', 'GPU 显卡选择', '主板兼容', '内存容量与频率', '硬盘容量与接口', '电源功率'],
        ['机箱尺寸', '散热方案', '接口兼容性', '显卡长度', '电源接口', '风道设计'],
        ['配置清单', '价格对比', '性能取舍', '可替代型号', '购买渠道', '装机检查'],
        ['预算复盘', '瓶颈分析', '升级建议', '兼容性复查', '最终购买清单', '风险提醒'],
      ],
    };
  }

  if (/中考.*英语|英语.*中考|阅读理解|英语阅读/i.test(goal)) {
    return {
      rootLabel: 'exam-english',
      stageKeywords: [
        ['词汇障碍诊断', '长难句拆解', '文章类型识别', '题型错因分类', '限时阅读基线', '错题复盘表'],
        ['主旨题方法', '细节题定位', '推断题依据', '词义猜测', '段落结构', '连接词识别'],
        ['定位技巧训练', '长难句翻译', '选项排除法', '原文依据标注', '限时刷题', '正确率记录'],
        ['错题复盘', '高频词回顾', '题型薄弱点', '阅读速度提升', '考前策略', '稳定得分流程'],
        ['真题套练', '主旨题复盘', '细节题复盘', '推断题复盘', '长难句积累', '错因追踪'],
      ],
    };
  }

  return {
    stageKeywords: [
      ['目标场景', '关键概念', '必备材料', '学习路径', '阶段产出', '检查标准'],
      ['核心方法', '典型案例', '操作步骤', '常见错误', '练习任务', '反馈记录'],
      ['专项练习', '难点突破', '成果打磨', '质量标准', '复盘记录', '下一步计划'],
      ['综合应用', '项目产出', '能力检查', '优化方向', '展示方式', '长期巩固'],
    ],
  };
}

function fillWithDomainTerms(goal: string, phaseName: string, index: number, existing: string[]) {
  const profile = getDomainProfile(goal);
  const terms = profile.stageKeywords[Math.min(index, profile.stageKeywords.length - 1)] || profile.stageKeywords[0] || [];
  const phaseSpecific = terms.map((term) => term.includes(goal) || phaseName.includes(term) ? term : term);
  const values = profile.rootLabel ? [...phaseSpecific, ...existing] : [...existing, ...phaseSpecific];
  return uniqueLabels(values, 6);
}

function requiredTermsForGoal(goal: string) {
  const profile = getDomainProfile(goal);
  if (profile.rootLabel === 'ai-drawing') return ['提示词', '风格', '构图', '光影', '参数', '作品复盘'];
  if (profile.rootLabel === 'pc-build') return ['预算', 'CPU', 'GPU', '主板', '内存', '电源', '兼容'];
  if (profile.rootLabel === 'exam-english') return ['词汇', '长难句', '主旨题', '细节题', '推断题', '错题复盘'];
  return [];
}

function missingRequiredTerms(goal: string, labels: string[]) {
  const requiredTerms = requiredTermsForGoal(goal);
  if (requiredTerms.length === 0) return false;
  const text = labels.join(' / ');
  return requiredTerms.filter((term) => text.includes(term)).length < Math.min(5, requiredTerms.length);
}

function mindMapLeaves(nodes: CourseMindMap['nodes']) {
  const leaves: string[] = [];
  function visit(node: { label?: string; children?: Array<{ label?: string; children?: unknown[] }> }) {
    if (isNonEmptyText(node.label)) leaves.push(node.label);
    if (Array.isArray(node.children)) node.children.forEach((child) => visit(child as { label?: string; children?: Array<{ label?: string; children?: unknown[] }> }));
  }
  nodes.forEach((node) => visit(node));
  return leaves;
}

function shouldRebuildMindMap(mindMap: CourseMindMap | undefined, plan: MockPlan, goal: string) {
  if (!mindMap || !Array.isArray(mindMap.nodes) || mindMap.nodes.length === 0) return true;
  const leaves = mindMapLeaves(mindMap.nodes).filter((label) => label !== mindMap.title);
  const childLeaves = leaves.filter((label) => label !== goal && label !== plan.title);
  if (childLeaves.length < 8) return true;
  const genericCount = childLeaves.filter(isGenericNode).length;
  if (genericCount > 0) return true;
  if (missingRequiredTerms(goal, childLeaves)) return true;
  const normalized = childLeaves.map(normalizeForCompare).filter(Boolean);
  if (new Set(normalized).size < Math.max(4, Math.floor(normalized.length * 0.65))) return true;
  return false;
}

export function buildKnowledgeMapFromCourse(plan: MockPlan, goal: string): CourseMindMap {
  const safeGoal = goal.trim() || plan.title || 'AILINES AI 课程';
  const roadmap = Array.isArray(plan.roadmap) ? plan.roadmap : [];

  return {
    title: '课程知识结构',
    nodes: [
      {
        id: 'root',
        label: safeGoal,
        children: roadmap.slice(0, 6).map((stage, index) => {
          const phaseName = stage.name || `阶段 ${index + 1}`;
          const labels = fillWithDomainTerms(safeGoal, phaseName, index, uniqueLabels(stageCandidates(plan, stage, index), 6));
          return {
            id: slug(phaseName, `phase-${index + 1}`),
            label: phaseName,
            children: labels.slice(0, 6).map((label, childIndex) => ({
              id: `${slug(phaseName, `phase-${index + 1}`)}-${childIndex + 1}`,
              label,
            })),
          };
        }),
      },
    ],
  };
}

function sanitizeExistingNodeLabels(nodes: CourseMindMap['nodes']): CourseMindMap['nodes'] {
  return nodes
    .filter((node) => isNonEmptyText(node.label) && !isGenericNode(node.label))
    .map((node, index) => ({
      id: node.id || `node-${index + 1}`,
      label: compactLabel(node.label, 36),
      children: Array.isArray(node.children) ? sanitizeExistingNodeLabels(node.children) : undefined,
    }));
}

export function normalizeCourseMindMap(plan: MockPlan, goal: string): CourseMindMap {
  if (shouldRebuildMindMap(plan.mindMap, plan, goal)) {
    return buildKnowledgeMapFromCourse(plan, goal);
  }

  const sanitizedNodes = sanitizeExistingNodeLabels(plan.mindMap!.nodes);
  if (sanitizedNodes.length === 0) return buildKnowledgeMapFromCourse(plan, goal);
  return {
    title: plan.mindMap?.title || '课程知识结构',
    nodes: sanitizedNodes,
  };
}
