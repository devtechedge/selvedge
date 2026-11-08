import Link from "next/link";
import { requireStudio } from "@/lib/auth";
import { signOut } from "@/app/auth-actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { StudioNav } from "@/components/studio-nav";

export default async function StudioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const context = await requireStudio();
  return (
    <div className="studio">
      <header className="studio-bar">
        <Link href="/studio" className="wordmark wordmark--small">
          SELVEDGE
        </Link>
        <div className="studio-bar__identity">
          <span>{context.studio.name}</span>
          <span className="mono">{context.role}</span>
        </div>
        <StudioNav />
        <div className="studio-bar__user">
          <span>{context.user.name}</span>
          <form action={signOut}>
            <button type="submit" className="text-button">
              Sign out
            </button>
          </form>
          <ThemeToggle />
        </div>
      </header>
      <main className="studio-main">{children}</main>
      <footer className="studio-foot">
        <span>SELVEDGE / {context.studio.name}</span>
        <span>Deterministic drawdown engine. Shared demo studio.</span>
      </footer>
    </div>
  );
}