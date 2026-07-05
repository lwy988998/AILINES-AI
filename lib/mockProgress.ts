export type ProgressTask = {
  id: string;
  title: string;
};

export type ProgressStage = {
  id: string;
  title: string;
  tasks: ProgressTask[];
};

export const progressStages: ProgressStage[] = [
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
];
