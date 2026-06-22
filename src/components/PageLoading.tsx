type Props = {
  message?: string;
};

export function PageLoading({ message = "Memuat..." }: Props) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-cream-paper/95 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="card mx-4 w-full max-w-md space-y-6 text-center">
        <div
          className="mx-auto h-12 w-12 animate-spin border-2 border-ink-violet border-t-butter-yellow"
          aria-hidden="true"
        />
        <div className="space-y-2">
          <p className="text-lg font-bold">{message}</p>
          <p className="text-sm text-ink-violet/80">Mohon tunggu sebentar...</p>
        </div>
      </div>
    </div>
  );
}
