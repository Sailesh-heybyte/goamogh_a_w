'use client';
import { useEffect } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function GlobalError({ error, reset }) {
    useEffect(() => {
        if (
            error?.name === 'ChunkLoadError' ||
            error?.message?.includes('Loading chunk') ||
            error?.message?.includes('timeout')
        ) {
            const lastReload = sessionStorage.getItem('chunk_load_reload');
            const now = Date.now();
            if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
                sessionStorage.setItem('chunk_load_reload', now.toString());
                window.location.reload();
            }
        }
    }, [error]);

    return (
        <main className="min-h-screen bg-[#1a2416] text-[#efe3bf] flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-[#0b150d] border border-[#d8b66a]/20 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
                <div className="w-16 h-16 rounded-full bg-[#d8b66a]/10 border border-[#d8b66a]/30 flex items-center justify-center mx-auto text-[#d8b66a]">
                    <AlertTriangle size={28} />
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-serif text-white font-bold" style={{ fontFamily: "'Cinzel', serif" }}>
                        Something went wrong
                    </h2>
                    <p className="text-xs text-[#d6cca9]/70 font-mono">
                        {error?.message?.includes('Loading chunk')
                            ? 'A newer version of the page was compiled. Reloading to get the latest bundle.'
                            : 'An unexpected error occurred while loading this view.'}
                    </p>
                </div>

                <button
                    onClick={() => {
                        if (error?.name === 'ChunkLoadError' || error?.message?.includes('Loading chunk')) {
                            window.location.reload();
                        } else {
                            reset();
                        }
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#d8b66a] text-[#0b150d] font-bold text-xs uppercase tracking-wider hover:bg-white transition cursor-pointer shadow-lg"
                >
                    <RefreshCw size={14} />
                    <span>Reload Page</span>
                </button>
            </div>
        </main>
    );
}
