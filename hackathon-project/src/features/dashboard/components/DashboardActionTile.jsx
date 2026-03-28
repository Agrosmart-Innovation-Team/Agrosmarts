import { Link } from "react-router-dom";

export default function DashboardActionTile({ to, icon, title, subtitle }) {
  return (
    <Link
      className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-background-dark rounded-xl border border-primary/5 shadow-sm"
      to={to}
    >
      <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <span className="font-bold">{title}</span>
      <span className="text-[10px] text-gray-500 uppercase tracking-widest">
        {subtitle}
      </span>
    </Link>
  );
}
