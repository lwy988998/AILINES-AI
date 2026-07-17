import { detectLearningDomain, type LearningDomain } from '@/lib/learningDomain';
import type { MockPlan } from '@/lib/mockPlan';

export type ProgressTask = {
  id: string;
  title: string;
};

export type ProgressStage = {
  id: string;
  title: string;
  tasks: ProgressTask[];
};

const progressTemplates: Partial<Record<LearningDomain, ProgressStage[]>> = {
  programming: [
    {
      id: 'foundation',
      title: '阶段一：基础入门',
      tasks: [
        { id: 'foundation-goal', title: '明确学习目标和应用场景' },
        { id: 'foundation-concepts', title: '学习核心概念' },
        { id: 'foundation-environment', title: '完成基础环境准备' },
        { id: 'foundation-review', title: '完成阶段复盘' },
      ],
    },
    {
      id: 'core',
      title: '阶段二：核心知识',
      tasks: [
        { id: 'core-topics', title: '学习主要知识点' },
        { id: 'core-resources', title: '阅读推荐资源' },
        { id: 'core-practice', title: '完成小练习' },
        { id: 'core-notes', title: '整理学习笔记' },
      ],
    },
    {
      id: 'practice',
      title: '阶段三：实战应用',
      tasks: [
        { id: 'practice-first-project', title: '完成第一个实战项目' },
        { id: 'practice-acceptance', title: '对照验收标准检查成果' },
        { id: 'practice-polish', title: '优化项目细节' },
        { id: 'practice-problems', title: '总结遇到的问题' },
      ],
    },
    {
      id: 'portfolio',
      title: '阶段四：项目巩固',
      tasks: [
        { id: 'portfolio-final-project', title: '完成综合项目' },
        { id: 'portfolio-readme', title: '整理作品说明' },
        { id: 'portfolio-summary', title: '形成个人学习总结' },
        { id: 'portfolio-next', title: '规划下一阶段路线' },
      ],
    },
  ],
  math: [
    {
      id: 'concepts',
      title: '阶段一：概念理解',
      tasks: [
        { id: 'math-angle-radian', title: '理解角度制与弧度制' },
        { id: 'math-sin-cos-tan', title: '掌握正弦、余弦、正切的定义' },
        { id: 'math-unit-circle', title: '画出单位圆并标注关键角' },
        { id: 'math-concept-check', title: '完成基础概念自测' },
      ],
    },
    {
      id: 'methods',
      title: '阶段二：公式与图像',
      tasks: [
        { id: 'math-graphs', title: '掌握三角函数图像' },
        { id: 'math-period-amplitude-phase', title: '理解周期、振幅、相位' },
        { id: 'math-identities', title: '记忆并推导常用恒等式' },
        { id: 'math-formula-practice', title: '完成基础公式练习' },
      ],
    },
    {
      id: 'practice',
      title: '阶段三：解题训练',
      tasks: [
        { id: 'math-value-practice', title: '练习三角函数求值' },
        { id: 'math-transform-practice', title: '练习图像变换题' },
        { id: 'math-identity-practice', title: '练习恒等变形题' },
        { id: 'math-wrong-notes', title: '整理错题和方法' },
      ],
    },
    {
      id: 'mastery',
      title: '阶段四：综合应用',
      tasks: [
        { id: 'math-final-test', title: '完成综合测试' },
        { id: 'math-types-summary', title: '总结常见题型' },
        { id: 'math-formula-cards', title: '建立公式卡片' },
        { id: 'math-next', title: '规划下一阶段学习' },
      ],
    },
  ],
  language: [
    {
      id: 'input',
      title: '阶段一：输入基础',
      tasks: [
        { id: 'language-goal', title: '明确学习场景和目标水平' },
        { id: 'language-words', title: '建立高频词汇清单' },
        { id: 'language-listening', title: '完成短音频精听练习' },
        { id: 'language-notes', title: '整理常见表达和例句' },
      ],
    },
    {
      id: 'grammar',
      title: '阶段二：语法与表达',
      tasks: [
        { id: 'language-grammar', title: '学习核心语法结构' },
        { id: 'language-sentences', title: '仿写常用句型' },
        { id: 'language-reading', title: '完成短文阅读和摘录' },
        { id: 'language-corrections', title: '整理错句和修正方式' },
      ],
    },
    {
      id: 'output',
      title: '阶段三：输出训练',
      tasks: [
        { id: 'language-speaking', title: '完成口语跟读或复述' },
        { id: 'language-writing', title: '完成短文写作练习' },
        { id: 'language-dialogue', title: '模拟真实对话场景' },
        { id: 'language-feedback', title: '根据反馈修正表达' },
      ],
    },
    {
      id: 'review',
      title: '阶段四：复盘巩固',
      tasks: [
        { id: 'language-test', title: '完成阶段小测' },
        { id: 'language-review', title: '复习高频词和易错表达' },
        { id: 'language-summary', title: '形成个人表达库' },
        { id: 'language-next', title: '规划下一阶段输入材料' },
      ],
    },
  ],
  office: [
    {
      id: 'basics',
      title: '阶段一：基础操作',
      tasks: [
        { id: 'office-goal', title: '明确办公场景和成果要求' },
        { id: 'office-interface', title: '熟悉常用界面和基础操作' },
        { id: 'office-template', title: '整理一个练习模板' },
        { id: 'office-shortcuts', title: '掌握高频快捷操作' },
      ],
    },
    {
      id: 'core',
      title: '阶段二：核心功能',
      tasks: [
        { id: 'office-functions', title: '学习高频函数或功能模块' },
        { id: 'office-cleaning', title: '完成数据整理或内容排版练习' },
        { id: 'office-report', title: '制作一份小型报表或文档' },
        { id: 'office-notes', title: '整理操作步骤和常见问题' },
      ],
    },
    {
      id: 'scenario',
      title: '阶段三：场景应用',
      tasks: [
        { id: 'office-case', title: '完成一个真实办公场景案例' },
        { id: 'office-check', title: '检查格式、数据和表达是否准确' },
        { id: 'office-optimize', title: '优化模板复用性' },
        { id: 'office-summary', title: '总结可复用流程' },
      ],
    },
    {
      id: 'automation',
      title: '阶段四：效率提升',
      tasks: [
        { id: 'office-workflow', title: '建立个人工作流' },
        { id: 'office-quality', title: '制定质量检查清单' },
        { id: 'office-deliverable', title: '完成一份可交付成果' },
        { id: 'office-next', title: '规划下一项效率提升点' },
      ],
    },
  ],
  design: [
    {
      id: 'principles',
      title: '阶段一：审美与原则',
      tasks: [
        { id: 'design-goal', title: '明确设计目标和使用场景' },
        { id: 'design-principles', title: '学习版式、颜色和层级基础' },
        { id: 'design-reference', title: '收集并分析优秀参考' },
        { id: 'design-notes', title: '整理设计观察笔记' },
      ],
    },
    {
      id: 'tools',
      title: '阶段二：工具操作',
      tasks: [
        { id: 'design-tool-basics', title: '熟悉核心工具和常用面板' },
        { id: 'design-components', title: '练习基础元素制作' },
        { id: 'design-recreate', title: '临摹一个小案例' },
        { id: 'design-file', title: '整理文件命名和图层结构' },
      ],
    },
    {
      id: 'practice',
      title: '阶段三：主题练习',
      tasks: [
        { id: 'design-brief', title: '根据需求完成一份设计稿' },
        { id: 'design-variants', title: '输出 2-3 个方案变体' },
        { id: 'design-feedback', title: '根据反馈修改一版' },
        { id: 'design-export', title: '导出规范成果' },
      ],
    },
    {
      id: 'portfolio',
      title: '阶段四：作品整理',
      tasks: [
        { id: 'design-case-study', title: '整理作品过程说明' },
        { id: 'design-polish', title: '统一细节和视觉规范' },
        { id: 'design-portfolio', title: '完成一页作品展示' },
        { id: 'design-next', title: '规划下一类练习主题' },
      ],
    },
  ],
  ai: [
    {
      id: 'foundation',
      title: '阶段一：基础认知',
      tasks: [
        { id: 'ai-concepts', title: '理解 AILINES AI、机器学习和大模型基本概念' },
        { id: 'ai-use-cases', title: '梳理典型应用场景' },
        { id: 'ai-terms', title: '整理常见术语表' },
        { id: 'ai-safety', title: '了解基本限制和风险' },
      ],
    },
    {
      id: 'methods',
      title: '阶段二：方法与工具',
      tasks: [
        { id: 'ai-workflow', title: '学习常见 AILINES AI 工作流' },
        { id: 'ai-prompt', title: '练习结构化提问和提示词' },
        { id: 'ai-eval', title: '学习结果评估方法' },
        { id: 'ai-notes', title: '整理案例和反例' },
      ],
    },
    {
      id: 'practice',
      title: '阶段三：场景练习',
      tasks: [
        { id: 'ai-case', title: '完成一个具体应用场景练习' },
        { id: 'ai-compare', title: '对比不同提示或工具效果' },
        { id: 'ai-iterate', title: '根据结果迭代方案' },
        { id: 'ai-summary', title: '总结可复用经验' },
      ],
    },
    {
      id: 'project',
      title: '阶段四：综合应用',
      tasks: [
        { id: 'ai-solution', title: '设计一个 AILINES AI 辅助工作方案' },
        { id: 'ai-checklist', title: '制定质量与风险检查清单' },
        { id: 'ai-deliverable', title: '完成可展示成果' },
        { id: 'ai-next', title: '规划下一阶段深入方向' },
      ],
    },
  ],
  general: [
    {
      id: 'foundation',
      title: '阶段一：目标拆解',
      tasks: [
        { id: 'general-goal', title: '明确学习目标和使用场景' },
        { id: 'general-map', title: '梳理知识地图和前置基础' },
        { id: 'general-plan', title: '制定每周学习安排' },
        { id: 'general-review', title: '完成阶段复盘' },
      ],
    },
    {
      id: 'core',
      title: '阶段二：核心知识',
      tasks: [
        { id: 'general-concepts', title: '学习主要概念和方法' },
        { id: 'general-examples', title: '拆解典型案例' },
        { id: 'general-practice', title: '完成基础练习' },
        { id: 'general-notes', title: '整理学习笔记' },
      ],
    },
    {
      id: 'practice',
      title: '阶段三：应用练习',
      tasks: [
        { id: 'general-scenario', title: '选择一个真实应用场景' },
        { id: 'general-task', title: '完成一个小型实践任务' },
        { id: 'general-feedback', title: '根据结果或反馈优化' },
        { id: 'general-problems', title: '总结遇到的问题' },
      ],
    },
    {
      id: 'summary',
      title: '阶段四：总结提升',
      tasks: [
        { id: 'general-check', title: '对照验收标准检查成果' },
        { id: 'general-summary', title: '形成个人学习总结' },
        { id: 'general-output', title: '整理可展示成果' },
        { id: 'general-next', title: '规划下一阶段路线' },
      ],
    },
  ],
};

