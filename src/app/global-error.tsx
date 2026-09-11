"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body style={{ fontFamily: "system-ui", padding: "40px", textAlign: "center", color: "#1a2a2c" }}>
        <h2 style={{ fontSize: "24px", marginBottom: "12px" }}>Something went wrong</h2>
        <p style={{ color: "#6d797a", marginBottom: "24px" }}>We&apos;ve been notified and are looking into it.</p>
        <button
          onClick={reset}
          style={{ background: "#00666d", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
