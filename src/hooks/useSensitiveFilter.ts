import { useState, useEffect, useMemo } from 'react';
import { SensitiveFilter, type DetectionResult } from '@/lib/chat/sensitive-filter';

const WORDS_URL = '/data/sensitive-words.json';

interface UseSensitiveFilterResult {
  isLoading: boolean;
  error: string | null;
  detect: (text: string) => DetectionResult;
  sanitize: (text: string) => string;
  contains: (text: string) => boolean;
}

export function useSensitiveFilter(): UseSensitiveFilterResult {
  const [filter, setFilter] = useState<SensitiveFilter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    SensitiveFilter.load(WORDS_URL)
      .then(f => {
        if (mounted) {
          setFilter(f);
          setIsLoading(false);
        }
      })
      .catch(err => {
        if (mounted) {
          setError(err.message);
          setFilter(new SensitiveFilter());
          setIsLoading(false);
        }
      });

    return () => { mounted = false; };
  }, []);

  return useMemo(() => ({
    isLoading,
    error,
    detect: (text: string) => filter?.detect(text) ?? { contains: false, words: [], positions: [] },
    sanitize: (text: string) => filter?.sanitize(text) ?? text,
    contains: (text: string) => filter?.contains(text) ?? false,
  }), [filter, isLoading, error]);
}
