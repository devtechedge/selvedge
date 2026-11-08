import Link from "next/link";
import { LoomDemo } from "@/components/loom-demo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LandingPage() {
  return (
    <div className="landing">
      <div className="page-toggle">
        <ThemeToggle />
      </div>

      <header className="site-head">
        <span className="wordmark">SELVEDGE</span>
        <nav className="site-head__nav" aria-label="Primary">
          <a href="#loop">The loop</a>
          <Link href="/login">Sign in</Link>
        </nav>
      </header>

      <section className="hero">
        <div className="hero__copy">
          <p className="kicker">A shared handweaving studio</p>
          <h1>
            Draft cloth.
            <span>Weave it true.</span>
          </h1>
          <p className="hero__lede">
            Selvedge is a workshop for handweavers. Draft cloth on multi-shaft looms, keep naturally
            dyed yarn by dye lot, warp a project, weave it pick by pick, and release a pattern that
            can never quietly change. A deterministic engine renders the exact cloth face from your
            threading, tie-up and treadling.
          </p>
          <div className="hero__actions">
            <Link href="/login" className="button">
              Save to your studio
            </Link>
            <a href="#loop" className="quiet-link">
              See the loop
            </a>
          </div>
          <dl className="hero__facts">
            <div>
              <dt>7</dt>
              <dd>Weave structures, plain to waffle</dd>
            </div>
            <div>
              <dt>4</dt>
              <dd>Linked grids in every draft</dd>
            </div>
            <div>
              <dt>1</dt>
              <dd>Deterministic drawdown engine</dd>
            </div>
          </dl>
        </div>

        <LoomDemo />
      </section>

      <section className="landing-rail" id="loop" aria-label="How the studio works">
        <div>
          <span className="rail-number">01</span>
          <h2>Draft and reserve</h2>
          <p>
            Paint the threading, tie-up and treadling, watch the drawdown compute, then reserve yarn
            from real dye lots. Two projects can never overdraw one lot.
          </p>
        </div>
        <div>
          <span className="rail-number">02</span>
          <h2>Warp and weave</h2>
          <p>
            Dress a loom that has enough shafts and treadles, weave pick by pick, and log the
            wet-finishing, shrinkage and measured cloth that comes off the beam.
          </p>
        </div>
        <div>
          <span className="rail-number">03</span>
          <h2>Release a pattern</h2>
          <p>
            Freeze a draft, yarn plan and sett into an immutable, checksummed release. Versioned and
            verified, so a pattern a weaver trusts stays exactly as woven.
          </p>
        </div>
      </section>

      <footer className="landing-foot">
        <p>SELVEDGE. A shared handweaving studio.</p>
        <p>
          The demo studio is seeded and shared. Exploring needs no account; saving your work does.
        </p>
      </footer>
    </div>
  );
}