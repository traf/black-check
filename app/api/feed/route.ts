import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";
import { BLACK_CHECK_ONE_SEPOLIA_ADDRESS } from "@/app/lib/constants";

export interface FeedItem {
  id: string;
  userAddress: string;
  userName?: string;
  action: "deposited" | "withdrew" | "minted";
  checkCount: number;
  timestamp: string;
  timeAgo: string;
  transactionHash: string;
  tokenAddress: string;
  tokenId: number;
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

export async function GET() {
  const routeStartMs = Date.now();
  try {
    console.log("[FEED] Route start");
    // Fetch transfers to and from the BLACK_CHECK_ONE_SEPOLIA_ADDRESS, and from 0x0 (mints)
    const supabaseStartMs = Date.now();
    const { data, error } = await supabase
      .from("Transfer")
      .select("*")
      .or(
        `to.eq.${BLACK_CHECK_ONE_SEPOLIA_ADDRESS.toLowerCase()},from.eq.${BLACK_CHECK_ONE_SEPOLIA_ADDRESS.toLowerCase()},from.eq.0x0000000000000000000000000000000000000000`
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
    const items = data || [];

    // Transform items to feed data
    const feedData: FeedItem[] = items.map((item) => {
      const isDeposit =
        item.to?.toLowerCase() ===
        BLACK_CHECK_ONE_SEPOLIA_ADDRESS.toLowerCase();
      const isMint =
        item.from?.toLowerCase() ===
        "0x0000000000000000000000000000000000000000";

      let action: "deposited" | "withdrew" | "minted";
      let userAddress: string;

      if (isMint) {
        action = "minted";
        userAddress = item.to!; // The recipient of the mint
      } else if (isDeposit) {
        action = "deposited";
        userAddress = item.from!; // The depositor
      } else {
        action = "withdrew";
        userAddress = item.to!; // The withdrawer
      }

      return {
        id: item.id,
        userAddress,
        userName: undefined, // We don't have user names in the Transfer table
        action,
        checkCount: 1,
        tokenId: item.token_id || 0,
        timestamp: item.block_timestamp?.toString() || "",
        timeAgo: getTimeAgo(item.block_timestamp?.toString() || ""),
        transactionHash: item.transaction_hash || "",
        tokenAddress: item.token_address || "",
      } as FeedItem;
    });

    const transformDurationMs = Date.now() - transformStartMs;
    console.log(`[FEED] Transform completed in ${transformDurationMs}ms`);

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
