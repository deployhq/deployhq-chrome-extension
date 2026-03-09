import { useState } from 'react';
import { api } from '@/shared/api';
import { saveCredentials } from '@/shared/storage';

interface LoginProps {
  onSuccess: () => void;
}

export default function Login({ onSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await saveCredentials({
        email: email.trim(),
        apiKey: apiKey.trim(),
        accountSubdomain: subdomain.trim(),
      });
      api.clearCache();

      const valid = await api.validateCredentials();
      if (valid) {
        onSuccess();
      } else {
        setError('Could not connect. Check your credentials and try again.');
      }
    } catch {
      setError('Connection failed. Verify your account subdomain and credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="text-center mb-6">
        <img src="/icons/icon-128.png" alt="DeployHQ" className="w-12 h-12 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-gray-900">Connect to DeployHQ</h2>
        <p className="text-xs text-gray-500 mt-1">
          Find your API key in Settings &rarr; Security
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="subdomain" className="block text-xs font-medium text-gray-700 mb-1">
            Account subdomain
          </label>
          <div className="flex items-center">
            <input
              id="subdomain"
              type="text"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              placeholder="mycompany"
              required
              className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-deployhq-500 focus:border-deployhq-500"
            />
            <span className="text-xs text-gray-500 bg-gray-100 border border-l-0 border-gray-300 px-2 py-2 rounded-r-lg">
              .deployhq.com
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deployhq-500 focus:border-deployhq-500"
          />
        </div>

        <div>
          <label htmlFor="apiKey" className="block text-xs font-medium text-gray-700 mb-1">
            API key
          </label>
          <input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Your 40-character API key"
            required
            className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deployhq-500 focus:border-deployhq-500"
          />
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-deployhq-600 hover:bg-deployhq-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Connecting...' : 'Connect'}
        </button>
      </form>

      <p className="text-center text-xs text-gray-400 mt-4">
        Don&apos;t have an account?{' '}
        <a
          href="https://www.deployhq.com/signup"
          target="_blank"
          rel="noopener noreferrer"
          className="text-deployhq-600 hover:underline"
        >
          Sign up free
        </a>
      </p>
    </div>
  );
}
