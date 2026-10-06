# Gacha 內容與層級收斂 — 2026-10-06

final result: passed（本機視覺／已測導覽範圍）

本輪延續 Penso 已選定的第 1 稿，依已接受的 Passport 會員中心風格收斂；沒有再換機台或品牌方向。比較基準為本機提交 `4181ec4`，只有 App 文案／支持入口、CSS 與這份驗證紀錄改動。

## 最新結果

- 桌機主標縮至 44px，手機／平板 28px；主要按鈕統一 56px，降低原桌機 80px 按鈕的視覺重量。
- 手機文字在上、機台在下；圖片裁掉部分背景留白，完整保留機台、把手、托盤與 Kiwimu。600–900px 平板改雙欄，避免整張方形圖拉長頁面。
- 清楚標示「每日免費／不必登入」，用一個生活例子說明祝福卡。當天可重看、30P 成本、本機紀錄與預覽獎品的限制仍明示。
- 「我的集章」連結從 footer 移到主要內容區；目的 URL、query 與原 `member_journey` tracking 保留，沒有新增 claim 或自動集章。
- 每日機率用原生預設收合 details，六種小球與機率保持原樣；Enter 可開／關。
- 狀態說明在桌機亮背景上補深綠底，確保小字可讀；手機首頁連結的點按範圍補足 44px。

| 作者 IAB 寬度 | 橫向溢出 | 可見破圖 | Header／main 最小操作高度 | 主按鈕 |
| --- | --- | --- | --- | --- |
| 320px | 0 | 0 | 44px | 56px |
| 390px | 0 | 0 | 44px | 56px |
| 768px | 0 | 0 | 44px | 56px |
| 1280px | 0 | 0 | 44px | 56px |

- 說明視窗關閉回焦「遊戲說明」；空餘額轉盤返回每日遊戲回焦「免費轉一次」。沒有執行抽取。
- Console warn／error 0。實際畫面與數據：`/tmp/kiwimu-gacha-green-polish-20261006/qa/` 的 `home-320.jpg`、`home-390.jpg`、`home-768.jpg`、`home-1280.jpg`、`rules-390-collapsed.jpg`、`rules-390-expanded.jpg`、`wheel-390-empty.jpg`、`viewport-results.json`。
- Typecheck、production build、entry_from、9 PWA controller／4 legacy cache 與 17 saved fortune checks 通過。
- Fresh-context 獨立 code／mocked behavior review：APPROVE，原有 actual-source VM 42＋4 案例通過；64 個 JSX expression attributes 與 App effects／handlers保持一致，12個 economy／auth／SSO／sync／telemetry檔案byte-identical。報告另存上述 private QA 目錄；不是獨立瀏覽器、Safari 或真人抽獎簽收。

本機預覽維持 http://127.0.0.1:5224/ 。未 push／merge／部署。未改遊戲權重、成本、發獎、auth／SSO、Passport sync、獎池或素材；未登入、抽獎、扣點、分享、定位、核銷或 DB migration。Safari／iPhone 與 200% 實機縮放仍待驗收；既有伺服器權威錢包、專用 LIFF 及實體兌換待辦不因這次改版完成。

自我更正：首輪尺寸統計在 responsive 圖片切換尚未載入時誤報一張破圖，截圖後重新讀取已確認 0；首頁文字連結原本低於 44px，已擴大並複驗。以下為第 1 稿初次實作的歷史紀錄，原 76px／80px 尺寸不代表新版。

---

# Gacha 第 1 稿實作驗證 — 2026-10-06

final result: passed

## 範圍與比較條件

- Penso 明確選擇本輪第 1 稿「窗邊遊戲台」；只修改 Gacha。Passport／Map／Shop 後續延用色系，MBTI 不包含在這次設計改動。
- 原稿：`/Users/pensoair/.codex/generated_images/01a070fc-2e3c-79e1-b36d-357b24cf9a5c/exec-f4f3c6b7-d637-4b2a-b868-00e1d4cb85b2.png`，1487×1058 px。
- 真正實作：`http://127.0.0.1:5224/`，未登入、0 本機積分、未抽取狀態。
- 瀏覽器桌機 viewport 1487×1058 CSS px、DPR 1；IAB screenshot 回傳 1472×1047 px（排除捲軸／頁面空白）。比較裁成共同 1472×1047，無放大或重繪文字。
- 來源與實作放在同一張比較圖；另做標題／按鈕和下方兩入口的原像素區域比較。證據在 `/tmp/kiwimu-gacha-green-build-20261006/qa/`。
- 原稿的 63px 全站列改用現有正式版 49px 共用列；保留黑色、五站名稱、目前站點高亮。原稿未提供手機／視窗狀態，手機與結果卡為同系列延伸。

## 視覺迭代與修補

