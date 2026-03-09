import type { AppView } from '@/shared/types';

interface HeaderProps {
  view: AppView;
  onNavigate: (view: AppView) => void;
}

export default function Header({ view, onNavigate }: HeaderProps) {
  const showBack = view.type !== 'dashboard';

  const handleBack = () => {
    if (view.type === 'deploy') {
      onNavigate({ type: 'project', permalink: view.permalink });
    } else {
      onNavigate({ type: 'dashboard' });
    }
  };

  return (
    <header className="bg-deployhq-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2">
        {showBack && (
          <button
            onClick={handleBack}
            className="p-1 hover:bg-deployhq-800 rounded transition-colors"
            aria-label="Go back"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <h1 className="text-sm font-semibold tracking-wide">DeployHQ</h1>
      </div>
      <button
        onClick={() => onNavigate({ type: 'settings' })}
        className="p-1 hover:bg-deployhq-800 rounded transition-colors"
        aria-label="Settings"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </header>
  );
}
