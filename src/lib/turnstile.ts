/**
 * Cloudflare Turnstile 验证
 * 在Worker端验证Turnstile Token
 */
export async function verifyTurnstile(
  token: string,
  secret: string,
  remoteIp?: string
): Promise<{ success: boolean; error?: string }> {
  const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

  const body = new URLSearchParams({
    secret,
    response: token,
  });

  if (remoteIp) {
    body.append('remoteip', remoteIp);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const data = await response.json() as {
    success: boolean;
    'error-codes'?: string[];
    challenge_ts?: string;
    hostname?: string;
  };

  if (!data.success) {
    console.error('Turnstile verification failed:', data['error-codes']);
    return {
      success: false,
      error: data['error-codes']?.join(', ') || 'Verification failed',
    };
  }

  return { success: true };
}
