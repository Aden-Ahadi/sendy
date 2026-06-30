import { Moon, Sun } from '@phosphor-icons/react';
import { useTheme } from '../lib/useTheme';
import { cn } from '@/lib/utils';

export function ThemeToggle({ inverted = false, className }) {
  const { isDark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'fixed top-4 right-4 z-40 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-150',
        className,
        inverted
          ? 'bg-white/[0.07] hover:bg-white/[0.13] text-[rgba(252,252,252,0.45)] hover:text-white'
          : 'bg-[rgba(32,32,32,0.07)] dark:bg-[rgba(255,250,240,0.07)] hover:bg-[rgba(32,32,32,0.12)] dark:hover:bg-[rgba(255,250,240,0.13)] text-[#505050] dark:text-[#a8a49f] hover:text-[#202020] dark:hover:text-[#edeae4]'
      )}
    >
      {isDark ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}
