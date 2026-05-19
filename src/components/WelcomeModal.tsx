import { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

const i18n = {
  fr: {
    title:       'Bienvenue sur mon portfolio ! 👋',
    body:        "Pour me permettre d'en savoir un peu plus sur mes visiteurs, n'hésitez pas à me laisser votre nom ou celui de votre entreprise. C'est totalement optionnel.",
    nameLabel:   'Nom complet',
    namePh:      'Ex: Jean Dupont',
    companyLabel:'Entreprise',
    companyPh:   'Ex: Google',
    optional:    'Optionnel',
    dontShow:    'Ne plus afficher ce message',
    skip:        'Passer',
    enter:       'Entrer',
    sending:     'Envoi…',
    legal:       'En poursuivant sur ce site, vous acceptez nos',
    legalLink:   'mentions légales',
    legalHref:   '/fr/mentions-legales',
    legalSuffix: 'relatives aux données.',
  },
  en: {
    title:       'Welcome to my portfolio! 👋',
    body:        "To help me learn a bit more about my visitors, feel free to leave your name or company. It's completely optional.",
    nameLabel:   'Full name',
    namePh:      'E.g. John Smith',
    companyLabel:'Company',
    companyPh:   'E.g. Google',
    optional:    'Optional',
    dontShow:    "Don't show this again",
    skip:        'Skip',
    enter:       'Enter',
    sending:     'Sending…',
    legal:       'By continuing on this website, you agree to our',
    legalLink:   'legal notice',
    legalHref:   '/en/mentions-legales',
    legalSuffix: 'regarding personal data.',
  },
};

const FOCUSABLE = 'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])';

export default function WelcomeModal({ lang = 'fr' }) {
  const t = i18n[lang] ?? i18n.fr;
  const [isOpen, setIsOpen]          = useState(false);
  const [dontShowAgain, setDontShow] = useState(false);
  const [name, setName]              = useState('');
  const [company, setCompany]        = useState('');
  const [sending, setSending]        = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isLegalPage = window.location.pathname.includes('mentions-legales');
    const hasVisitedLocal   = localStorage.getItem('portfolio_visited');
    const hasVisitedSession = sessionStorage.getItem('portfolio_hidden_session');
    if (!isLegalPage && !hasVisitedLocal && !hasVisitedSession) setIsOpen(true);
  }, []);

  // Focus trap + Escape key
  useEffect(() => {
    if (!isOpen) return;
    const panel = panelRef.current;
    if (!panel) return;

    // Focus first element on open
    const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
    focusable[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close(false);
        return;
      }
      if (e.key !== 'Tab' || focusable.length === 0) return;

      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    panel.addEventListener('keydown', handleKeyDown);
    return () => panel.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const sendToFirestore = async () => {
    if (!name.trim() && !company.trim()) return;
    try {
      const oneYearFromNow = Timestamp.fromDate(
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      );
      await addDoc(collection(db, 'visitors'), {
        name:      name.trim()    || '—',
        company:   company.trim() || '—',
        page:      window.location.pathname,
        createdAt: serverTimestamp(),
        expiresAt: oneYearFromNow,
      });
    } catch {
      // silent fail
    }
  };

  const close = async (isSubmit = false) => {
    if (isSubmit || dontShowAgain) {
      localStorage.setItem('portfolio_visited', 'true');
    } else {
      sessionStorage.setItem('portfolio_hidden_session', 'true');
    }

    if (isSubmit) {
      setSending(true);
      await sendToFirestore();
      setSending(false);
    }

    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm"
      aria-hidden="false"
      onClick={(e) => { if (e.target === e.currentTarget) close(false); }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl p-5 sm:p-8 max-w-md w-full shadow-[0_0_40px_rgba(59,130,246,0.15)] relative animate-fade-in-up"
      >

        <h2 id="modal-title" className="text-xl sm:text-2xl font-bold text-slate-100 mb-1 sm:mb-2">
          {t.title}
        </h2>
        <p className="text-slate-400 text-sm mb-4 sm:mb-6 leading-relaxed">
          {t.body}
        </p>

        <form className="space-y-3 sm:space-y-4" onSubmit={(e) => { e.preventDefault(); close(true); }}>
          <div>
            <label htmlFor="modal-name" className="block text-sm font-medium text-slate-300 mb-1">
              {t.nameLabel} <span className="text-slate-600">({t.optional})</span>
            </label>
            <input
              type="text"
              id="modal-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              placeholder={t.namePh}
            />
          </div>

          <div>
            <label htmlFor="modal-company" className="block text-sm font-medium text-slate-300 mb-1">
              {t.companyLabel} <span className="text-slate-600">({t.optional})</span>
            </label>
            <input
              type="text"
              id="modal-company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              placeholder={t.companyPh}
            />
          </div>

          <div className="flex items-center pt-1">
            <input
              type="checkbox"
              id="modal-dontShow"
              checked={dontShowAgain}
              onChange={(e) => setDontShow(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-700 rounded focus:ring-blue-500 focus:ring-offset-slate-900 focus:ring-2 cursor-pointer transition-colors"
            />
            <label htmlFor="modal-dontShow" className="ml-2 text-sm text-slate-400 cursor-pointer select-none hover:text-slate-300 transition-colors">
              {t.dontShow}
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => close(false)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-lg transition-colors font-medium"
            >
              {t.skip}
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-70 text-white px-4 py-2.5 rounded-lg transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] font-medium flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <svg aria-hidden="true" className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  {t.sending}
                </>
              ) : t.enter}
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-slate-500 mt-4 sm:mt-6">
          {t.legal}{' '}
          <a href={t.legalHref} className="text-blue-400 hover:underline">
            {t.legalLink}
          </a>{' '}
          {t.legalSuffix}
        </p>
      </div>
    </div>
  );
}
