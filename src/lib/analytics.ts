// src/lib/analytics.ts — collecte silencieuse (base légale : intérêt légitime, art. 6.1.f RGPD)
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const SESSION_KEY = 'portfolio_tracked';

// ── Détection navigateur / OS / device ──────────────────────────────────────
function parseUserAgent(ua: string) {
  let browser = 'Unknown';
  if      (ua.includes('Edg/'))                      browser = 'Edge';
  else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera';
  else if (ua.includes('Chrome'))                    browser = 'Chrome';
  else if (ua.includes('Firefox'))                   browser = 'Firefox';
  else if (ua.includes('Safari'))                    browser = 'Safari';

  let os = 'Unknown';
  if      (ua.includes('Windows'))                   os = 'Windows';
  else if (ua.includes('Android'))                   os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Mac OS'))                    os = 'macOS';
  else if (ua.includes('Linux'))                     os = 'Linux';

  const isTablet = /iPad|Tablet/i.test(ua);
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
  const device   = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

  return { browser, os, device };
}

// ── Géolocalisation approximative via IP (sans permission) ──────────────────
async function fetchGeo(): Promise<{ country: string | null; city: string | null }> {
  try {
    const res  = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(4000),
    });
    const data = await res.json();
    return {
      country: data.country_name ?? null,
      city:    data.city         ?? null,
    };
  } catch {
    return { country: null, city: null };
  }
}

// ── Point d'entrée principal ─────────────────────────────────────────────────
export async function trackVisit(): Promise<void> {
  // Une seule entrée par session de navigation
  if (sessionStorage.getItem(SESSION_KEY)) return;
  sessionStorage.setItem(SESSION_KEY, 'true');

  const { browser, os, device } = parseUserAgent(navigator.userAgent);
  const { country, city }       = await fetchGeo();

  try {
    await addDoc(collection(db, 'analytics'), {
      // Navigation
      page:     window.location.pathname,
      referrer: document.referrer || null,
      lang:     navigator.language,

      // Appareil
      browser,
      os,
      device,
      screen:   `${screen.width}×${screen.height}`,
      viewport: `${window.innerWidth}×${window.innerHeight}`,

      // Localisation approximative
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      country,
      city,

      // Horodatage
      visitedAt: serverTimestamp(),
    });
  } catch {
    // Échec silencieux
  }
}
