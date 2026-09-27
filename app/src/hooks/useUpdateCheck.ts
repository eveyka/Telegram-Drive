import { useState, useEffect, useCallback } from 'react';
import { check, Update } from '@tauri-apps/plugin-updater';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { type as osType } from '@tauri-apps/plugin-os';
import { openUrl } from '@tauri-apps/plugin-opener';
import { installVerifiedUpdate, type UpdateInstallPhase } from '../services/updateReliability';
import { getInstallationInfo, RELEASES_URL } from '../services/installationInfo';

import { version as appVersion } from '../../package.json';

interface UpdateState {
    checking: boolean;
    available: boolean;
    downloading: boolean;
    progress: number;
    error: string | null;
    version: string | null;
    phase: UpdateInstallPhase | null;
    managedByPackageManager: boolean;
}

interface AndroidUpdateManifest {
    version: string;
    versionCode: number;
}

interface AndroidUpdateProgress {
    downloadedBytes: number;
    totalBytes?: number;
    percent?: number;
}

interface AndroidInstallResult {
    installerLaunched: boolean;
    unknownSourcesSettingsOpened: boolean;
}

function isVersionNewer(remote: string, local: string): boolean {
    if (!remote || !local) return false;
    const parse = (v: string) => v.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
    const [rMajor = 0, rMinor = 0, rPatch = 0] = parse(remote);
    const [lMajor = 0, lMinor = 0, lPatch = 0] = parse(local);
    if (rMajor !== lMajor) return rMajor > lMajor;
    if (rMinor !== lMinor) return rMinor > lMinor;
    return rPatch > lPatch;
}

export function useUpdateCheck() {
    const [state, setState] = useState<UpdateState>({
        checking: false,
        available: false,
        downloading: false,
        progress: 0,
        error: null,
        version: null,
        phase: null,
        managedByPackageManager: false,
    });
    const [update, setUpdate] = useState<Update | null>(null);
    const [androidUpdate, setAndroidUpdate] = useState<AndroidUpdateManifest | null>(null);
    const isAndroid = (() => {
        try { return osType() === 'android'; } catch { return false; }
    })();

    const checkForUpdates = useCallback(async () => {
        setState(s => ({ ...s, checking: true, error: null }));
        try {
            if (isAndroid) {
                let updateInfo: AndroidUpdateManifest | null = null;
                try {
                    updateInfo = await invoke<AndroidUpdateManifest | null>('cmd_check_android_update');
                } catch (androidErr) {
                    console.warn('[UpdateCheck] Native Android check warning:', androidErr);
                }

                if (updateInfo) {
                    setAndroidUpdate(updateInfo);
                    setState(s => ({
                        ...s,
                        checking: false,
                        available: true,
                        version: updateInfo.version,
                        error: null,
                    }));
                    return;
                }

                // If native check returned null (up to date or no newer manifest), verify against GitHub Release tag
                try {
                    const ghRes = await fetch('https://api.github.com/repos/jupiterbania/Telegram-Drive/releases/latest', {
                        headers: { 'Accept': 'application/vnd.github.v3+json' },
                    });
                    if (ghRes.ok) {
                        const releaseData = await ghRes.json();
                        const latestTag = (releaseData.tag_name || '').replace(/^v/, '');
                        const isNewer = isVersionNewer(latestTag, appVersion);
                        setState(s => ({
                            ...s,
                            checking: false,
                            available: isNewer,
                            version: latestTag || appVersion,
                            error: null,
                        }));
                        return;
                    }
                } catch {
                    // Fall back to marking as up to date if network check failed
                }

                setState(s => ({
                    ...s,
                    checking: false,
                    available: false,
                    version: appVersion,
                    error: null,
                }));
                return;
            }

            const installation = await getInstallationInfo();
            try {
                const updateInfo = await check();
                if (updateInfo) {
                    setUpdate(updateInfo);
                    setState(s => ({
                        ...s,
                        checking: false,
                        available: true,
                        version: updateInfo.version,
                        managedByPackageManager: installation.managedByPackageManager,
                        error: null,
                    }));
                    return;
                }
            } catch (desktopCheckErr) {
                try {
                    const ghRes = await fetch('https://api.github.com/repos/jupiterbania/Telegram-Drive/releases/latest', {
                        headers: { 'Accept': 'application/vnd.github.v3+json' },
                    });
                    if (ghRes.ok) {
                        const releaseData = await ghRes.json();
                        const latestTag = (releaseData.tag_name || '').replace(/^v/, '');
                        const isNewer = isVersionNewer(latestTag, appVersion);
                        setState(s => ({
                            ...s,
                            checking: false,
                            available: isNewer,
                            version: latestTag || appVersion,
                            managedByPackageManager: installation.managedByPackageManager,
                            error: null,
                        }));
                        return;
                    }
                } catch {
                    // ignore fallback error
                }
            }

            setState(s => ({
                ...s,
                checking: false,
                available: false,
                version: appVersion,
                managedByPackageManager: installation.managedByPackageManager,
                error: null,
            }));
        } catch (err: unknown) {
            const message = typeof err === 'string'
                ? err
                : err instanceof Error
                    ? err.message
                    : 'Failed to check for updates';
            setState(s => ({
                ...s,
                checking: false,
                error: message,
            }));
        }
    }, [isAndroid]);

    const downloadAndInstall = useCallback(async () => {
        if (!update && !androidUpdate) {
            if (state.available) {
                try {
                    await openUrl(RELEASES_URL);
                } catch {
                    window.open(RELEASES_URL, '_blank');
                }
            }
            return;
        }

        if (state.managedByPackageManager) {
            try {
                await openUrl(RELEASES_URL);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Failed to open the release page';
                setState(s => ({ ...s, error: message }));
            }
            return;
        }

        setState(s => ({ ...s, downloading: true, progress: 0, phase: 'downloading', error: null }));
        try {
            if (isAndroid) {
                const unlisten = await listen<AndroidUpdateProgress>('android-update-progress', (event) => {
                    const progress = event.payload.percent;
                    if (progress !== undefined) {
                        setState(s => ({
                            ...s,
                            progress,
                            phase: progress >= 100 ? 'installing' : 'downloading',
                        }));
                    }
                });
                try {
                    const result = await invoke<AndroidInstallResult>('cmd_download_and_install_android_update');
                    if (result.unknownSourcesSettingsOpened) {
                        setState(s => ({
                            ...s,
                            downloading: false,
                            phase: null,
                            error: 'Allow Telegram Drive to install updates, then choose Update Now again.',
                        }));
                    }
                } finally {
                    unlisten();
                }
                return;
            }
            await installVerifiedUpdate(
                update!,
                (nextProgress) => setState(s => ({ ...s, progress: nextProgress })),
                (phase) => setState(s => ({ ...s, phase })),
            );
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to install update';
            setState(s => ({
                ...s,
                downloading: false,
                phase: null,
                error: message,
            }));
        }
    }, [androidUpdate, isAndroid, state.managedByPackageManager, update]);

    const dismissUpdate = useCallback(() => {
        setState(s => ({ ...s, available: false, phase: null }));
        setUpdate(null);
        setAndroidUpdate(null);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            checkForUpdates().catch(console.error);
        }, 5000);
        return () => clearTimeout(timer);
    }, [checkForUpdates]);

    return {
        ...state,
        checkForUpdates,
        downloadAndInstall,
        dismissUpdate,
    };
}
