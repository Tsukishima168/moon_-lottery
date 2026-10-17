import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';
import App from './App';
import PwaUpdateNotice from './src/components/PwaUpdateNotice';
import { startPwaUpdateMonitor } from './src/lib/pwaUpdates';
import { startMemberCacheCleanup } from './src/lib/memberCache';
import KiwimuUniverseRail, { readSupabaseLoginStatus } from './src/components/KiwimuUniverseRail';
import { trackEvent } from './src/lib/crossSiteTracking';
import { getAuthClient } from './src/lib/auth';
import './src/styles/kiwimu-universe.css';

// 共用導覽只讀一次登入狀態（無副作用）；追蹤事件統一為 universe_nav_click。
const getRailLoginStatus = () => readSupabaseLoginStatus(getAuthClient());

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

startMemberCacheCleanup();
startPwaUpdateMonitor();
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <KiwimuUniverseRail currentSite="gacha" onTrack={trackEvent} getLoginStatus={getRailLoginStatus} />
    <App />
    <PwaUpdateNotice />
  </React.StrictMode>
);
