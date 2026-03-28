export default function WeatherMetricCard({
  icon,
  label,
  value,
  note,
  noteClassName = "text-gray-500",
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl p-4 bg-white dark:bg-background-dark shadow-sm border border-primary/5">
      <span className="material-symbols-outlined text-primary">{icon}</span>
      <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">
        {label}
      </p>
      <p className="text-gray-900 dark:text-white text-xl font-bold leading-tight">
        {value}
      </p>
      <p className={`${noteClassName} text-xs font-medium`}>{note}</p>
    </div>
  );
}
