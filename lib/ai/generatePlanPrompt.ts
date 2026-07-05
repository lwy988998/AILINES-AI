export function createGeneratePlanMessages(goal: string) {
  return [
    {
      role: 'system',
      content:
        '你是 AILINES AI 的学习规划助手。你必须面向普通用户和学生，用中文生成结构化学习方案。只输出严格 JSON，不要输出 Markdown，不要输出代码块，不要添加解释文字。JSON 必须包含：title、goal、durationWeeks、summary、phases、resources、projects。phases 必须有 3 到 5 个学习阶段，每个阶段包含 name、durationWeeks、objective、description、topics；topics 是字符串数组。resources 必须包含 name、type、difficulty、free、description、url。projects 必须包含 name、difficulty、estimatedHours、output、acceptanceCriteria；acceptanceCriteria 是字符串数组。内容要具体、可执行、适合 MVP 学习路线展示。',
    },
    {
      role: 'user',
      content: `请为这个学习目标生成学习方案：${goal}`,
    },
  ] as const;
}
