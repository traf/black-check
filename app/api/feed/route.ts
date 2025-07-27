import { NextResponse } from "next/server";

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

export async function GET() {
  // Mock data for the feed
  const mockFeedData: FeedItem[] = [
    {
      id: "1",
      userAddress: "0x1234567890abcdef1234567890abcdef12345678",
      userName: "traf.eth",
      action: "deposited",
      checkCount: 2,
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
      timeAgo: "10m ago",
      transactionHash:
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      checkImages: ["/placeholder-check-1.svg", "/placeholder-check-2.svg"],
    },
    {
      id: "2",
      userAddress: "0x4421234567890abcdef1234567890abcdef12345678",
      action: "withdrew",
      checkCount: 2,
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      timeAgo: "15m ago",
      transactionHash:
        "0x4421234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      checkImages: ["/placeholder-check-1.svg", "/placeholder-check-2.svg"],
    },
    {
      id: "3",
      userAddress: "0x789abcdef1234567890abcdef1234567890abcdef",
      userName: "crypto.eth",
      action: "deposited",
      checkCount: 1,
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      timeAgo: "30m ago",
      transactionHash:
        "0x789abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      checkImages: ["/placeholder-check-1.svg"],
    },
    {
      id: "4",
      userAddress: "0xabc1234567890abcdef1234567890abcdef12345678",
      action: "withdrew",
      checkCount: 3,
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
      timeAgo: "45m ago",
      transactionHash:
        "0xabc1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      checkImages: [
        "/placeholder-check-1.svg",
        "/placeholder-check-2.svg",
        "/placeholder-check-1.svg",
      ],
    },
    {
      id: "5",
      userAddress: "0xdef1234567890abcdef1234567890abcdef12345678",
      userName: "artist.eth",
      action: "deposited",
      checkCount: 4,
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
      timeAgo: "1h ago",
      transactionHash:
        "0xdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      checkImages: [
        "/placeholder-check-1.svg",
        "/placeholder-check-2.svg",
        "/placeholder-check-1.svg",
        "/placeholder-check-2.svg",
      ],
    },
  ];

  return NextResponse.json({
    success: true,
    data: mockFeedData,
    total: mockFeedData.length,
  });
}
