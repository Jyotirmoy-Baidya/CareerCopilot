import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-gray-500 mt-2 text-sm">This page does not exist or has moved.</p>
      <Link href="/home" className="mt-6 text-sm text-brand-500 hover:underline">
        Back to home
      </Link>
    </div>
  );
}
