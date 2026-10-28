import liff from '@line/liff';

const liffId = import.meta.env.VITE_LINE_LIFF_ID;
let liffInitPromise: Promise<boolean> | null = null;
let liffReady = false;

const SITE_URL = 'https://gacha.kiwimu.com';
const SITE_NAME = '月島・遊戲中心';

export type ShareToLineResult =
    | { ok: true; message: string }
    | {
        ok: false;
        reason: 'popup_blocked' | 'cancelled' | 'error';
        message: string;
    };

export const initLiff = async () => {
    if (!liffId) {
        console.warn('VITE_LINE_LIFF_ID is not set in environment variables');
        return false;
    }

    if (liffReady) {
        return true;
    }

    if (liffInitPromise) {
        return liffInitPromise;
    }

    liffInitPromise = (async () => {
        try {
            await liff.init({ liffId });
            liffReady = true;
            return true;
        } catch (err) {
            console.warn('LIFF initialization skipped:', err);
            return false;
        } finally {
            liffInitPromise = null;
        }
    })();

    return liffInitPromise;
};

/**
 * 分享訊息文字。points 只在「真的拿到遊戲積分」時才傳（轉盤的券、印章、免費機會不要傳），
 * 否則會把券面額或 0 寫成「獲得 N 積分」。
 */
const buildShareText = (prizeLabel: string, points?: number): string => {
    const lines = [`我在${SITE_NAME}抽到了「${prizeLabel}」！`];
    if (typeof points === 'number' && points > 0) {
        lines.push(`獲得 ${points} 遊戲積分。`);
    }
    lines.push('你也來試試手氣：', SITE_URL);
    return lines.join('\n');
};

const OPENED_LINE_SHARE_MESSAGE = '已開啟 LINE 分享。';
const COPIED_SHARE_MESSAGE = '已複製分享文字，貼到 LINE 聊天室就能分享給好友。';
const OPENED_WEB_SHARE_MESSAGE = '已開啟 LINE 網頁版分享：需要先登入 LINE，而且只會帶上遊戲連結。';

/**
 * 判斷是不是手機／平板（會有 LINE App 可以接 line.me 的分享連結）。
 * 為什麼不能全部都開 https://line.me/R/share：2026-10-28 用不同 User-Agent 實測（curl，唯讀），
 * 手機（iPhone／Android 手機與平板）回 200 並帶出 line://share；桌機的 Chrome、Firefox、Edge
 * （Mac／Windows／Linux）一律 302 到 https://line.me/（LINE 首頁），根本沒有分享畫面。
 * 所以依據是「裝置有沒有 LINE App 可以接」：
 *   1. navigator.userAgentData.mobile（Chromium 提供的布林值，最可靠）；
 *   2. 沒有的話看 User-Agent 有沒有 Android／iPhone／iPad／iPod／Mobile／Windows Phone；
 *   3. iPadOS 13+ 的 Safari 預設送 Mac 桌機 UA，用「platform 是 MacIntel 且觸控點數 > 1」辨識（Mac 本身沒有觸控）。
 * 判斷不到時一律當桌機：桌機路徑（複製文字）在手機上也能用，只是少了一步直接喚起 LINE。
 */
const isMobileDevice = (): boolean => {
    if (typeof navigator === 'undefined') return false;
    const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData;
    if (uaData?.mobile === true) return true;
    if (/Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(navigator.userAgent ?? '')) return true;
    return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
};

/**
 * 開新視窗到指定網址。不能用 'noopener' 這個 window.open 特徵，否則一律回傳 null，就分辨不出視窗是否被擋；
 * 改成開啟後把 opener 設為 null。
 */
const openShareWindow = (shareUrl: string, successMessage: string): ShareToLineResult => {
    try {
        const shareWindow = window.open(shareUrl, '_blank');
        if (!shareWindow) {
            return {
                ok: false,
                reason: 'popup_blocked',
                message: '瀏覽器擋住了分享視窗，請允許彈出視窗後再試一次。',
            };
        }
        try {
            shareWindow.opener = null;
        } catch {
            // 切斷 opener 只是額外保護，失敗不影響分享
        }
        return { ok: true, message: successMessage };
    } catch (error) {
        console.error('Error opening LINE share URL', error);
        return {
            ok: false,
            reason: 'error',
            message: '分享失敗，請稍後再試。',
        };
    }
};

