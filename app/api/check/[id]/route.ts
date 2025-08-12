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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Check ID is required" },
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

    // Try to find the check in each collection
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
            // Find the specific NFT with the matching token ID
            const targetNft = data.ownedNfts.find(
              (nft: any) => BigInt(nft.id.tokenId).toString() === id
            );

            if (targetNft) {
              // Transform Alchemy response to match expected format
              const transformedCheck = {
                identifier: BigInt(targetNft.id.tokenId).toString(),
                name:
                  targetNft.title ||
                  `#${BigInt(targetNft.id.tokenId).toString()}`,
                description: targetNft.description || "",
                image_url:
                  targetNft.media?.[0]?.gateway ||
                  targetNft.media?.[0]?.raw ||
                  "",
                display_image_url:
                  targetNft.media?.[0]?.gateway ||
                  targetNft.media?.[0]?.raw ||
                  "",
                collection: targetNft.contract.name || "",
                contract: targetNft.contract.address,
                token_standard: targetNft.tokenType,
                metadata: targetNft.metadata || {},
              };

              return NextResponse.json(transformedCheck);
            }
          }
        }
      } catch (error) {
        console.error(
          `Error fetching check ${id} from ${contractAddress}:`,
          error
        );
        continue;
      }
    }

    // If we get here, the check wasn't found in any collection
    return NextResponse.json({ error: "Check not found" }, { status: 404 });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch check",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
