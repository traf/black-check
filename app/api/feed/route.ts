import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";
import { BLACK_CHECK_ONE_SEPOLIA_ADDRESS } from "@/app/lib/constants";

export interface FeedItem {
  id: string;
  userAddress: string;
  userName?: string;
  action: "deposited" | "withdrew";
  checkCount: number;
  timestamp: string;
  timeAgo: string;
  transactionHash: string;
  tokenAddress: string;
  tokenId: number;
  checkImages: string[];
}

function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(Number(timestamp) * 1000);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
}

// Simple in-memory cache to avoid refetching the same tokenId frequently
// Successes cached for 10 minutes; misses (null/404) cached for 5 minutes
const imageCache = new Map<
  number,
  { value: string | null; expiresAt: number }
>();

async function getCheckImage(tokenId: number): Promise<string | null> {
  const now = Date.now();
  const cached = imageCache.get(tokenId);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const controller = new AbortController();
  const timeoutMs = 2000; // fail fast to keep feed responsive
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const url = `${
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  }/api/check/${tokenId}`;
  try {
    // Use absolute URL since this is a server-side API route
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const checkData = await response.json();
      const value: string | null = checkData.image_url || null;
      imageCache.set(tokenId, {
        value,
        expiresAt: Date.now() + 10 * 60 * 1000,
      });
      return value;
    } else {
      console.warn(`Failed to fetch check ${tokenId}: ${response.status}`);
      // Cache negative result to avoid repeated 404s for a while
      imageCache.set(tokenId, {
        value: null,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });
    }
  } catch (error) {
    console.error(`Error fetching check image for token ${tokenId}:`, error);
    // On network/timeout errors, cache short negative to back off retries
    imageCache.set(tokenId, {
      value: null,
      expiresAt: Date.now() + 60 * 1000,
    });
  }
  return null;
}

export async function GET() {
  const routeStartMs = Date.now();
  try {
    console.log("[FEED] Route start");
    // Fetch transfers to and from the BLACK_CHECK_ONE_SEPOLIA_ADDRESS
    const supabaseStartMs = Date.now();
    const { data, error } = await supabase
      .from("Transfer")
      .select("*")
      .or(
        `to.eq.${BLACK_CHECK_ONE_SEPOLIA_ADDRESS.toLowerCase()},from.eq.${BLACK_CHECK_ONE_SEPOLIA_ADDRESS.toLowerCase()}`
      )
      .order("block_number", { ascending: false })
      .limit(50);
    const supabaseDurationMs = Date.now() - supabaseStartMs;
    console.log(
      `[FEED] Supabase query completed in ${supabaseDurationMs}ms (rows: ${
        data?.length ?? 0
      })`
    );

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch feed data" },
        { status: 500 }
      );
    }

    // Transform the database data to match the FeedItem interface
    const transformStartMs = Date.now();
    let imageFetches = 0;
    let imageFetchTotalMs = 0;
    let imageFetchMaxMs = 0;

    // Per-request memoization to dedupe concurrent fetches for the same tokenId
    const imagePromiseCache = new Map<number, Promise<string | null>>();

    const fetchImageWithMetrics = (tokenId: number): Promise<string | null> => {
      const existing = imagePromiseCache.get(tokenId);
      if (existing) return existing;

      const promise = (async () => {
        const imgStartMs = Date.now();
        const result = await getCheckImage(tokenId);
        const imgDurationMs = Date.now() - imgStartMs;
        imageFetches += 1;
        imageFetchTotalMs += imgDurationMs;
        if (imgDurationMs > imageFetchMaxMs) imageFetchMaxMs = imgDurationMs;
        console.log(
          `[FEED] getCheckImage tokenId=${tokenId} took ${imgDurationMs}ms`
        );
        return result;
      })();

      imagePromiseCache.set(tokenId, promise);
      return promise;
    };

    // Concurrency limiter to avoid overwhelming downstream and hitting long tails
    const items = data || [];
    const feedData: FeedItem[] = new Array(items.length);
    const concurrency = 4;
    let index = 0;
    await Promise.all(
      Array.from({ length: Math.min(concurrency, items.length) }).map(
        async () => {
          while (true) {
            const current = index;
            if (current >= items.length) break;
            index += 1;
            const item = items[current];

            const isDeposit =
              item.to?.toLowerCase() ===
              BLACK_CHECK_ONE_SEPOLIA_ADDRESS.toLowerCase();

            let checkImage: string | null = null;
            if (item.token_id) {
              checkImage = await fetchImageWithMetrics(item.token_id);
            }

            feedData[current] = {
              id: item.id,
              userAddress: isDeposit ? item.from! : item.to!,
              userName: undefined, // We don't have user names in the Transfer table
              action: isDeposit ? "deposited" : "withdrew",
              checkCount: 1,
              tokenId: item.token_id || 0,
              timestamp: item.block_timestamp?.toString() || "",
              timeAgo: getTimeAgo(item.block_timestamp?.toString() || ""),
              transactionHash: item.transaction_hash || "",
              tokenAddress: item.token_address || "",
              checkImages: checkImage ? [checkImage] : [],
            } as FeedItem;
          }
        }
      )
    );

    const transformDurationMs = Date.now() - transformStartMs;
    const imageFetchAvgMs =
      imageFetches > 0 ? Math.round(imageFetchTotalMs / imageFetches) : 0;
    console.log(
      `[FEED] Transform completed in ${transformDurationMs}ms (image fetches: ${imageFetches}, total: ${imageFetchTotalMs}ms, avg: ${imageFetchAvgMs}ms, max: ${imageFetchMaxMs}ms)`
    );

    return NextResponse.json({
      success: true,
      data: feedData,
      total: feedData.length,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    // Log total route duration right before function exits
    const routeEndMs = Date.now();
    console.log(
      `[FEED] Route end, total duration: ${routeEndMs - routeStartMs}ms`
    );
  }
}
