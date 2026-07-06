export type LearningDomain = 'programming' | 'math' | 'language' | 'office' | 'design' | 'ai' | 'general';

export function detectLearningDomain(goal: string): LearningDomain {
  const text = goal.trim().toLowerCase();

  if (!text) {
    return 'general';
  }

  if (/(数学|三角函数|代数|几何|微积分|概率|统计|线性代数|高等数学|导数|积分|方程|不等式)/i.test(text)) {
    return 'math';
  }

  if (/(人工智能|机器学习|深度学习|大模型|llm|神经网络|ai模型|ai 应用|ai应用)/i.test(text)) {
    return 'ai';
  }

  if (/(python|javascript|typescript|react|vue|node|前端|后端|编程|代码|java|rust|golang|\bgo\b|c\+\+|c#|算法|数据库|sql)/i.test(text)) {
    return 'programming';
  }

  if (/(excel|ppt|word|office|办公|表格|数据透视表|powerpoint|power query)/i.test(text)) {
    return 'office';
  }

  if (/(photoshop|\bps\b|figma|ui|ux|设计|剪辑|摄影|插画|排版|海报|视频)/i.test(text)) {
    return 'design';
  }

  if (/(英语|日语|韩语|法语|德语|西班牙语|口语|雅思|托福|单词|语法|听力|阅读|写作|外语)/i.test(text)) {
    return 'language';
  }

  return 'general';
}
