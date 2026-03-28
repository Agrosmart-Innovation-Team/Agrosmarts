import { Outlet } from "react-router-dom";
import { NavLink } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

function Layout() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-gray-900 dark:text-white">
      <Header />

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-primary/10 bg-background-light/95 dark:bg-background-dark/90 backdrop-blur-md px-4 pb-4 pt-2 z-20">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-1 ${
                isActive ? "text-primary" : "text-gray-400 hover:text-primary"
              }`
            }
          >
            <span className="material-symbols-outlined text-2xl">home</span>
            <p className="text-[10px] font-bold uppercase tracking-tight">
              Home
            </p>
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-1 ${
                isActive ? "text-primary" : "text-gray-400 hover:text-primary"
              }`
            }
          >
            <span className="material-symbols-outlined text-2xl">eco</span>
            <p className="text-[10px] font-bold uppercase tracking-tight">
              Dashboard
            </p>
          </NavLink>
          <NavLink
            to="/alerts"
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-1 ${
                isActive ? "text-primary" : "text-gray-400 hover:text-primary"
              }`
            }
          >
            <span className="material-symbols-outlined text-2xl">warning</span>
            <p className="text-[10px] font-bold uppercase tracking-tight">
              Alerts
            </p>
          </NavLink>
          <NavLink
            to="/library"
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-1 ${
                isActive ? "text-primary" : "text-gray-400 hover:text-primary"
              }`
            }
          >
            <span className="material-symbols-outlined text-2xl">
              menu_book
            </span>
            <p className="text-[10px] font-bold uppercase tracking-tight">
              Library
            </p>
          </NavLink>
          <NavLink
            to="/support"
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-1 ${
                isActive ? "text-primary" : "text-gray-400 hover:text-primary"
              }`
            }
          >
            <span className="material-symbols-outlined text-2xl">chat</span>
            <p className="text-[10px] font-bold uppercase tracking-tight">
              Support
            </p>
          </NavLink>
        </div>
      </nav>

      <Footer />
    </div>
  );
}

export default Layout;



