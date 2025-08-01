import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

export interface FeedItem {
  id: string;
  userAddress: string;
  userName?: string;
  action: "deposited" | "withdrew";
  checkCount: number;
  timestamp: string;
  timeAgo: string;
  transactionHash: string;
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

export async function GET() {
  try {
    // Try to fetch from Transfer table first
    let { data, error } = await supabase
      .from("Transfer")
      .select("*")
      .order("block_number", { ascending: false })
      .limit(50);

    // If Transfer table doesn't exist, try feed_items as fallback
    if (error && error.code === "42P01") {
      console.log("Transfer table not found, trying feed_items...");
      const fallbackResult = await supabase
        .from("feed_items")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      data = fallbackResult.data as any;
      error = fallbackResult.error;
    }

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch feed data" },
        { status: 500 }
      );
    }

    // Transform the database data to match the FeedItem interface
    const feedData: FeedItem[] =
      (data as any[])?.map((item: any) => {
        // Feed_items table structure (fallback)
        return {
          id: item.id,
          userAddress: item.to,
          userName: item.user_name || undefined,
          action: item.action,
          checkCount: item.check_count,
          timestamp: item.block_timestamp,
          timeAgo: getTimeAgo(item.block_timestamp),
          transactionHash: item.transaction_hash,
          checkImages: [],
        };
      }) || [];

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
