"use client";

interface BadgeProps {
  title?: string;
  loading?: boolean;
  error?: string;
  completed?: boolean;
  completedText?: string;
  pendingText?: string;
}

export default function Badge({
  title,
  loading = false,
  error,
  completed = false,
  completedText = "Completed",
  pendingText = "In progress",
}: BadgeProps) {
  const getTitle = () => {
    if (title) return title;
    if (loading) return "Loading...";
    if (error) return `Error: ${error}`;
    return completed ? completedText : pendingText;
  };

  return (
    <div className="bg-neutral-900 rounded-full border border-neutral-800 w-fit py-1.5 px-3">
      <div className="flex items-center gap-2">
        {!loading && !error && (
          <div className={`w-2 h-2 rounded-full animate-pulse ${completed ? "bg-green-500" : "bg-amber-500"}`}></div>
        )}
        <h2 className={`text-sm ${error ? "text-red-400" : loading ? "text-neutral-400" : "text-white"}`}>
          {getTitle()}
        </h2>
      </div>
    </div>
  );
}
