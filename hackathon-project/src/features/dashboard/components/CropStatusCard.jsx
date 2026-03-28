export default function CropStatusCard({ crop }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-background-dark rounded-xl border border-primary/5">
      <div className="flex items-center gap-3">
        <div
          className={`size-12 rounded-lg flex items-center justify-center ${
            crop.statusColor === "orange" ?
              "bg-orange-100 text-orange-500"
            : "bg-primary/10 text-primary"
          }`}
        >
          <span className="material-symbols-outlined">{crop.icon}</span>
        </div>
        <div>
          <p className="font-bold text-gray-900 dark:text-white">{crop.name}</p>
          <p className="text-xs text-gray-500">{crop.stage}</p>
        </div>
      </div>
      <div className="text-right">
        <p
          className={`font-bold ${
            crop.statusColor === "orange" ? "text-orange-500" : "text-primary"
          }`}
        >
          {crop.status}
        </p>
        <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1">
          <div
            className={`h-full rounded-full ${
              crop.statusColor === "orange" ? "bg-orange-500" : "bg-primary"
            }`}
            style={{
              width: `${Math.max(0, Math.min(100, crop.score))}%`,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
