import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export const useUtmParams = () => {
  const { search } = useLocation();

  return useMemo(() => {
    const params = new URLSearchParams(search);
    return {
      utm_source: params.get('utm_source'),
      utm_campaign: params.get('utm_campaign'),
      utm_medium: params.get('utm_medium'),
      utm_content: params.get('utm_content'),
      click_id: params.get('click_id'),
    };
  }, [search]);
};
