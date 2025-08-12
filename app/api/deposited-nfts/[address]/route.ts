import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";
import { BLACK_CHECK_ONE_SEPOLIA_ADDRESS } from "@/app/lib/constants";

export interface DepositedNFT {
  tokenId: number;
  from: string;
  to: string;
  tokenAddress: string;
  transactionHash: string;
  blockNumber: number;
  blockTimestamp: number;
  id: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }

    // Validate address format (basic check)
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: "Invalid address format" },
        { status: 400 }
      );
    }

    // Query the Transfer table for deposited NFTs
    // We want transfers where:
    // - to = BLACK_CHECK_ONE_SEPOLIA_ADDRESS (deposited to contract)
    // - from = user's address (deposited by user)
    const { data: transfers, error } = await supabase
      .from("Transfer")
      .select("*")
      .eq("to", BLACK_CHECK_ONE_SEPOLIA_ADDRESS.toLowerCase())
      .eq("from", address.toLowerCase());

    if (error) {
      console.error("Database query error:", error);
      return NextResponse.json(
        { error: "Failed to query database" },
        { status: 500 }
      );
    }

    // Transform the transfer data into deposited NFTs format
    const depositedNFTs: DepositedNFT[] =
      transfers?.map((transfer) => ({
        tokenId: transfer.token_id || 0,
        from: transfer.from || "",
        to: transfer.to || "",
        tokenAddress: transfer.token_address || "",
        transactionHash: transfer.transaction_hash || "",
        blockNumber: transfer.block_number || 0,
        blockTimestamp: transfer.block_timestamp || 0,
        id: transfer.id,
      })) || [];

    return NextResponse.json({
      depositedNfts: depositedNFTs,
      address: address,
      contractAddress: BLACK_CHECK_ONE_SEPOLIA_ADDRESS,
      count: depositedNFTs.length,
    });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch deposited NFTs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
