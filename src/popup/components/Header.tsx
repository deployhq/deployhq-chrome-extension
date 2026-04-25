import type { AppView } from '@/shared/types';
import { getCredentials } from '@/shared/storage';

interface HeaderProps {
  view: AppView;
  onNavigate: (view: AppView) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export default function Header({ view, onNavigate, isDark, onToggleTheme }: HeaderProps) {
  const showBack = view.type !== 'dashboard';

  const handleBack = () => {
    if (view.type === 'deploy') {
      onNavigate({ type: 'project', permalink: view.permalink });
    } else {
      onNavigate({ type: 'dashboard' });
    }
  };

  const openAccount = async () => {
    const creds = await getCredentials();
    if (creds) {
      chrome.tabs.create({
        url: `https://${creds.accountSubdomain}.deployhq.com`,
      });
    }
  };

  return (
    <header className="bg-deployhq-900 dark:bg-gray-800 text-white px-4 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2">
        {showBack && (
          <button
            onClick={handleBack}
            className="p-1 hover:bg-deployhq-800 dark:hover:bg-gray-700 rounded transition-colors"
            aria-label="Go back"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <button
          onClick={openAccount}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          aria-label="Open DeployHQ dashboard"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C12 2 7 8 7 14l5 4 5-4c0-6-5-12-5-12z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
            <path d="M7 14l-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
            <path d="M17 14l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
            <path d="M10 18l2 4 2-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
          </svg>
          <h1 className="text-sm font-semibold tracking-wide">DeployHQ</h1>
        </button>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleTheme}
          className="p-1 hover:bg-deployhq-800 dark:hover:bg-gray-700 rounded transition-colors"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
        <button
          onClick={() => onNavigate({ type: 'settings' })}
          className="p-1 hover:bg-deployhq-800 dark:hover:bg-gray-700 rounded transition-colors"
          aria-label="Settings"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
