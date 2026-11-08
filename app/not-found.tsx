import Link from "next/link";

export default function NotFound() {
  return (
    <div className="landing" style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
      <div style={{ maxWidth: 520, textAlign: "center" }}>
        <p className="kicker">Dropped stitch</p>
        <h1 style={{ fontFamily: "var(--serif)", fontSize: "clamp(48px,8vw,96px)", margin: "0 0 20px", fontWeight: 600 }}>
          This thread leads nowhere.
        </h1>
        <p className="hero__lede" style={{ margin: "0 auto 28px" }}>
          The page you asked for is not in the studio. It may have been finished, released under a
          different name, or never warped at all.
        </p>
        <Link href="/" className="button">
          Back to the landing
        </Link>
      </div>
    </div>
  );
}