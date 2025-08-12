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

async function getCheckImage(tokenId: number): Promise<string | null> {
  const url = `${
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  }/api/check/${tokenId}`;
  try {
    // Use absolute URL since this is a server-side API route
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (response.ok) {
      const checkData = await response.json();
      return checkData.image_url || null;
    } else {
      console.warn(`Failed to fetch check ${tokenId}: ${response.status}`);
    }
  } catch (error) {
    console.error(`Error fetching check image for token ${tokenId}:`, error);
  }
  return null;
}

export async function GET() {
  try {
    // Fetch transfers to and from the BLACK_CHECK_ONE_SEPOLIA_ADDRESS
    const { data, error } = await supabase
      .from("Transfer")
      .select("*")
      .or(
        `to.eq.${BLACK_CHECK_ONE_SEPOLIA_ADDRESS.toLowerCase()},from.eq.${BLACK_CHECK_ONE_SEPOLIA_ADDRESS.toLowerCase()}`
      )
      .order("block_number", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch feed data" },
        { status: 500 }
      );
    }

    // Transform the database data to match the FeedItem interface
    const feedData: FeedItem[] = [];

    for (const item of data || []) {
      const isDeposit =
        item.to?.toLowerCase() ===
        BLACK_CHECK_ONE_SEPOLIA_ADDRESS.toLowerCase();

      // Fetch check image if we have a token_id
      let checkImage = null;
      if (item.token_id) {
        checkImage = await getCheckImage(item.token_id);
      }

      feedData.push({
        id: item.id,
        userAddress: isDeposit ? item.from! : item.to!,
        userName: undefined, // We don't have user names in the Transfer table
        action: isDeposit ? "deposited" : "withdrew",
        checkCount: 1,
        timestamp: item.block_timestamp?.toString() || "",
        timeAgo: getTimeAgo(item.block_timestamp?.toString() || ""),
        transactionHash: item.transaction_hash || "",
        tokenAddress: item.token_address || "",
        checkImages: checkImage ? [checkImage] : [],
      });
    }

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
  }
}
