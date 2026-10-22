/**
 * Cloudflare Pages Function: Dynamic QR Redirect Proxy
 * Proxies dynamic QR scan routes (/r/*) to the persistent Node.js backend.
 */

interface Env {
  BACKEND_SERVICE_URL?: string;
  APP_BASE_URL?: string;
}

type PagesFunction<T = any> = (context: {
  request: Request;
  env: T;
  params: Record<string, string | string[]>;
  next?: () => Promise<Response>;
}) => Promise<Response>;

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const backendBaseUrl = (
    env.BACKEND_SERVICE_URL ||
    env.APP_BASE_URL ||
    'http://localhost:3000'
  ).replace(/\/+$/, '');

  const url = new URL(request.url);
  const targetUrl = `${backendBaseUrl}${url.pathname}${url.search}`;

  const forwardHeaders = new Headers(request.headers);
  forwardHeaders.set('x-forwarded-host', url.host);

  try {
    const backendResponse = await fetch(targetUrl, {
      method: request.method,
      headers: forwardHeaders,
      redirect: 'manual'
    });

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: backendResponse.headers
    });
  } catch (err: any) {
    return new Response(
      `QR service temporarily unavailable. Details: ${err.message}`,
      { status: 502, headers: { 'Content-Type': 'text/plain' } }
    );
  }
};
