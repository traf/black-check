import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";
import { BLACK_CHECK_ONE_SEPOLIA_ADDRESS } from "@/app/lib/constants";
import { DepositedNFT } from "@/app/components/Tokens";

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

    // Transform the transfer data into deposited NFTs format and fetch metadata
    const depositedNFTs: DepositedNFT[] = [];

    if (transfers) {
      for (const transfer of transfers) {
        const baseNFT: DepositedNFT = {
          tokenId: transfer.token_id || 0,
          from: transfer.from || "",
          to: transfer.to || "",
          tokenAddress: transfer.token_address || "",
          transactionHash: transfer.transaction_hash || "",
          blockNumber: transfer.block_number || 0,
          blockTimestamp: transfer.block_timestamp || 0,
          id: transfer.id,
        };

        // Try to fetch additional NFT metadata from the check API
        try {
          const metadataResponse = await fetch(
            `${request.nextUrl.origin}/api/check/${transfer.token_id}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (metadataResponse.ok) {
            const metadata = await metadataResponse.json();
            baseNFT.name = metadata.name;
            baseNFT.description = metadata.description;
            baseNFT.imageUrl = metadata.image_url;
            baseNFT.displayImageUrl = metadata.display_image_url;
            baseNFT.collection = metadata.collection;
            baseNFT.contract = metadata.contract;
            baseNFT.tokenStandard = metadata.token_standard;
            baseNFT.metadata = metadata.metadata;
          }
        } catch (error) {
          console.warn(
            `Failed to fetch metadata for token ${transfer.token_id}:`,
            error
          );
          // Continue without metadata if fetch fails
        }

        depositedNFTs.push(baseNFT);
      }
    }

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
