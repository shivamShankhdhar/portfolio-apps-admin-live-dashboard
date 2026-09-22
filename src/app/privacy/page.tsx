'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PrivacyRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-6 text-center font-mono text-xs text-slate-400">
      <span>Redirecting to Admin Settings &amp; Security...</span>
    </div>
  );
}
