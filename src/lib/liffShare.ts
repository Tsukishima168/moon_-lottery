import liff from '@line/liff';

const liffId = import.meta.env.VITE_LINE_LIFF_ID;

export const initLiff = async () => {
    if (!liffId) {
        console.warn('VITE_LINE_LIFF_ID is not set in environment variables');
        return false;
    }
    try {
        await liff.init({ liffId });
        console.log('LIFF initialized successfully.');
        return true;
    } catch (err) {
        console.error('LIFF initialization failed', err);
        return false;
    }
};

export const sharePullToLine = async (prizeLabel: string, points: number): Promise<boolean> => {
    if (!liff.isLoggedIn()) {
        console.warn("LIFF is not logged in. shareTargetPicker may fail if not in LINE app.");
    }

    if (!liff.isApiAvailable('shareTargetPicker')) {
        console.warn('shareTargetPicker is not available in this environment.');
        return false;
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
            return true;
        } else {
            console.log('User cancelled share target picker');
            return false;
        }
    } catch (error) {
        console.error('Error sharing target picker', error);
        return false;
    }
};
