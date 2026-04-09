import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

export function useResponsive() {
  const { width } = useWindowDimensions();

  return useMemo(() => {
    const isTablet = width >= 768;
    const isDesktop = width >= 1100;

    return {
      width,
      isTablet,
      isDesktop,
      contentMaxWidth: isDesktop ? 1280 : isTablet ? 920 : 680,
      columns: isDesktop ? 2 : 1,
      gutter: isDesktop ? 28 : isTablet ? 22 : 16,
    };
  }, [width]);
}
