import { useEffect, useMemo, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { isTauri } from '@tauri-apps/api/core';
import { Clock3 } from 'lucide-react';

interface CooldownPayload {
    operation: string;
    retryAt: number;
    seconds: number;
    active: boolean;
}

export function TelegramCooldownBanner() {
    const [cooldown, setCooldown] = useState<CooldownPayload | null>(null);
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!isTauri()) return;
        let dispose: (() => void) | undefined;
        let cancelled = false;
        void listen<CooldownPayload>('telegram-cooldown', ({ payload }) => {
            setCooldown(payload.active ? payload : null);
            setNow(Date.now());
        }).then((fn) => {
            if (cancelled) fn();
            else dispose = fn;
        }).catch(() => {
            // The banner is optional; a listener failure must never affect app startup.
        });
        return () => {
            cancelled = true;
            dispose?.();
        };
    }, []);

    useEffect(() => {
        if (!cooldown) return;
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [cooldown]);

    const remaining = useMemo(() => cooldown ? Math.max(0, Math.ceil((cooldown.retryAt - now) / 1000)) : 0, [cooldown, now]);
    useEffect(() => {
        if (cooldown && remaining === 0) setCooldown(null);
    }, [cooldown, remaining]);
    if (!cooldown) return null;

    const timeDisplay = remaining >= 60
        ? `${Math.floor(remaining / 60)}m ${remaining % 60}s`
        : `${remaining}s`;

    return (
        <div
            className="fixed left-1/2 top-[calc(env(safe-area-inset-top,14px)+10px)] -translate-x-1/2 z-[250] flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#161b26]/95 border border-amber-500/35 shadow-2xl shadow-black/80 backdrop-blur-xl animate-in fade-in slide-in-from-top-3 duration-300 max-w-[calc(100vw-32px)] pointer-events-none select-none"
            role="status"
            aria-live="polite"
        >
            {/* Animated Clock Badge */}
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30 shrink-0">
                <Clock3 className="h-3 w-3 text-amber-400 animate-pulse" />
            </div>

            {/* Structured Info */}
            <div className="flex items-center gap-1.5 min-w-0 text-[11px] sm:text-xs">
                <span className="font-semibold text-white/95 whitespace-nowrap">
                    Telegram Cooling Down
                </span>
                <span className="text-amber-400/60 font-bold">•</span>
                <span className="text-zinc-300 whitespace-nowrap">
                    Resumes in <strong className="font-mono font-bold text-amber-400 tabular-nums">{timeDisplay}</strong>
                </span>
            </div>

            {/* Live Pulsing Dot */}
            <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
        </div>
    );
}
