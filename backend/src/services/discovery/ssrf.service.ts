import dns from 'dns/promises';
import net from 'net';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata',
  '169.254.169.254',
  '0.0.0.0',
  '::1',
]);

const ALLOWED_PORTS = new Set(['', '80', '443', '8080', '8443']);

function ipv4ToInt(ip: string): number {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) >>> 0) + ((parts[1] << 16) >>> 0) + ((parts[2] << 8) >>> 0) + parts[3];
}

function inCidr4(ip: string, base: string, maskBits: number): boolean {
  const mask = maskBits === 0 ? 0 : (~0 << (32 - maskBits)) >>> 0;
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(base) & mask);
}

/**
 * Checks whether an IPv4 or IPv6 address belongs to a private, loopback,
 * link-local, multicast, or cloud-metadata range.
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  const normalized = ip.replace(/^::ffff:/i, '');
  const version = net.isIP(normalized);
  if (version === 4) {
    return (
      inCidr4(normalized, '0.0.0.0', 8) ||
      inCidr4(normalized, '10.0.0.0', 8) ||
      inCidr4(normalized, '100.64.0.0', 10) ||
      inCidr4(normalized, '127.0.0.0', 8) ||
      inCidr4(normalized, '169.254.0.0', 16) ||
      inCidr4(normalized, '172.16.0.0', 12) ||
      inCidr4(normalized, '192.0.0.0', 24) ||
      inCidr4(normalized, '192.0.2.0', 24) ||
      inCidr4(normalized, '192.168.0.0', 16) ||
      inCidr4(normalized, '198.18.0.0', 15) ||
      inCidr4(normalized, '198.51.100.0', 24) ||
      inCidr4(normalized, '203.0.113.0', 24) ||
      inCidr4(normalized, '224.0.0.0', 4) ||
      inCidr4(normalized, '240.0.0.0', 4)
    );
  }
  if (version === 6) {
    const lower = normalized.toLowerCase();
    if (lower === '::' || lower === '::1') return true;
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // ULA fc00::/7
    if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) {
      return true; // Link-local fe80::/10
    }
    if (lower.startsWith('ff')) return true; // Multicast
    return false;
  }
  return true;
}

/**
 * Validates that a URL is safe for server-side outbound fetching (SSRF protection).
 * Re-validates protocol, credentials, port, hostname, and DNS-resolved IP addresses.
 */
export async function validateExternalUrl(
  rawUrl: string,
  options: { allowLocalInTest?: boolean } = {}
): Promise<{ url: URL; resolvedIps: string[] }> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new ApiError(400, 'Invalid URL format');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new ApiError(400, 'Only HTTP and HTTPS URLs are allowed');
  }

  if (parsed.username || parsed.password) {
    throw new ApiError(400, 'URLs containing embedded credentials are not allowed');
  }

  const allowTestLocal =
    options.allowLocalInTest !== false &&
    env.nodeEnv === 'test' &&
    env.discovery.allowLocalTestUrls;

  if (!allowTestLocal && !ALLOWED_PORTS.has(parsed.port)) {
    throw new ApiError(400, `Port ${parsed.port} is not permitted for outbound crawling`);
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!hostname) {
    throw new ApiError(400, 'URL hostname is missing');
  }

  if (!allowTestLocal && (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal'))) {
    throw new ApiError(400, 'Access to internal or loopback hostnames is blocked');
  }

  if (net.isIP(hostname)) {
    if (!allowTestLocal && isPrivateOrReservedIp(hostname)) {
      throw new ApiError(400, 'Access to private or reserved IP addresses is blocked');
    }
    return { url: parsed, resolvedIps: [hostname] };
  }

  try {
    const records = await dns.lookup(hostname, { all: true });
    if (!records.length) {
      throw new ApiError(400, `Could not resolve hostname: ${hostname}`);
    }
    const ips = records.map((r) => r.address);
    if (!allowTestLocal) {
      for (const ip of ips) {
        if (isPrivateOrReservedIp(ip)) {
          throw new ApiError(400, 'URL resolves to a private or restricted network address');
        }
      }
    }
    return { url: parsed, resolvedIps: ips };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(400, `DNS resolution failed for ${hostname}`);
  }
}

