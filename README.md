# DeployHQ Chrome Extension

Deploy your code with one click. View deployment status, trigger deploys from GitHub/GitLab/Bitbucket, and get real-time notifications.

## Features

- **Project Dashboard** - View all your DeployHQ projects and their deployment status
- **Quick Deploy** - Trigger deployments with one click, selecting server, branch, and revision
- **GitHub/GitLab/Bitbucket Integration** - "Deploy with DeployHQ" button on PR pages
- **Real-time Notifications** - Desktop notifications when deployments complete or fail
- **Status Badge** - Extension icon shows deployment status at a glance

## Setup

1. Install the extension from the Chrome Web Store
2. Click the DeployHQ icon in your browser toolbar
3. Enter your account subdomain, email, and API key
4. Find your API key in DeployHQ under **Settings > Security**

## Development

```bash
# Install dependencies
npm install

# Build in watch mode
npm run dev

# Production build
npm run build

# Type check
npm run typecheck
```

### Loading the extension locally

1. Run `npm run build`
2. Open `chrome://extensions/` in Chrome
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist/` folder

## Tech Stack

- TypeScript, React 18, Tailwind CSS
- Vite with @crxjs/vite-plugin for Chrome extension bundling
- Manifest V3

## API

Uses the [DeployHQ API](https://api.deployhq.com/docs) with HTTP Basic Authentication.

## License

MIT
