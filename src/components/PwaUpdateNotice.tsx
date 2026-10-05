import React, { useState, useSyncExternalStore } from 'react';
import { acceptPwaUpdate, getPwaUpdateState, subscribePwaUpdates } from '../lib/pwaUpdates';
import './pwa-update.css';

export default function PwaUpdateNotice() {
  const state = useSyncExternalStore(subscribePwaUpdates, getPwaUpdateState, () => 'idle');
  const [dismissed, setDismissed] = useState(false);
  if (state === 'idle' || dismissed) return null;
  return <aside className="ku-update-notice" aria-label="網站更新">
    <div role="status"><strong>{state === 'failed' ? '暫時無法更新' : '有新版本可以使用'}</strong>
      <p>{state === 'failed' ? '請確認網路後再試一次。' : '更新會重新開啟此頁。正在進行遊戲或查看結果時，可以稍後再更新。'}</p></div>
    <div className="ku-update-actions">
      <button type="button" onClick={() => setDismissed(true)} disabled={state === 'updating'}>稍後</button>
      <button type="button" onClick={() => { void acceptPwaUpdate(); }} disabled={state === 'updating'}>{state === 'updating' ? '正在更新…' : state === 'failed' ? '重試更新' : '更新頁面'}</button>
    </div>
  </aside>;
}
