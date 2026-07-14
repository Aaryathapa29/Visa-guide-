import { Link, useRouter } from "@tanstack/react-router";
import { Bell, GraduationCap, User } from "lucide-react";

const links = [
  { to: "/", label: "Home", hash: undefined as string | undefined },
  { to: "/", label: "Explore", hash: "explore" },
  { to: "/document-analyser", label: "Document Analyser", hash: undefined },
];

export function SiteNav() {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-primary text-primary-foreground shadow-sm">
      <div className="flex h-16 w-full items-center justify-between gap-4 px-6 md:px-12 lg:px-16">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-sm bg-gold text-gold-foreground">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="font-serif text-xl tracking-tight">
            Visa<span className="text-gold">Guide</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 text-sm md:flex">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              hash={l.hash}
              onClick={(e) => {
                if (!l.hash) return;
                if (router.state.location.pathname === "/") {
                  e.preventDefault();
                  document.getElementById(l.hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  history.replaceState(null, "", `#${l.hash}`);
                }
              }}
              className="group relative rounded-sm px-3 py-2 font-medium text-primary-foreground/75 transition-colors hover:text-gold"
              activeProps={{ className: "text-gold" }}
            >
              {l.label}
              <span className="pointer-events-none absolute inset-x-3 -bottom-0.5 h-0.5 origin-left scale-x-0 bg-gold transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label="Notifications"
            className="group relative grid h-10 w-10 place-items-center rounded-full text-primary-foreground/80 transition-colors hover:bg-white/5 hover:text-gold"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-gold" />
          </button>
          <button
            type="button"
            aria-label="Profile"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-primary-foreground/90 transition-colors hover:border-gold hover:text-gold"
          >
            <User className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-primary text-primary-foreground/80">
      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 md:grid-cols-3">
        <div>
          <div className="mb-2 flex items-center gap-2 font-semibold text-primary-foreground">
            <GraduationCap className="h-5 w-5 text-gold" />
            VisaGuide
          </div>
          <p className="text-sm">Student-visa clarity for USA, Canada & Australia — built for aspiring global learners.</p>
        </div>
        <div className="text-sm">
          <p className="mb-2 font-semibold text-primary-foreground">Explore</p>
          <ul className="space-y-1">
            <li><Link to="/countries" className="hover:text-gold">Country guides</Link></li>
            <li><Link to="/consultancies" className="hover:text-gold">Partner consultancies</Link></li>
            <li><Link to="/chat" className="hover:text-gold">AI Assistant</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-2 font-semibold text-primary-foreground">Disclaimer</p>
          <p>Information here is indicative. Always verify with the official embassy or high commission before applying.</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-primary-foreground/60">
        © {new Date().getFullYear()} VisaGuide · College academic project
      </div>
    </footer>
  );
}