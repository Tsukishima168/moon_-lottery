import liff from '@line/liff';

const liffId = import.meta.env.VITE_LINE_LIFF_ID;
let liffInitPromise: Promise<boolean> | null = null;
let liffReady = false;

export type ShareToLineResult =
    | { ok: true }
    | {
        ok: false;
        reason: 'missing_liff_id' | 'not_logged_in' | 'unavailable' | 'cancelled' | 'error';
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

export const sharePullToLine = async (prizeLabel: string, points: number): Promise<ShareToLineResult> => {
    if (!liffId) {
        return {
            ok: false,
            reason: 'missing_liff_id',
            message: 'LINE 分享功能尚未啟用，請稍後再試。',
        };
    }

    const initialized = await initLiff();
    if (!initialized) {
        return {
            ok: false,
            reason: 'unavailable',
            message: '目前無法啟用 LINE 分享，請改用 LINE App 開啟或稍後再試。',
        };
    }

    if (!liff.isLoggedIn()) {
        console.warn("LIFF is not logged in. shareTargetPicker may fail if not in LINE app.");
        return {
            ok: false,
            reason: 'not_logged_in',
            message: '請在 LINE App 內開啟，才能直接分享給好友。',
        };
    }

    if (!liff.isApiAvailable('shareTargetPicker')) {
        console.warn('shareTargetPicker is not available in this environment.');
        return {
            ok: false,
            reason: 'unavailable',
            message: '目前環境不支援 LINE 分享，請改用 LINE App 開啟。',
        };
    }

    const siteUrl = 'https://gacha.kiwimu.com';

    const flexMessage = {
        type: "flex" as const,
        altText: `我在月島開運所抽到了 ${prizeLabel}！你也來試試手氣`,
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
                    uri: siteUrl
                }
            },
            body: {
                type: "box" as const,
                layout: "vertical" as const,
                contents: [
                    {
                        type: "text" as const,
                        text: `月島・開運所 扭蛋結果`,
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
                    {
                        type: "text" as const,
                        text: `獲得 ${points} 積分！`,
                        size: "sm" as const,
                        color: "#666666",
                        wrap: true,
                        margin: "sm" as const
                    }
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
                            uri: siteUrl
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
        return {
            ok: false,
            reason: 'error',
            message: '分享失敗，請稍後再試。',
        };
    }
};
