'use client';

// 保留这个薄客户端组件文件，供未来做渐进增强；当前 /ask 主流程已改为服务端渲染，
// 不再依赖 useEffect、onClick 或 fetch('/api/ask') 才能显示答案。
export function AskClient() {
  return null;
}
