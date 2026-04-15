import { useEffect, useRef } from 'react';

interface TurnstileProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  language?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

export function TurnstileWidget({
  siteKey,
  onVerify,
  onError,
  theme = 'auto',
  size = 'normal',
  language = 'zh-cn',
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    // 加载Turnstile脚本
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    // 渲染Turnstile
    const renderWidget = () => {
      if (window.turnstile && containerRef.current) {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme,
          size,
          language,
          callback: (token: string) => {
            onVerify(token);
          },
          'error-callback': () => {
            onError?.('Turnstile加载失败');
          },
          'expired-callback': () => {
            // Token过期，重置
            if (widgetIdRef.current) {
              window.turnstile?.reset(widgetIdRef.current);
            }
          },
        });
      }
    };

    // 等待脚本加载完成
    if (window.turnstile) {
      renderWidget();
    } else {
      window.onloadTurnstileCallback = renderWidget;
    }

    return () => {
      // 清理
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [siteKey, theme, size, language, onVerify, onError]);

  return (
    <div ref={containerRef} className="flex justify-center">
      {/* Turnstile widget will be rendered here */}
      <noscript>
        <div style={{ padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px', textAlign: 'center' }}>
          请启用JavaScript以完成人机验证
        </div>
      </noscript>
    </div>
  );
}
