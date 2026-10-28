import { useState, useEffect } from 'react';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import { Link } from 'react-router-dom';

export function CookieConsent() {
  const { consent, setConsent } = useCookieConsent();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slide-up animation on mount — only when consent hasn't been chosen yet
    if (consent === null) {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
  }, [consent]);

  // Already chosen — render nothing
  if (consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className={`fixed bottom-0 left-0 right-0 z-toast transition-transform duration-long ease-out motion-reduce:transition-none ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            This site uses cookies for ads and analytics. See our{' '}
            <Link
              to="/privacy"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>{' '}
            for details.
          </p>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setConsent(false)}
              className="btn"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={() => setConsent(true)}
              className="btn btn--primary"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CookieConsent;
