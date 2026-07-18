export type CourseContentSource = 'ai' | 'ai-derived' | 'legacy-ai' | 'domain-fallback' | 'template' | 'invalid';

export type SourceSummary = Record<CourseContentSource, number>;

export const COURSE_CONTENT_SOURCE_FIELD = '__courseContentSource';

type SourceTagged = {
  [COURSE_CONTENT_SOURCE_FIELD]?: CourseContentSource;
};

export function markCourseContentSource<T extends object>(value: T, source: CourseContentSource): T & SourceTagged {
  const seen = new WeakSet<object>();

  function mark(item: unknown) {
    if (!item || typeof item !== 'object' || seen.has(item)) return;
    seen.add(item);
    Object.defineProperty(item, COURSE_CONTENT_SOURCE_FIELD, {
      value: source,
      enumerable: false,
      configurable: true,
    });
    if (Array.isArray(item)) {
      item.forEach(mark);
      return;
    }
    Object.values(item as Record<string, unknown>).forEach(mark);
  }

  mark(value);
  return value as T & SourceTagged;
}

export function getCourseContentSource(value: unknown): CourseContentSource | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const source = (value as SourceTagged)[COURSE_CONTENT_SOURCE_FIELD];
  return source;
}

export function summarizeCourseContentSources(value: unknown): SourceSummary {
  const summary: SourceSummary = {
    ai: 0,
    'ai-derived': 0,
    'legacy-ai': 0,
    'domain-fallback': 0,
    template: 0,
    invalid: 0,
  };

  function visit(item: unknown) {
    if (!item || typeof item !== 'object') return;
    const source = getCourseContentSource(item);
    if (source) summary[source] += 1;
    if (Array.isArray(item)) {
      item.forEach(visit);
      return;
    }
    Object.values(item as Record<string, unknown>).forEach(visit);
  }

  visit(value);
  return summary;
}

export function isUnsafeVisibleSource(source: CourseContentSource | undefined) {
  return source === 'domain-fallback' || source === 'template' || source === 'invalid';
}
