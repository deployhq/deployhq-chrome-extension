import { useState, useEffect } from 'react';
import type { AppView } from '@/shared/types';
import { getCredentials } from '@/shared/storage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import DeployForm from './pages/DeployForm';
import Settings from './pages/Settings';
import Header from './components/Header';

export default function App() {
  const [view, setView] = useState<AppView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const creds = await getCredentials();
      if (!creds) {
        setView({ type: 'login' });
        setLoading(false);
        return;
      }

      // Check for deploy intent from content script
      const result = await chrome.storage.local.get('deployhq_deploy_intent');
      const intent = result.deployhq_deploy_intent;
      if (intent && Date.now() - intent.timestamp < 30000) {
        chrome.storage.local.remove('deployhq_deploy_intent');
        setView({
          type: 'project',
          permalink: intent.permalink,
        });
      } else {
        if (intent) chrome.storage.local.remove('deployhq_deploy_intent');
        setView({ type: 'dashboard' });
      }

      setLoading(false);
    }
    init();
  }, []);

  if (loading || !view) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-deployhq-600 border-t-transparent" />
      </div>
    );
  }

  const showHeader = view.type !== 'login';

  return (
    <div className="min-h-[500px] flex flex-col">
      {showHeader && (
        <Header
          view={view}
          onNavigate={setView}
        />
      )}
      <div className="flex-1 overflow-y-auto">
        {view.type === 'login' && <Login onSuccess={() => setView({ type: 'dashboard' })} />}
        {view.type === 'dashboard' && <Dashboard onNavigate={setView} />}
        {view.type === 'project' && (
          <ProjectDetail permalink={view.permalink} onNavigate={setView} />
        )}
        {view.type === 'deploy' && (
          <DeployForm
            permalink={view.permalink}
            branch={view.branch}
            revision={view.revision}
            onNavigate={setView}
          />
        )}
        {view.type === 'settings' && <Settings onNavigate={setView} />}
      </div>
    </div>
  );
}
