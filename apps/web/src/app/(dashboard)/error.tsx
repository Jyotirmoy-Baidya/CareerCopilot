'use client';

import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[dashboard error]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-gray-500 mt-2 text-sm max-w-sm">
        A service may be temporarily unavailable. Your data is safe.
      </p>
      <button
        onClick={reset}
        className="mt-6 text-sm bg-brand-500 text-white px-4 py-2 rounded-md hover:bg-brand-600"
      >
        Try again
      </button>
    </div>
  );
}
