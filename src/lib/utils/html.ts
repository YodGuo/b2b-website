/**
 * HTML 实体转义工具
 * 防止 XSS 注入（邮件模板、HTML 输出）
 */

/**
 * 转义 HTML 特殊字符
 * & → &amp;  < → &lt;  > → &gt;  " → &quot;  ' → &#039;
 */
export function escapeHtml(s: string): string {
  if (!s) return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 转义 HTML 属性值（仅转义 " 和 &）
 */
export function escapeAttr(s: string): string {
  if (!s) return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');
}
