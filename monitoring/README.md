# ParkPulse Health & CI/CD Monitor Dashboard 🩺

Real-time health monitoring and CI/CD operations dashboard for **ParkPulse** ([https://parkpulse.netlify.app](https://parkpulse.netlify.app)).

## Features

- **Live Site Latency & HTTP Status**: Continuous edge pinging and round-trip performance metrics.
- **CI/CD Pipeline Telemetry**: Real-time integration with GitHub Actions API for `sunidhidivyanshupadhyay/parkpulse-smart-parking`.
- **Subsystem Architecture Health**: Monitors Frontend SPA, Edge CDN, GitHub Automation, Graph Engine, and AI Assistant.
- **Autonomous Auto-Refresh**: Configurable refresh intervals with pause/resume and instant manual ping.
- **Port 3001 Ready**: Configured out of the box to run on port 3001 alongside the main parking app on port 3000.

## Running Locally

```bash
# Install dependencies
npm install

# Start on port 3001
npm run dev
```

Visit: [http://localhost:3001](http://localhost:3001)

## Deploying to Netlify

1. Go to [https://app.netlify.com](https://app.netlify.com)
2. Click **Add new site** → **Import an existing project** → **GitHub**
3. Select `parkpulse-health-monitor`
4. Netlify will automatically detect `netlify.toml` with:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click **Deploy site** 🚀
