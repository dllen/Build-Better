import { createContext, useContext, useState, useCallback } from 'react';

const STORAGE_KEY = 'cookie-consent';

interface CookieConsentContextType {
  /** null = not yet chosen, true = accepted, false = rejected */
  consent: boolean | null;
  setConsent: (accepted: boolean) => void;
}

const CookieConsentContext = createContext<CookieConsentContextType>({
  consent: null,
  setConsent: () => {},
});

function getStoredConsent(): boolean | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
    return null;
  } catch {
    return null;
  }
}

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsentState] = useState<boolean | null>(getStoredConsent);

  const setConsent = useCallback((accepted: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(accepted));
    } catch {
      // localStorage unavailable (private browsing, etc.)
    }
    setConsentState(accepted);
  }, []);

  return (
    <CookieConsentContext.Provider value={{ consent, setConsent }}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  return useContext(CookieConsentContext);
}