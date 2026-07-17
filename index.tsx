import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';
import App from './App';
import KiwimuUniverseRail from './src/components/KiwimuUniverseRail';
import { trackEvent } from './src/lib/crossSiteTracking';
import { supabase } from './src/lib/supabase';
import './src/styles/kiwimu-universe.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <KiwimuUniverseRail
      currentSite="gacha"
      authClient={supabase}
      onTrack={trackEvent}
    />
    <App />
  </React.StrictMode>
);
