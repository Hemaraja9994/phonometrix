import { type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, BookOpen, Home, Mic, Settings2, Table2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClinicStore } from "@/lib/store";

const NAV = [
  { to: "/", label: "Objects", icon: Home },
  { to: "/record", label: "Record", icon: Mic },
  { to: "/patients", label: "Caseload", icon: Users },
  { to: "/learn", label: "Academy", icon: BookOpen },
] as const;

const MORE = [
  { to: "/protocols", label: "Protocols", icon: Activity },
  { to: "/norms", label: "Norms", icon: Table2 },
  { to: "/clinic", label: "Settings", icon: Settings2 },
] as const;

function Mark({ compact = false, invert = false }: { compact?: boolean; invert?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 min-w-0">
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", invert ? "bg-card" : "bg-card border border-border")}>
        <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
          <path d="M8 22 a10 10 0 1 1 14.5-13" fill="none" stroke="#D05028" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M10.5 20 a7.2 7.2 0 1 1 10.2-9.4" fill="none" stroke="#40A8A8" strokeWidth="2.3" strokeLinecap="round" />
          <path d="M12.6 18.4 a4.6 4.6 0 1 1 6.4-6" fill="none" stroke="#385058" strokeWidth="2.1" strokeLinecap="round" />
          <path d="M14.4 17 a2.4 2.4 0 1 1 3.2-3.2" fill="none" stroke="#F8A800" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className="block font-display text-lg leading-none tracking-tight">Phonometrix</span>
          <span className={cn("block text-[10px] uppercase tracking-[0.18em] mt-0.5", invert ? "text-primary-foreground/55" : "text-muted-foreground")}>
            Voice lab
          </span>
        </span>
      )}
    </Link>
  );
}

function NavLink({ to, label, icon: Icon, collapsed }: { to: string; label: string; icon: typeof Home; collapsed?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`);
  return (
    <Link to={to} className={cn("flex items-center gap-3 rounded-full px-3 h-11 text-sm font-medium transition-colors", active ? "bg-card/14 text-primary-foreground" : "text-primary-foreground/75 hover:bg-card/8", collapsed && "justify-center px-0")}>
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && label}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const clinic = useClinicStore((s) => s.clinic);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname.startsWith("/report/")) return <div className="min-h-dvh bg-background">{children}</div>;
  return (
    <div className="min-h-dvh flex">
      <aside className="hidden md:flex w-[232px] shrink-0 flex-col bg-primary text-primary-foreground p-4">
        <Mark invert />
        <nav className="mt-8 flex flex-col gap-1">{NAV.map((n) => <NavLink key={n.to} {...n} />)}</nav>
        <p className="mt-8 mb-2 px-3 text-[10px] uppercase tracking-[0.18em] text-primary-foreground/50">Library</p>
        <nav className="flex flex-col gap-1">{MORE.map((n) => <NavLink key={n.to} {...n} />)}</nav>
        <div className="mt-auto rounded-2xl bg-card/10 p-3">
          <p className="text-[10px] uppercase tracking-wider text-primary-foreground/50">Clinician</p>
          <p className="font-medium text-sm truncate">{clinic.clinician}</p>
          <p className="text-xs text-primary-foreground/55 truncate">{clinic.role === "student" ? "Student mode" : clinic.credentials} · {clinic.city}</p>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="md:hidden sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/90 px-4 backdrop-blur">
          <Mark compact />
          <Link to="/clinic" className="text-xs font-medium text-muted-foreground truncate max-w-[45%]">{clinic.clinician}</Link>
        </header>
        <main className="flex-1 pb-24 md:pb-8">{children}</main>
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
          <div className="grid grid-cols-4">
            {NAV.map((n) => {
              const active = n.to === "/" ? pathname === "/" : pathname === n.to || pathname.startsWith(`${n.to}/`);
              const Icon = n.icon;
              return (
                <Link key={n.to} to={n.to} className={cn("flex flex-col items-center justify-center gap-0.5 h-14 text-[10px] uppercase tracking-wider", active ? "text-trace" : "text-muted-foreground")}>
                  <Icon className="h-5 w-5" />{n.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
