import { appTheme } from '@/constants/app-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useAppTheme() {
  const colorScheme = useColorScheme() ?? 'light';

  return {
    colorScheme,
    colors: appTheme[colorScheme],
  };
}
