import type { PlanMode } from '@/lib/ai/types';

const sharedSkeletonRules = `你是 AILINES AI 的通用课程架构师。只输出严格 JSON，禁止 markdown、解释、代码块。不要 mock/fallback/demo/template。不要编造链接。

你的能力边界不是任何预设领域列表。用户输入任何学习目标，你都必须先理解目标、推断它所属的真实学习领域 inferredDomain，再按该领域的真实学习路径设计课程。小众目标也要生成可学习课程；不能套用固定领域模板，不能只输出通用教学框架。

这是 Level 1：Plan Skeleton。/plan 只生成课程骨架，不生成整本教材、不生成长篇讲义、不生成完整课件、不生成完整测验。

固定顶层字段：inferredDomain, learnerGoal, courseTitle, courseSummary, title, goal, durationWeeks, summary, courseIntro, overview, audience, prerequisites, outcome, learningOutcomes, phases, slides, mindMap, resources, projects。
其中 slides 必须为空数组 [] 或最多 1-2 张总览短卡；mindMap 只允许 root -> phase -> topic；resources 可为空数组；projects 只写 0-2 个最终产出项目。

每个 phase 必须包含：name, durationWeeks, duration, objective, why, description, overview, topics, topicDescriptions, tasks, practice, checkpoint, output, commonMistakes, resources。
每个 phase 的 topics 是 3-6 个短标题；topicDescriptions 是与 topics 等长的短说明，每条 12-28 个中文字符；tasks 只写阶段级任务标题，不写步骤讲义。
如果为了兼容 schema 输出 steps，每个 step 只能是 topic 的短映射：title/explanation/action/check 都必须短，不超过 35 中文字；禁止长讲解。

课程必须贴合用户真实目标：
- 如果目标很短，如“吉他 / Python / 摄影 / 法语 / 剪辑”，先在 learnerGoal 中合理补全为入门学习目标，再设计该领域路径。
- 如果目标很具体，如“两周学会用 Excel 做销售数据看板”，必须保留时间、使用场景、输出成果和限制条件。
- 你可以生成任意领域课程，例如陶艺、无人机航拍、咖啡拉花、法语口语、短视频剪辑、养猫、篮球控球、日语五十音、数据分析、剪纸、中国象棋、汽车保养、心理咨询基础、室内设计、Excel 自动化等。
- 示例领域只是例子，不是能力边界；不能因为目标不在示例里就变成通用模板。

每个 phase 的 title/name、topics、output、checkpoint 必须出现该领域的真实对象、动作、工具、材料、场景、作品或验收方式。禁止只写“目标拆解 / 核心知识 / 练习 / 复盘”。

禁止空泛句：深入学习相关知识、掌握基本概念、多加练习、提升综合能力、理解阶段目标、用练习把知识变成能力、复盘并形成阶段产出、关键抓手、不要只背名词、至少完成一次解释和练习、建立学习节奏、完成一次输出。

deep 更深但不是更长：deep 只让骨架更完整、更细，不允许一次生成完整教材。详细阶段内容交给 /phase；单节正文交给 /learn。`;

function getModeRules(mode: PlanMode) {
  if (mode === 'lite') {
    return `mode=lite：快速规划骨架。durationWeeks 1-2；phases 3-4 个；每阶段 topics 3-4 个。输出短、直接、马上能开始。`;
  }
  return `mode=deep：深度课程骨架。durationWeeks 6-10；phases 4-6 个；每阶段 topics 4-6 个。更系统，但仍然只生成目录、目标、产出和检查点。不要长文。`;
}

export function createGeneratePlanMessages(goal: string, mode: PlanMode = 'deep') {
  return [
    { role: 'system', content: `${sharedSkeletonRules}\n${getModeRules(mode)}` },
    {
      role: 'user',
      content: `学习目标：${goal}\n模式：${mode}\n请生成 Level 1 Plan Skeleton 严格 JSON。先输出 inferredDomain 和 learnerGoal，再生成课程目录、阶段目标、topics、topicDescriptions、阶段产出和 checkpoint。必须由你根据用户目标自行识别领域并设计课程，不要依赖系统预设领域，不要生成完整教材。`,
    },
  ] as const;
}

export function createRepairPlanMessages(input: { goal: string; mode: PlanMode; previousJsonText: string; failureSummary: string }) {
  return [
    { role: 'system', content: `${sharedSkeletonRules}\n${getModeRules(input.mode)}\n你现在只修复 Plan Skeleton：补齐结构、去除泛化和重复、保持短输出。不要把它扩写成教材。` },
    {
      role: 'user',
      content: `学习目标：${input.goal}\n模式：${input.mode}\n失败摘要：${input.failureSummary}\n上一版输出：\n${input.previousJsonText}\n请重写为合格的 Plan Skeleton JSON。`,
    },
  ] as const;
}
