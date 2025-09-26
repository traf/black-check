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
    console.log(`[Batch API] Received tokenIds:`, tokenIds);

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

    // Create all possible URL combinations (tokenId x contractAddress)
    const fetchPromises: Array<{
      tokenId: string;
      contractAddress: string;
      promise: Promise<any>;
    }> = [];

    for (const tokenId of tokenIds) {
      for (const contractAddress of COLLECTION_CONTRACTS) {
        const url = `${baseUrl}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${tokenId}`;

        const promise = fetch(url, {
          method: "GET",
          headers: {
            accept: "application/json",
          },
        })
          .then(async (response) => {
            if (response.ok) {
              const nft = await response.json();
              if (nft && nft.id) {
                return {
                  tokenId,
                  contractAddress,
                  nft,
                  success: true,
                };
              }
            }
            return {
              tokenId,
              contractAddress,
              success: false,
            };
          })
          .catch((error) => {
            console.error(
              `Error fetching check ${tokenId} from ${contractAddress}:`,
              error
            );
            return {
              tokenId,
              contractAddress,
              success: false,
            };
          });

        fetchPromises.push({ tokenId, contractAddress, promise });
      }
    }

    // Wait for all requests to complete
    const responses = await Promise.all(fetchPromises.map((p) => p.promise));
    console.log(
      `[Batch API] Completed ${responses.length} requests, ${
        responses.filter((r) => r.success).length
      } successful`
    );

    // Process results, prioritizing first successful result for each tokenId
    for (const response of responses) {
      if (response.success && !results[response.tokenId]) {
        const nft = response.nft;
        // Transform Alchemy response to match expected format
        const transformedCheck = {
          identifier: BigInt(nft.id.tokenId).toString(),
          name: nft.title || `#${BigInt(nft.id.tokenId).toString()}`,
          description: nft.description || "",
          image_url: nft.media?.[0]?.gateway || nft.media?.[0]?.raw || "",
          display_image_url:
            nft.media?.[0]?.gateway || nft.media?.[0]?.raw || "",
          collection: nft.contract.name || "",
          contract: nft.contract.address,
          token_standard: nft.tokenType,
          metadata: nft.metadata || {},
        };

        results[response.tokenId] = transformedCheck;
        console.log(`[Batch API] Found metadata for token ${response.tokenId}`);
      }
    }

    console.log(
      `[Batch API] Returning ${Object.keys(results).length} results:`,
      Object.keys(results)
    );
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
