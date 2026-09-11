export default {
  async fetch(request, env) {
    const expected = env.FRAME_TOKEN;

    // Se il secret non è configurato, non bloccare nulla
    if (!expected) {
      return env.ASSETS.fetch(request);
    }

    const url = new URL(request.url);
    const COOKIE_NAME = 'frame_auth';

    // Caso 1: token corretto nella query string -> autorizza e imposta il cookie
    if (url.searchParams.get('k') === expected) {
      const response = await env.ASSETS.fetch(request);
      const authorized = new Response(response.body, response);
      authorized.headers.append(
        'Set-Cookie',
        COOKIE_NAME + '=' + expected +
        '; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax'
      );
      return authorized;
    }

    // Caso 2: cookie già presente e valido
    const cookies = request.headers.get('Cookie') || '';
    const found = cookies.match(/(?:^|;\s*)frame_auth=([^;]+)/);
    if (found && found[1] === expected) {
      return env.ASSETS.fetch(request);
    }

    // Caso 3: nessuna credenziale valida
    return new Response('Not found', { status: 404 });
  }
};