function slug(value: string, fallback: string) {
  const ascii = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (ascii) return ascii.slice(0, 48);
  return fallback;
}

function stripStepPrefix(value: string) {
  return value.replace(/^第\s*\d+\s*步[:：]?\s*/, '').trim();
}

export function progressStagesFromCoursePlan(plan: MockPlan, goal: string): ProgressStage[] {
  const roadmap = Array.isArray(plan.roadmap) ? plan.roadmap : [];
  const structure = Array.isArray(plan.courseStructure) ? plan.courseStructure : [];

  const stages = roadmap.map((stage, index) => {
    const structureTopics = structure.find((item) => item.stage === stage.name)?.topics || [];
    const taskTitles = [
      ...(Array.isArray(stage.tasks) ? stage.tasks : []),
      ...(Array.isArray(stage.steps) ? stage.steps.map((step) => stripStepPrefix(step.title)) : []),
      ...structureTopics,
    ]
      .map((item) => item.trim())
      .filter(Boolean);
    const uniqueTitles = Array.from(new Set(taskTitles)).slice(0, 8);

    return {
      id: slug(stage.name || '', `phase-${index + 1}`),
      title: stage.name || `阶段 ${index + 1}`,
      tasks: uniqueTitles.map((title, taskIndex) => ({ id: `${slug(stage.name || '', `phase-${index + 1}`)}-${taskIndex + 1}`, title })),
    };
  }).filter((stage) => stage.tasks.length > 0);

  if (stages.length > 0) return stages;
  return getProgressStagesByGoal(goal);
}

export function getProgressStagesByGoal(goal: string): ProgressStage[] {
  return progressTemplates[detectLearningDomain(goal)] || progressTemplates.general || [];
}

export const progressStages: ProgressStage[] = progressTemplates.general || [];
