"use client";

import { useEffect, useState } from "react";
import { FeedItem } from "../api/feed/route";

export default function Feed() {
  const [feedData, setFeedData] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeedData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/feed");
        if (!response.ok) {
          throw new Error("Failed to fetch feed data");
        }
        const result = await response.json();
        setFeedData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchFeedData();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-neutral-400">Loading feed...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="w-full max-h-96 overflow-y-auto space-y-4 divide-y divide-dashed divide-neutral-800 relative z-50">
      {feedData.map((item) => (
        <div key={item.id} className="w-full h-full flex flex-col gap-4 pb-5">
          <div className="flex items-center justify-between w-full">
            <p className="w-full">
              <span className="text-white">
                {item.userName ||
                  `${item.userAddress.slice(0, 6)}...${item.userAddress.slice(
                    -4
                  )}`}
              </span>{" "}
              {item.action} {item.checkCount} check
              {item.checkCount !== 1 ? "s" : ""} (#{item.tokenId})
            </p>
            <p className="flex-shrink-0">{item.timeAgo}</p>
            <a
              href={`https://etherscan.io/tx/${item.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-center p-2 opacity-50 hover:opacity-100"
            >
              <img src="/arrow.svg" alt="tx" />
            </a>
          </div>
          <div className="flex flex-row gap-3">
            {item.checkImages.map((image, index) => (
              <div
                key={index}
                className="w-16 h-16 border border-neutral-800 overflow-hidden"
              >
                <img
                  src={image}
                  alt="check"
                  className="w-full h-full object-cover scale-120"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
