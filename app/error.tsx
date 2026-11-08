"use client";

export default function ErrorBoundary({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="landing" style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
      <div style={{ maxWidth: 520, textAlign: "center" }}>
        <p className="kicker">Tangled warp</p>
        <h1 style={{ fontFamily: "var(--serif)", fontSize: "clamp(40px,6vw,72px)", margin: "0 0 20px", fontWeight: 600 }}>
          Something snagged.
        </h1>
        <p className="hero__lede" style={{ margin: "0 auto 28px" }}>
          The studio hit an unexpected error. Try again; if it keeps happening, the draft may need a
          fresh warp.
        </p>
        <button type="button" className="button" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}