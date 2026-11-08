"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#23201c", color: "#f2ead9", fontFamily: "Georgia, serif", display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <div style={{ maxWidth: 520, textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 48, margin: "0 0 16px" }}>The studio is offline.</h1>
          <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 24 }}>
            A fatal error stopped the studio from rendering. Reload to try again.
          </p>
          <button type="button" onClick={reset} style={{ padding: "12px 20px", border: "1px solid #f2ead9", background: "transparent", color: "#f2ead9", cursor: "pointer", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}