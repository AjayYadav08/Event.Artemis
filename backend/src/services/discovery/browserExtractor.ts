import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import { validateExternalUrl } from './ssrf.service';

export interface BrowserRenderResult {
  html: string;
  finalUrl: string;
  warnings: string[];
}

/**
 * Checks whether static HTML looks like an unhydrated JS SPA shell
 * that requires Playwright dynamic rendering.
 */
export function needsDynamicBrowserRendering(html: string, extractedTextLen: number): boolean {
  if (extractedTextLen >= 220) return false;
  const lower = html.toLowerCase();
  const hasAppShell =
    lower.includes('id="root"') ||
    lower.includes("id='root'") ||
    lower.includes('id="__next"') ||
    lower.includes('id="app"') ||
    lower.includes('enable javascript');
  return hasAppShell || extractedTextLen < 80;
}

/**
 * Method 3: Isolated Playwright browser extraction with SSRF interception,
 * disabled permissions, strict timeout, and guaranteed cleanup.
 */
export async function renderWithPlaywright(targetUrl: string): Promise<BrowserRenderResult> {
  if (!env.discovery.enablePlaywright) {
    throw new ApiError(422, 'Dynamic browser rendering is disabled (ENABLE_PLAYWRIGHT=false)');
  }

  await validateExternalUrl(targetUrl);

  let playwrightMod: any;
  try {
    // Dynamic import so deployments without Playwright binaries don't fail on startup
    playwrightMod = await Function('return import("playwright")')();
  } catch {
    throw new ApiError(501, 'Playwright package or browser binary is not installed in this environment');
  }

  const timeoutMs = env.discovery.browserTimeoutMs;
  const browser = await playwrightMod.chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const context = await browser.newContext({
      userAgent: env.discovery.userAgent,
      permissions: [],
      javaScriptEnabled: true,
      bypassCSP: false,
    });

    const page = await context.newPage();
    page.setDefaultTimeout(timeoutMs);

    // Intercept outbound requests to prevent SSRF / local file / internal network access
    await page.route('**/*', async (route: any) => {
      const reqUrl = route.request().url();
      const resourceType = route.request().resourceType();

      if (resourceType === 'media' || resourceType === 'font') {
        return route.abort();
      }
      if (!reqUrl.startsWith('http://') && !reqUrl.startsWith('https://')) {
        return route.abort();
      }
      try {
        await validateExternalUrl(reqUrl);
        return route.continue();
      } catch {
        return route.abort();
      }
    });

    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: timeoutMs });
    await page.waitForTimeout(800);

    const html = await page.content();
    const finalUrl = page.url();

    await context.close();
    return { html, finalUrl, warnings: [] };
  } finally {
    await browser.close().catch(() => {});
  }
}

