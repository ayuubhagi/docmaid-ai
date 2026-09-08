import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuthStore } from "../../store/authStore";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-slate-800/80 text-brand-400" : "text-slate-300 hover:bg-slate-800/50 hover:text-slate-100"
  }`;

const DocIcon = (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M9 13h6M9 17h6" />
  </svg>
);

const ChartIcon = (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <path d="m7 14 3-3 3 3 5-5" />
  </svg>
);

function ActiveBar({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`absolute -left-1 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-brand-500 transition-all duration-200 ${
        isActive ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}

export default function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const initial = (user?.full_name || user?.email || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-col border-r border-slate-800 bg-slate-900/40 p-4 backdrop-blur-sm">
        <div className="mb-8 flex items-center px-2">
          <span className="font-display text-xl font-bold text-brand-400">DocMaid</span>
          <span className="ml-1 text-xs uppercase tracking-widest text-slate-500">AI</span>
        </div>

        <nav className="flex-1 space-y-1">
          <NavLink to="/dashboard" className={navLinkClass}>
            {({ isActive }) => (
              <>
                <ActiveBar isActive={isActive} />
                {DocIcon}
                Documents
              </>
            )}
          </NavLink>
          <NavLink to="/analytics" className={navLinkClass}>
            {({ isActive }) => (
              <>
                <ActiveBar isActive={isActive} />
                {ChartIcon}
                Analytics
              </>
            )}
          </NavLink>
        </nav>

        <div className="border-t border-slate-800 pt-4">
          <div className="flex items-center gap-3 px-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-500/30 bg-brand-500/10 text-sm font-semibold text-brand-400">
              {initial}
            </div>
            <p className="truncate text-sm text-slate-300" title={user?.email}>
              {user?.full_name}
            </p>
          </div>
          <button
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-slate-200"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="m16 17 5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
