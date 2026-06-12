/** Detect BFF/LLM service failure text masquerading as assistant content. */
export function isLLMServiceError(content: string | undefined): boolean {
  if (!content) return false;
  return (
    content.includes('响应超时') ||
    content.includes('服务暂时不可用') ||
    content.includes('服务认证失败') ||
    content.includes('请求过多')
  );
}
