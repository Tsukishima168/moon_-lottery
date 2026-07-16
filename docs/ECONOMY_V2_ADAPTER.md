# Gacha Economy v2 Adapter

Gacha 不再擁有點數、抽獎機率、每日限制或發獎權威。前端只會以已登入的 Supabase session 呼叫 canonical RPC，並呈現伺服器已提交的結果。

## 正式資料契約

- `economy_get_wallet(p_source_site := 'gacha', p_history_limit := 20, p_request_id)`：讀取伺服器餘額。
- `play_daily_gacha(p_request_id)`：同一交易內執行每日限制、抽選與發點。
- `spin_reward_wheel(p_request_id)`：同一交易內執行成本檢查、扣點、抽選與發點。
- request UUID 只供追蹤；client 不送點數、成本、權重、獎品、device id 或時區。
- `ALREADY_PROCESSED` 會呈現伺服器保存的同日結果，不再重新抽選或再次發點。

## 安全邊界

- 只接受 `xlqwfaailjyvsycjnzkz.supabase.co`，缺少或指向其他 project 時 fail closed。
- 未登入時不建立匿名／localStorage 點數，也不提供離線發獎。
- 已刪除 `pointsSystem.ts`、Passport `amount` URL、client RNG、localStorage 餘額與 `kiwimu:points_earned` 正式發點事件。
- 靜態顏色與圖示僅為 presentation map；任何未知 `prize_code` 都採安全通用樣式，不影響帳務結果。

## 發布依賴

此 PR 必須維持 Draft，直到 Shop canonical migration 完成以下 gate：

1. `20260715000000`–`20260715000005` migration history 與 production 完全一致。
2. Gacha game config 與 points-only prize seed 已在 hosted preview 驗證，預設仍 disabled。
3. `gacha` 的 Economy read/write rollout 先對專用帳號開啟。
4. RLS、grants、search path、100 次 idempotent replay 與併發帳本測試通過。
5. `ALREADY_PROCESSED` replay 可讀回正式餘額，或 wallet read flag 同步開啟。

Production canary 不使用真實顧客資料；任一 ledger mismatch、負餘額或重複發點都立即關閉 Gacha rollout flag。

## 本機驗證

```bash
npm run test:economy
npm run build
```

另外應以靜態 gate 確認正式路徑不含 `Math.random`、`localStorage` 點數、`amount=...`、client `p_points` 或 `kiwimu:points_earned`。
