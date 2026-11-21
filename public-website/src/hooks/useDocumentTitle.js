import { useEffect } from 'react';

/**
 * Custom hook to update document title per route
 * @param {string} title 
 */
export function useDocumentTitle(title) {
  useEffect(() => {
    const baseTitle = 'GaunPulse — The Village That Speaks';
    document.title = title ? `${title} | ${baseTitle}` : baseTitle;
  }, [title]);
}
