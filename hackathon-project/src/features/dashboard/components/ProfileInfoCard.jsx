export default function ProfileInfoCard({ label, value }) {
  return (
    <div className="rounded-xl bg-background-light p-4 dark:bg-background-dark/70">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <p className="mt-2 font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
