"use client";

import { useEffect } from "react";
import { Toaster } from "sonner";
import { useRouter } from "next/navigation";

export function ClientUserEnhancements() {
  const router = useRouter();

  // Prefetch critical routes
  useEffect(() => {
    try {
      router.prefetch('/pricing');
      router.prefetch('/my-projects');
    } catch {}
  }, [router]);

  // Chunk guard to auto-reload if dynamic chunks fail to load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reloadOnChunkError = async (msg: string) => {
      if (/ChunkLoadError|Loading chunk[\s\S]*failed|Failed to fetch dynamically imported module/.test(msg)) {
        try {
          if ('caches' in window && (window as any).caches?.keys) {
            const keys = await (window as any).caches.keys();
            for (const k of keys) await (window as any).caches.delete(k);
          }
        } catch {}
        location.reload();
      }
    };
    const onError = (e: any) => reloadOnChunkError(String(e?.message || ""));
    const onRejection = (e: any) => reloadOnChunkError(String(e?.reason?.message || e?.reason || ""));
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return (
    <Toaster 
      position="top-center" 
      richColors
      closeButton
      expand
      visibleToasts={5}
      toastOptions={{
        style: {
          zIndex: 99999,
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
      }}
    />
  );
}

export default ClientUserEnhancements;

