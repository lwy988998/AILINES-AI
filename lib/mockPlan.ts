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
  roadmap: RoadmapStage[];
  courseStructure: CourseStage[];
  resources: ResourceItem[];
  projects: ProjectItem[];
};

export function getMockPlan(goal: string): MockPlan {
  const target = goal || '目标技能';

  return {
    roadmap: [
      {
        name: '阶段一：基础入门',
        duration: '2 周',
        goal: `建立 ${target} 的核心概念与学习环境`,
        description: '先理解用途、基本语法/概念和常用工具，完成最小可运行练习。',
      },
      {
        name: '阶段二：核心语法与工具',
        duration: '3 周',
        goal: '掌握高频知识点并形成稳定练习节奏',
        description: '围绕真实任务拆解知识点，逐步熟悉调试、文档查询和代码组织。',
      },
      {
        name: '阶段三：实战应用',
        duration: '3 周',
        goal: '把知识点组合成可交付的小功能',
        description: '通过案例训练输入、处理、输出的完整链路，避免只停留在看教程。',
      },
      {
        name: '阶段四：项目巩固',
        duration: '2 周',
        goal: '完成一个可展示的综合项目',
        description: '整理项目说明、复盘问题清单，并形成后续进阶学习方向。',
      },
    ],
    courseStructure: [
      {
        stage: '阶段一：基础入门',
        topics: ['学习环境搭建', '基础概念与应用场景', '第一个可运行示例', '常见错误与排查方式'],
      },
      {
        stage: '阶段二：核心语法与工具',
        topics: ['数据类型与结构', '条件与循环', '函数与模块化', '文件与数据处理', '包管理与依赖安装', '调试与日志'],
      },
      {
        stage: '阶段三：实战应用',
        topics: ['需求拆解', '接口/数据读取', '核心逻辑实现', '结果展示', '异常处理', '代码重构'],
      },
      {
        stage: '阶段四：项目巩固',
        topics: ['项目选题', '任务排期', 'README 编写', '部署或本地演示', '复盘与进阶路线'],
      },
    ],
    resources: [
      {
        name: `${target} 官方文档`,
        type: '官方文档',
        difficulty: '入门',
        free: true,
        description: '最稳定的一手资料，适合查语法、API 和最佳实践。',
        href: 'https://docs.python.org/zh-cn/3/',
      },
      {
        name: 'freeCodeCamp 学习资源',
        type: '视频',
        difficulty: '入门',
        free: true,
        description: '适合从零开始建立整体印象，配合练习效果更好。',
        href: 'https://www.freecodecamp.org/news/',
      },
      {
        name: 'GitHub Awesome List',
        type: 'GitHub',
        difficulty: '中级',
        free: true,
        description: '汇总大量开源项目、教程和工具，适合作为进阶资源池。',
        href: 'https://github.com/vinta/awesome-python',
      },
      {
        name: 'Real Python Articles',
        type: '文章',
        difficulty: '中级',
        free: true,
        description: '通过专题文章补齐细节，适合在项目阶段按需查阅。',
        href: 'https://realpython.com/',
      },
    ],
    projects: [
      {
        name: `${target} 学习笔记站`,
        difficulty: '入门',
        duration: '2-3 天',
        output: '一个包含知识点、代码片段和复盘记录的静态页面或文档库。',
        acceptance: '能清晰说明 10 个核心概念，并包含至少 5 个可运行示例。',
      },
      {
        name: '资料整理自动化工具',
        difficulty: '中级',
        duration: '1 周',
        output: '一个能读取输入、整理数据并生成结果文件的小工具。',
        acceptance: '支持基础错误提示，README 中写明安装、运行和示例输入输出。',
      },
      {
        name: '综合练习项目',
        difficulty: '中级',
        duration: '1-2 周',
        output: '一个围绕真实需求完成的端到端小项目。',
        acceptance: '包含明确需求、核心功能、演示截图/说明和后续优化清单。',
      },
    ],
  };
}
