export default function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center p-10 text-on-surface-variant font-body-md text-body-md gap-2">
      <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
      Loading module…
    </div>
  );
}
