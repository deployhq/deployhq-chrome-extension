interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-deployhq-600 border-t-transparent" />
      {message && <p className="text-xs text-gray-500 dark:text-gray-400">{message}</p>}
    </div>
  );
}
