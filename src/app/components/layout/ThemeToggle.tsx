import { Moon, Sun } from 'lucide-react';
import { Button } from '../ui/button';
import { useTheme } from '@/core/hooks/use-theme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return <Button variant="ghost" size="icon-sm" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} onClick={toggleTheme}>{theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button>;
}
