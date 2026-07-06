import type { LearningDomain } from '@/lib/learningDomain';
import type { ResourceDifficulty, ResourceLanguage, ResourceType, SearchResource } from '@/lib/search/resourceTypes';

type TavilyLikeResult = {
  title?: unknown;
  url?: unknown;
  content?: unknown;
  score?: unknown;
};

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function inferSource(url: string, title: string) {
  const hostname = getHostname(url);

  if (hostname.includes('khanacademy')) return 'Khan Academy';
  if (hostname.includes('3blue1brown')) return '3Blue1Brown';
  if (hostname.includes('bilibili')) return 'Bilibili';
  if (hostname.includes('youtube')) return 'YouTube';
  if (hostname.includes('github')) return 'GitHub';
  if (hostname.includes('developer.mozilla')) return 'MDN';
  if (hostname.includes('docs.python')) return 'Python Docs';
  if (hostname.includes('react.dev')) return 'React';
  if (hostname.includes('microsoft')) return 'Microsoft';
  if (hostname.includes('coursera')) return 'Coursera';
  if (hostname.includes('edx')) return 'edX';
  if (hostname.includes('udemy')) return 'Udemy';

  return hostname || title.split(/[｜|-]/)[0].trim() || '未知来源';
}

function inferType(url: string, title: string, description: string): ResourceType {
  const hostname = getHostname(url);
  const text = `${url} ${title} ${description}`.toLowerCase();

  if (hostname === 'github.com') return '开源项目';
  if (/(docs\.|documentation|official|官方|developer\.mozilla|learn\.microsoft|react\.dev|docs\.python)/i.test(text)) return '官方文档';
  if (/(youtube\.com|youtu\.be|bilibili\.com|视频|video)/i.test(text)) return '视频教程';
  if (/(coursera|edx|udemy|khanacademy|khan academy|课程|course|class)/i.test(text)) return '在线课程';
  if (/(练习|习题|题库|practice|exercise|exercises|quiz|problem set)/i.test(text)) return '练习题库';
  if (/(项目|project|实战|hands-on|case study)/i.test(text)) return '项目实战';
  if (/(tool|工具|environment|环境|download|下载)/i.test(text)) return '工具环境';
  if (/(community|forum|论坛|社区|stackoverflow|reddit|discuss)/i.test(text)) return '社区资源';

  return '图文教程';
}

function inferDifficulty(title: string, description: string): ResourceDifficulty {
  const text = `${title} ${description}`.toLowerCase();

  if (/(advanced|进阶|高级|深入|master|expert)/i.test(text)) return '进阶';
  if (/(intermediate|中级|综合|实战|project|项目)/i.test(text)) return '中级';
  return '入门';
}

function inferLanguage(title: string, description: string): ResourceLanguage {
  const text = `${title} ${description}`;
  const chineseChars = text.match(/[\u4e00-\u9fff]/g)?.length || 0;
  const latinChars = text.match(/[a-z]/gi)?.length || 0;

  if (chineseChars >= 4) return '中文';
  if (latinChars > 0) return '英文';
  return '其他';
}

function inferFree(url: string, title: string, description: string) {
  const text = `${url} ${title} ${description}`.toLowerCase();

  if (/(udemy|coursera)/i.test(text) && !/(free|免费)/i.test(text)) return false;
  return true;
}

function clampScore(value: unknown) {
  const numeric = typeof value === 'number' ? value : Number(value);

  if (!Number.isFinite(numeric)) return 70;
  if (numeric <= 1) return Math.max(1, Math.min(100, Math.round(numeric * 100)));
  return Math.max(1, Math.min(100, Math.round(numeric)));
}

function buildReason(domain: LearningDomain, type: ResourceType, title: string) {
  if (domain === 'math') {
    if (type === '在线课程') return '适合作为数学概念入门和系统练习资源。';
    if (type === '视频教程') return '适合用可视化讲解理解数学概念。';
    if (type === '练习题库') return '适合用于巩固公式、题型和解题方法。';
    return '适合作为数学学习的补充参考资料。';
  }

  if (domain === 'programming') {
    if (type === '官方文档') return '适合作为编程学习的权威参考。';
    if (type === '开源项目') return '适合通过真实代码和项目结构学习实践。';
    if (type === '项目实战') return '适合把编程知识转化为可运行成果。';
    return '适合作为编程入门或进阶学习资源。';
  }

  if (domain === 'office') return '适合提升办公场景中的实际操作能力。';
  if (domain === 'language') return '适合围绕词汇、语法、听说读写进行练习。';
  if (domain === 'design') return '适合通过案例和练习提升设计能力。';

  return `适合作为「${title}」相关学习资源。`;
}

export function normalizeResource(result: TavilyLikeResult, domain: LearningDomain): SearchResource | null {
  const title = typeof result.title === 'string' ? result.title.trim() : '';
  const url = typeof result.url === 'string' ? result.url.trim() : '';
  const description = typeof result.content === 'string' ? result.content.trim() : '';

  if (!title || !url) {
    return null;
  }

  const type = inferType(url, title, description);

  return {
    title,
    url,
    source: inferSource(url, title),
    type,
    difficulty: inferDifficulty(title, description),
    language: inferLanguage(title, description),
    free: inferFree(url, title, description),
    description: description || title,
    reason: buildReason(domain, type, title),
    score: clampScore(result.score),
  };
}
