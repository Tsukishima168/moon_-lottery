import liff from '@line/liff';

const liffId = import.meta.env.VITE_LINE_LIFF_ID;
let liffInitPromise: Promise<boolean> | null = null;
let liffReady = false;

const SITE_URL = 'https://gacha.kiwimu.com';
const SITE_NAME = '月島・遊戲中心';

export type ShareToLineResult =
    | { ok: true }
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

/**
 * 不需要 LIFF 的分享：LINE 官方 URL scheme（https://line.me/R/share?text=...，text 需 UTF-8 百分比編碼）。
 * 手機會喚起 LINE App 的「分享給」畫面，桌機會開 LINE 的分享頁。
 * 文件：https://developers.line.biz/en/docs/line-login/using-line-url-scheme/
 * 注意：不能用 'noopener' 這個 window.open 特徵，否則一律回傳 null，就分辨不出視窗是否被擋。
 */
const shareViaLineUrl = (text: string): ShareToLineResult => {
    const shareUrl = `https://line.me/R/share?text=${encodeURIComponent(text)}`;
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
        return { ok: true };
    } catch (error) {
        console.error('Error opening LINE share URL', error);
        return {
            ok: false,
            reason: 'error',
            message: '分享失敗，請稍後再試。',
        };
    }
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
            return { ok: true };
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
