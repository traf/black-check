import { useState, useEffect } from "react";

interface CheckArtProps {
  checkId: number;
  level: number;
  size?: number;
  className?: string;
}

interface CheckData {
  identifier: string;
  image_url: string;
  display_image_url: string;
  collection: string;
}

export default function CheckArt({
  checkId,
  level,
  size = 100,
  className = "",
}: CheckArtProps) {
  const [checkData, setCheckData] = useState<CheckData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCheckData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to fetch check data from the API
        const response = await fetch(`/api/check/${checkId}`);

        if (response.ok) {
          const data = await response.json();
          setCheckData(data);
        } else {
          // If API fails, we'll show a placeholder
          setError("Failed to load check data");
        }
      } catch (err) {
        console.error("Error fetching check data:", err);
        setError("Failed to load check data");
      } finally {
        setLoading(false);
      }
    };

    fetchCheckData();
  }, [checkId]);

  if (loading) {
    return (
      <div
        className={`relative bg-neutral-800 rounded-lg overflow-hidden ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-xs text-neutral-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !checkData) {
    return (
      <div
        className={`relative bg-neutral-800 rounded-lg overflow-hidden ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-xs text-neutral-400">#{checkId}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative bg-neutral-800 rounded-lg overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={checkData.display_image_url || checkData.image_url}
        alt={`Check #${checkId}`}
        className="w-full h-full object-cover"
        onError={(e) => {
          // Hide broken images and show fallback
          e.currentTarget.style.display = "none";
          e.currentTarget.nextElementSibling?.classList.remove("hidden");
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center hidden">
        <div className="text-xs text-neutral-400">#{checkId}</div>
      </div>
      <div className="absolute bottom-1 right-1 text-xs font-mono text-neutral-400 bg-black/50 px-1 rounded">
        #{checkId}
      </div>
    </div>
  );
}
