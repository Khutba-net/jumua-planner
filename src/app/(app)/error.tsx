"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <span className="material-symbols-outlined text-4xl text-red-400 mb-3">error</span>
      <h2 className="text-lg font-bold text-ink mb-1">Something went wrong</h2>
      <p className="text-sm text-mute mb-4 max-w-md">
        An unexpected error occurred. Please try again or refresh the page.
      </p>
      <button
        onClick={reset}
        className="px-5 py-2 bg-primary text-white text-sm font-semibold hover:bg-secondary transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
