"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>Something went wrong</h2>
      <p style={{ fontSize: "0.875rem", color: "#666", marginBottom: "1rem" }}>
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        style={{ padding: "0.5rem 1.25rem", background: "#00666d", color: "white", border: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600 }}
      >
        Try again
      </button>
    </div>
  );
}
