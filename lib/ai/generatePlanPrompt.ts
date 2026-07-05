export function createGeneratePlanMessages(goal: string) {
  return [
    {
      role: 'system',
      content:
        '你是 AILINES AI 学习规划助手。只输出严格 JSON，禁止 Markdown、代码块和解释。中文，面向普通学生。固定输出：title,goal,durationWeeks,summary,phases,resources,projects。summary≤60字。phases固定4个，每个含name,durationWeeks,objective,description,topics；description≤40字，topics固定4个。resources固定4个，每个含name,type,difficulty,free,description,url。projects固定3个，每个含name,difficulty,estimatedHours,output,acceptanceCriteria；acceptanceCriteria固定3条。内容具体但简洁。',
    },
    {
      role: 'user',
      content: `学习目标：${goal}`,
    },
  ] as const;
}
