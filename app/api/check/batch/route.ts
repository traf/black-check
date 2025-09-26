import {
  BLACK_CHECK_ONE_SEPOLIA_ADDRESS,
  CHECKS_EDITIONS_MAINNET_ADDRESS,
  CHECKS_EDITIONS_SEPOLIA_ADDRESS,
  CHECKS_ORIGINALS_MAINNET_ADDRESS,
  CHECKS_ORIGINALS_SEPOLIA_ADDRESS,
} from "@/app/lib/constants";
import { NextRequest, NextResponse } from "next/server";

const COLLECTION_CONTRACTS_SEPOLIA = [
  CHECKS_EDITIONS_SEPOLIA_ADDRESS,
  CHECKS_ORIGINALS_SEPOLIA_ADDRESS,
];

const COLLECTION_CONTRACTS_MAINNET = [
  CHECKS_EDITIONS_MAINNET_ADDRESS,
  CHECKS_ORIGINALS_MAINNET_ADDRESS,
];

export async function POST(request: NextRequest) {
  try {
    const { tokenIds } = await request.json();

    if (!tokenIds || !Array.isArray(tokenIds) || tokenIds.length === 0) {
      return NextResponse.json(
        { error: "tokenIds array is required" },
        { status: 400 }
      );
    }

    // Check for Alchemy API key
    const alchemyApiKey = process.env.ALCHEMY_API_KEY;
    if (!alchemyApiKey) {
      return NextResponse.json(
        { error: "Alchemy API key not configured" },
        { status: 500 }
      );
    }

    // Determine network from environment variable
    const network = process.env.NEXT_PUBLIC_NETWORK || "mainnet";
    const baseUrl =
      network === "sepolia"
        ? `https://eth-sepolia.g.alchemy.com/nft/v2/${alchemyApiKey}`
        : `https://eth-mainnet.g.alchemy.com/nft/v2/${alchemyApiKey}`;

    let COLLECTION_CONTRACTS = [];
    if (network === "sepolia") {
      COLLECTION_CONTRACTS = COLLECTION_CONTRACTS_SEPOLIA;
    } else {
      COLLECTION_CONTRACTS = COLLECTION_CONTRACTS_MAINNET;
    }

    const results: Record<string, any> = {};

    // Try to find the checks in each collection
    for (const contractAddress of COLLECTION_CONTRACTS) {
      // Use getNFTsForCollection to get NFTs from the collection
      const url = `${baseUrl}/getNFTs?contractAddress=${contractAddress}&withMetadata=true&limit=100&owner=${BLACK_CHECK_ONE_SEPOLIA_ADDRESS}`;

      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            accept: "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();

          if (data.ownedNfts && data.ownedNfts.length > 0) {
            // Find NFTs with matching token IDs
            for (const nft of data.ownedNfts) {
              const tokenId = BigInt(nft.id.tokenId).toString();
              if (tokenIds.includes(tokenId)) {
                // Transform Alchemy response to match expected format
                const transformedCheck = {
                  identifier: tokenId,
                  name: nft.title || `#${tokenId}`,
                  description: nft.description || "",
                  image_url:
                    nft.media?.[0]?.gateway || nft.media?.[0]?.raw || "",
                  display_image_url:
                    nft.media?.[0]?.gateway || nft.media?.[0]?.raw || "",
                  collection: nft.contract.name || "",
                  contract: nft.contract.address,
                  token_standard: nft.tokenType,
                  metadata: nft.metadata || {},
                };

                results[tokenId] = transformedCheck;
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching checks from ${contractAddress}:`, error);
        continue;
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Batch check API route error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch checks",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
