Original prompt: 繼續掃雷、先把 bug 修到能用，再更新交接紀錄與專案卡。

## 2026-03-14

- 初始化 `develop-web-game` 測試流程。
- 目前已確認：`npx` 可用，Playwright client 與 actions payload 參考檔存在。
- 本輪目標：掃 `moonmoon-gacha` 的首次載入、未登入、分享、Passport 導頁與積分同步相關 runtime bug。
- 第一輪 Playwright 測試發現：轉蛋按鈕因外層容器持續上下浮動，標準 click 會因 element unstable 失敗。
- 已修正：將可點擊 hit area 固定，改為只讓內層視覺搖動，避免點擊區域跟著漂移。
- 重跑互動後抓到結果 modal 的 LINE 分享 icon SVG path 失效，瀏覽器會報 `<path> attribute d` 錯誤。
- 已修正：移除壞掉的手寫 SVG，改用 `lucide-react` 的 `MessageCircle` icon。
- 另補一個資料品質 bug：GA4 `page_view` 先由 `gtag('config')` 自動送一次，`App.tsx` 又手動送一次，造成首頁瀏覽重複計數。
- 已修正：`index.html` 的 `gtag('config', gaId)` 改為 `send_page_view: false`，保留 app 端的自訂 `page_view`。
- 互動驗證：Playwright 截圖確認結果 modal 可正常開啟，LINE 分享按鈕已正常顯示，console error 歸零。
- 編譯驗證：`npm run build` 通過；`npx tsc --noEmit` 通過。
