/**
 * Cloudflare Pages Function: API Edge Reverse Proxy
 * Proxies all /api/* requests from the Cloudflare Pages domain (*.pages.dev)
 * to the persistent Node.js backend runtime (Render, Railway, Fly.io, or GCP/AWS).
 * 
 * Preserves raw request bodies, webhook headers (x-webhook-signature, x-webhook-timestamp),
 * query parameters, and authentication tokens.
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

  // Resolve backend upstream service URL
  const backendBaseUrl = (
    env.BACKEND_SERVICE_URL ||
    env.APP_BASE_URL ||
    'http://localhost:3000'
  ).replace(/\/+$/, '');

  const url = new URL(request.url);
  const targetUrl = `${backendBaseUrl}${url.pathname}${url.search}`;

  // Clone headers and preserve client IP & host
  const forwardHeaders = new Headers(request.headers);
  forwardHeaders.set('x-forwarded-host', url.host);
  forwardHeaders.set('x-forwarded-proto', url.protocol.replace(':', ''));

  // Forward request to backend service
  const requestInit: RequestInit = {
    method: request.method,
    headers: forwardHeaders,
    redirect: 'manual'
  };

  // Pass body for non-GET/HEAD methods
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    requestInit.body = await request.arrayBuffer();
  }

  try {
    const backendResponse = await fetch(targetUrl, requestInit);

    // Return backend response with CORS headers
    const responseHeaders = new Headers(backendResponse.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-webhook-signature, x-webhook-timestamp, x-admin-auth');

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: 'UPSTREAM_GATEWAY_ERROR',
        message: 'Could not connect to Qorbiq AI backend service. Please check BACKEND_SERVICE_URL configuration.',
        details: err.message
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
};