/**
 * 不需要 LIFF 的分享。
 * 手機：LINE 官方 URL scheme（https://line.me/R/share?text=...，text 需 UTF-8 百分比編碼），
 *   會喚起 LINE App 的「分享給」畫面。文件：https://developers.line.biz/en/docs/line-login/using-line-url-scheme/
 * 桌機：line.me/R/share 會被轉到 LINE 首頁，所以改成「複製分享文字」，貼到 LINE（電腦版或手機）聊天室就能分享，
 *   不用登入網頁版，也保留獎品文字；複製不了（瀏覽器不支援或被拒絕）才退回
 *   https://social-plugins.line.me/lineit/share?url=...（LINE 網頁版分享，需登入 LINE，只能帶網址、不能帶文字）。
 * 複製／開視窗都要在使用者點擊的同一個動作裡呼叫，所以呼叫端在這之前不能先 await。
 */
const shareViaLineUrl = async (text: string): Promise<ShareToLineResult> => {
    if (isMobileDevice()) {
        return openShareWindow(`https://line.me/R/share?text=${encodeURIComponent(text)}`, OPENED_LINE_SHARE_MESSAGE);
    }

    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return { ok: true, message: COPIED_SHARE_MESSAGE };
        }
    } catch (error) {
        console.warn('Clipboard write failed, falling back to the LINE web share page.', error);
    }
    return openShareWindow(
        `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(SITE_URL)}`,
        OPENED_WEB_SHARE_MESSAGE,
    );
};

export const sharePullToLine = async (prizeLabel: string, points?: number): Promise<ShareToLineResult> => {
    const text = buildShareText(prizeLabel, points);

    // 沒設定 LIFF ID：直接走分享網址。這裡刻意不先 await，才不會讓瀏覽器把 window.open 當成非使用者點擊而擋掉。
    if (!liffId) {
        return shareViaLineUrl(text);
    }

    const initialized = await initLiff();
    if (!initialized) {
        return shareViaLineUrl(text);
    }

    if (!liff.isLoggedIn()) {
        // 不在 LINE App 內（或尚未登入 LINE）時 shareTargetPicker 會失敗，改走分享網址。
        console.warn('LIFF is not logged in. Falling back to the LINE share URL.');
        return shareViaLineUrl(text);
    }

    if (!liff.isApiAvailable('shareTargetPicker')) {
        console.warn('shareTargetPicker is not available in this environment. Falling back to the LINE share URL.');
        return shareViaLineUrl(text);
    }

    const flexMessage = {
        type: "flex" as const,
        altText: `我在${SITE_NAME}抽到了 ${prizeLabel}！你也來試試手氣`,
        contents: {
            type: "bubble" as const,
            size: "kilo" as const,
            hero: {
                type: "image" as const,
                url: "https://res.cloudinary.com/dvizdsv4m/image/upload/v1768744157/Enter-03_juymmq.webp",
                size: "full" as const,
                aspectRatio: "20:13" as const,
                aspectMode: "cover" as const,
                action: {
                    type: "uri" as const,
                    label: "Open Link",
                    uri: SITE_URL
                }
            },
            body: {
                type: "box" as const,
                layout: "vertical" as const,
                contents: [
                    {
                        type: "text" as const,
                        text: `${SITE_NAME} 抽獎結果`,
                        weight: "bold" as const,
                        color: "#d97706",
                        size: "sm" as const
                    },
                    {
                        type: "text" as const,
                        text: prizeLabel,
                        weight: "bold" as const,
                        size: "xl" as const,
                        margin: "md" as const,
                        wrap: true
                    },
                    ...(typeof points === 'number' && points > 0
                        ? [{
                            type: "text" as const,
                            text: `獲得 ${points} 遊戲積分！`,
                            size: "sm" as const,
                            color: "#666666",
                            wrap: true,
                            margin: "sm" as const
                        }]
                        : [])
                ]
            },
            footer: {
                type: "box" as const,
                layout: "vertical" as const,
                spacing: "sm" as const,
                contents: [
                    {
                        type: "button" as const,
                        style: "primary" as const,
                        color: "#d97706",
                        height: "sm" as const,
                        action: {
                            type: "uri" as const,
                            label: "我也要抽抽看",
                            uri: SITE_URL
                        }
                    }
                ],
                flex: 0
            }
        }
    };

    try {
        const res = await liff.shareTargetPicker([flexMessage]);
        if (res) {
            console.log('Flex message sent successfully');
            return { ok: true, message: OPENED_LINE_SHARE_MESSAGE };
        } else {
            console.log('User cancelled share target picker');
            return {
                ok: false,
                reason: 'cancelled',
                message: '你已取消分享。',
            };
        }
    } catch (error) {
        console.error('Error sharing target picker', error);
        return shareViaLineUrl(text);
    }
};
