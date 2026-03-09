interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="mx-4 my-3 p-3 bg-red-50 border border-red-200 rounded-lg">
      <p className="text-sm text-red-700">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}
