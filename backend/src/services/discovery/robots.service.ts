import { safeFetch } from './safeFetch';

interface RobotsRules {
  disallow: string[];
  allow: string[];
  fetchedAt: number;
}

const CACHE_TTL_MS = 15 * 60 * 1000;
const robotsCache = new Map<string, RobotsRules>();

function parseRobotsTxt(content: string): RobotsRules {
  const lines = content.split(/\r?\n/);
  let currentAgentMatches = false;
  let wildcardDisallow: string[] = [];
  let wildcardAllow: string[] = [];
  let botDisallow: string[] = [];
  let botAllow: string[] = [];
  let activeSection: 'none' | 'wildcard' | 'bot' = 'none';

  for (const rawLine of lines) {
    const line = rawLine.split('#')[0].trim();
    if (!line) continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim().toLowerCase();
    const val = line.slice(colonIdx + 1).trim();

    if (key === 'user-agent') {
      const agent = val.toLowerCase();
      if (agent === 'eventartemisbot') {
        activeSection = 'bot';
        currentAgentMatches = true;
      } else if (agent === '*') {
        activeSection = 'wildcard';
        currentAgentMatches = true;
      } else {
        activeSection = 'none';
        currentAgentMatches = false;
      }
      continue;
    }

    if (!currentAgentMatches) continue;

    if (key === 'disallow' && val) {
      if (activeSection === 'bot') botDisallow.push(val);
      else if (activeSection === 'wildcard') wildcardDisallow.push(val);
    } else if (key === 'allow' && val) {
      if (activeSection === 'bot') botAllow.push(val);
      else if (activeSection === 'wildcard') wildcardAllow.push(val);
    }
  }

  const useBot = botDisallow.length > 0 || botAllow.length > 0;
  return {
    disallow: useBot ? botDisallow : wildcardDisallow,
    allow: useBot ? botAllow : wildcardAllow,
    fetchedAt: Date.now(),
  };
}

function pathMatchesRule(pathWithQuery: string, rule: string): boolean {
  if (!rule) return false;
  if (rule === '/') return true;
  if (rule.includes('*')) {
    const escaped = rule.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp(`^${escaped}`).test(pathWithQuery);
  }
  return pathWithQuery.startsWith(rule);
}

/**
 * Checks whether the target URL is permitted by the origin's robots.txt.
 * Returns true if robots.txt is missing (404) or allows the path; returns false if explicitly disallowed.
 */
export async function isUrlAllowedByRobots(targetUrl: string): Promise<boolean> {
  try {
    const parsed = new URL(targetUrl);
    const origin = parsed.origin;
    const cached = robotsCache.get(origin);
    let rules: RobotsRules;

    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      rules = cached;
    } else {
      try {
        const res = await safeFetch(`${origin}/robots.txt`, {
          maxBytes: 256 * 1024,
          timeoutMs: 5000,
          accept: 'text/plain,*/*',
        });
        rules = parseRobotsTxt(res.text);
      } catch {
        rules = { disallow: [], allow: [], fetchedAt: Date.now() };
      }
      robotsCache.set(origin, rules);
    }

    const pathWithQuery = `${parsed.pathname}${parsed.search}`;
    let longestAllow = -1;
    let longestDisallow = -1;

    for (const rule of rules.allow) {
      if (pathMatchesRule(pathWithQuery, rule)) {
        longestAllow = Math.max(longestAllow, rule.length);
      }
    }
    for (const rule of rules.disallow) {
      if (pathMatchesRule(pathWithQuery, rule)) {
        longestDisallow = Math.max(longestDisallow, rule.length);
      }
    }

    if (longestDisallow === -1) return true;
    return longestAllow >= longestDisallow;
  } catch {
    return true;
  }
}

