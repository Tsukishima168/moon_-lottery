// Cross-site attribution for gacha (月島・遊戲中心).
// Mirrors map/passport: tags GA4 events with site_id, preserves inbound utm via
// window.__GACHA_INITIAL_SEARCH__ (set by the index.html scrub before it strips
// the visible URL), and fires outbound_click (source_site/target_site) on
// navigations to the rest of the Kiwimu ecosystem.

export const SITE_ID = 'gacha' as const;
export const DEFAULT_UTM_SOURCE = 'gacha';

export type UtmParams = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

declare global {
  interface Window {
    __GACHA_INITIAL_SEARCH__?: string;
  }
}

const TARGET_SITE_BY_HOST: Record<string, string> = {
  'kiwimu.com': 'mbti_lab',
  'kiwimu-mbti.vercel.app': 'mbti_lab',
  'map.kiwimu.com': 'moon_map',
  'passport.kiwimu.com': 'passport',
  'shop.kiwimu.com': 'dessert_booking',
};

function compactUtmParams(params: UtmParams): Record<string, string> {
  const cleaned: Record<string, string> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value) cleaned[key] = value;
  });
  return cleaned;
}

export function getUtmParamsFromUrl(input?: string): UtmParams {
  if (typeof window === 'undefined') return {};
  try {
    const search = !input
      ? window.location.search
      : input.startsWith('?')
        ? input
        : new URL(input).search;
    const params = new URLSearchParams(search);
    return {
      utm_source: params.get('utm_source') || undefined,
      utm_medium: params.get('utm_medium') || undefined,
      utm_campaign: params.get('utm_campaign') || undefined,
      utm_content: params.get('utm_content') || undefined,
      utm_term: params.get('utm_term') || undefined,
    };
  } catch {
    return {};
  }
}

export function trackEvent(eventName: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined' || typeof (window as any).gtag === 'undefined') {
    return;
  }
  (window as any).gtag('event', eventName, {
    site_id: SITE_ID,
    ...params,
  });
}

export function trackUtmLanding(input?: string) {
  const initialSearch =
    input || (typeof window !== 'undefined' ? window.__GACHA_INITIAL_SEARCH__ : undefined);
  const utmParams = getUtmParamsFromUrl(initialSearch);
  if (!Object.values(utmParams).some(Boolean)) return;
  trackEvent('utm_landing', compactUtmParams(utmParams));
}

export function buildUtmUrl(
  baseUrl: string,
  options: {
    source?: string;
    medium: string;
    campaign?: string;
    content?: string;
    term?: string;
    additionalParams?: Record<string, string>;
  }
) {
  const url = new URL(baseUrl);
  url.searchParams.set('utm_source', options.source || DEFAULT_UTM_SOURCE);
  url.searchParams.set('utm_medium', options.medium);
  if (options.campaign) url.searchParams.set('utm_campaign', options.campaign);
  if (options.content) url.searchParams.set('utm_content', options.content);
  if (options.term) url.searchParams.set('utm_term', options.term);
  if (options.additionalParams) {
    Object.entries(options.additionalParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return url.toString();
}

export function trackOutboundClick(url: string, label: string, extra?: Record<string, unknown>) {
  let targetSite = 'external';
  try {
    targetSite = TARGET_SITE_BY_HOST[new URL(url).hostname] || 'external';
  } catch {
    targetSite = 'external';
  }
  trackEvent('outbound_click', {
    source_site: SITE_ID,
    target_site: targetSite,
    label,
    url,
    ...compactUtmParams(getUtmParamsFromUrl(url)),
    ...(extra || {}),
  });
}