| 發現 | 嚴重度 | 修補與複验 |
| --- | --- | --- |
| 首版首頁、按鈕、次要入口文字與圖過小 | P2 | 放大桌機標題、CTA、說明與支持圖，維持手機獨立字級；最終原像素標題／按鈕比較通過 |
| 首版小角色使用既有黑白線稿，與舞台素材不同 | P2 | 重新製作同款立體 Kiwimu／植物祝福圖，取代線稿；最終下方區域比較通過 |
| 通用 `#root button` 壓掉 80／56px 主 CTA 高度 | P2 | 降低通用 selector specificity，保留 44px baseline；手機主要 CTA 56px，次要 CTA 48px |
| 平板圖片斷點與 CSS 斷點不一致 | P2 | 統一 900px；768px 複驗載入方形手機素材 |
| 1280px 舞台被 aspect-ratio＋min-height 撐寬 | P2 | 明確 width:100%；1280px 複驗橫向溢出 0 |
| 窄尺寸次要標題剩一字換行 | P2 | 降低各斷點字級並縮小支持圖；320／1280px 末輪截圖已檢視 |
| 轉盤返回每日遊戲後焦點回到轉盤入口 | P2 | 使用獨立 exitFocusRef 同步選定目標，移除 RAF 競態；實際按鈕點擊後焦點為「免費轉一次」 |

最終沒有未修的 P0／P1／P2 視覺問題。生成素材與原稿的機台角度、金色表面和小圖尺寸有細微差異，保留同一角色、主體、配色與構圖意圖；這是實際素材的重新製作，不能稱逐像素複製。

## 五個必要面向

- **字體與階層**：Noto Sans TC 為主要中文；JetBrains Mono 僅用編號／數值。桌機主標約 76px，手機 27–36px；手機正文 14px、說明最小 12px，CTA 不直排／截字。
- **間距與版面**：奶油白頁面＋一個深綠舞台，下面一排支持入口；沒有未開放「我的 Kiwimu」主卡或原固定底列。手機採文字在上、完整機台在下；44px 操作基線、明確留白與捲動界線。
- **顏色與狀態**：沿 Map 的 #F5F0E8／#1F2F1F／#304F2F／#D7C678；金色 CTA、森林綠 focus、低對比停用面。保留共用黑色導覽列。非行動正文使用 #5F6856。
- **圖片品質**：四張真實 WebP 素材合計約 464KiB；桌機／手機 hero 各有構圖。機台、把手、托盤、Kiwimu 完整；透明小圖在實際 UI 尺寸沒有可見黑底／明顯 halo。素材檔名含內容 hash，避免舊 PWA 圖片快取蓋過新版本。
- **文字與內容**：祝福改為敘事＋日常例子＋小行動；保留 1–10 舊 ID，另正確還原 999 月光球。清楚區分本機／會員積分，券與印章標示預覽，無即時核銷承諾。

## 行為與可及性

- 首頁、說明、轉盤空餘額、獎品與機率展開、每日既有結果、999 還原、損壞紀錄 toast、免費機會的 enabled 狀態已以 IAB 檢查。
- 結果卡採獨立本機 saved-state fixture；只開啟已保存結果，沒有執行抽取／扣點／發獎。fixture 已移出專案，不在 build。
- Radix 控制式 dialog：語意標題／描述、focus trap、Escape、可見關閉按钮、返回觸發來源；processing 阻止中途關閉。結果返回停用轉盤按鈕時改用外層標題 fallback。
- 親測 Tab／Shift+Tab 不離開結果卡；Escape 返回「看看今天的祝福」；說明底部關閉返回「遊戲說明」；空餘額返回每日入口的焦點正確。
- 已移除禁止縮放的 viewport 設定。reduced-motion 關閉機台晃動與 spinner CSS 動畫；沒有自動播音或自動刷新。
- 320／390／768／1280px 橫向溢出 0、所見素材載入成功；末輪 console error／warn 0。這是瀏覽器模擬尺寸，未代替 iPhone／Safari 真人簽收或 200% 實測。

## 主要證據

- `comparison-full-final.jpg`、`comparison-headline-final.jpg`、`comparison-lower-final.jpg`
- `desktop-final.jpg`、`desktop1280-final.jpg`、`tablet768-final.jpg`
- `mobile320-final.jpg`、`mobile390-final.jpg`、`mobile390-rules-final.jpg`
- `desktop-wheel-final.jpg`、`mobile390-wheel-empty.jpg`、`mobile390-wheel-free-fixture.jpg`
- `desktop-jackpot-restored.jpg`、`mobile390-jackpot-restored.jpg`
- `independent-review.md`：獨立 source／VM 審查紀錄，不能稱作獨立瀏覽器視覺簽收。

## 驗證邊界

- typecheck、production build、entry_from、9 PWA controller＋4 legacy-cache 情境、10 舊籤／999＋6 非法 ID 回歸已通過。
- 獨立審查檢查實際 handler／hydrate／分享／focus callback；機率、30P、每日一次、發獎、auth 與舊 Passport 同步保留。
- 未操作真人抽獎、付款、LINE 分享、登入、加減點、實體兌換或 DB migration；專用 LIFF、伺服器權威錢包與實體兌換仍屬既有待辦。
- 本輪僅本機可操作預覽，尚未 push／merge／production 部署。
