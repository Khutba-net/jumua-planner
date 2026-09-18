import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ground px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl font-extrabold text-primary mb-4">404</div>
        <h1 className="text-xl font-bold text-ink mb-2">Page not found</h1>
        <p className="text-sm text-mute mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
