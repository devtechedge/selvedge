import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginForm } from "@/components/login-form";
import { DemoLoginButton } from "@/components/demo-login-button";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo";
import { env } from "@/lib/env";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="auth">
      <div className="page-toggle">
        <ThemeToggle />
      </div>

      <div className="auth__brand">
        <span className="wordmark">SELVEDGE</span>
        <p className="kicker" style={{ marginTop: 44 }}>
          A shared handweaving studio
        </p>
        <h1>
          Back to
          <span>the loom.</span>
        </h1>
        <p className="auth__lede">
          Sign in to draft cloth, reserve yarn from your dye lots, and weave pick by pick. Or step
          into the shared demo studio as a weaver, a dyer, or the studio manager.
        </p>
        <p className="auth__note">
          The demo studio is seeded and shared. Its cloth and dye lots reset when the seed is run.
          Nothing here is a real order.
        </p>
      </div>

      <div className="auth__panel">
        <h2>Sign in</h2>
        <LoginForm />

        {env.demoMode ? (
          <>
            <div className="auth__divider">
              <span>or try a demo role</span>
            </div>
            <div className="demo-list">
              {DEMO_ACCOUNTS.map((account) => (
                <DemoLoginButton
                  key={account.email}
                  email={account.email}
                  name={account.name}
                  role={account.label}
                  blurb={account.blurb}
                />
              ))}
            </div>
            <p className="micro" style={{ marginTop: 14 }}>
              Demo password: <code>{DEMO_PASSWORD}</code>
            </p>
          </>
        ) : null}

        <p style={{ marginTop: 22 }}>
          <Link href="/" className="quiet-link">
            Back to the landing
          </Link>
        </p>
      </div>
    </div>
  );
}