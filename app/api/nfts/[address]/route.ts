import {
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
  { params }: { params: Promise<{ address: string }> }
) {
  const startTime = Date.now();
  console.log(
    `[${new Date().toISOString()}] Starting NFTs API call for address: ${
      (await params).address
    }`
  );

  try {
    const { address } = await params;
    console.log(`[${Date.now() - startTime}ms] Address validation completed`);

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

    console.log(
      `[${Date.now() - startTime}ms] Starting parallel fetch from ${
        COLLECTION_CONTRACTS.length
      } collections`
    );

    // Fetch NFTs from all collections in parallel
    const fetchPromises = COLLECTION_CONTRACTS.map(async (contractAddress) => {
      const url = `${baseUrl}/getNFTs?owner=${address}&contractAddresses[]=${contractAddress}&withMetadata=true&pageSize=100&orderBy=transferTime`;

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
            // Transform Alchemy response to match expected format
            const transformedNFTs = data.ownedNfts.map((nft: any) => ({
              identifier: BigInt(nft.id.tokenId).toString(),
              name: nft.title || `#${BigInt(nft.id.tokenId).toString()}`,
              description: nft.description || "",
              image_url: nft.media?.[0]?.gateway || nft.media?.[0]?.raw || "",
              collection: nft.contract.name || "",
              contract: nft.contract.address,
              token_standard: nft.tokenType,
              metadata: nft.metadata || {},
            }));

            console.log(
              `[${Date.now() - startTime}ms] Found ${
                transformedNFTs.length
              } NFTs in ${contractAddress}`
            );
            return { contractAddress, nfts: transformedNFTs, success: true };
          } else {
            console.log(
              `[${
                Date.now() - startTime
              }ms] No NFTs found in ${contractAddress}`
            );
            return { contractAddress, nfts: [], success: true };
          }
        } else {
          const errorText = await response.text();
          console.error(
            `[${
              Date.now() - startTime
            }ms] Alchemy API error for ${contractAddress}:`,
            response.status,
            response.statusText,
            `URL: ${url}`,
            `Error details: ${errorText}`
          );
          return {
            contractAddress,
            nfts: [],
            success: false,
            error: errorText,
          };
        }
      } catch (error) {
        console.error(
          `[${Date.now() - startTime}ms] Error fetching ${contractAddress}:`,
          error
        );
        return { contractAddress, nfts: [], success: false, error: error };
      }
    });

    // Wait for all collection fetches to complete
    const results = await Promise.all(fetchPromises);
    console.log(
      `[${Date.now() - startTime}ms] All collection fetches completed`
    );

    // Combine all NFTs from successful requests
    const allNFTs = results
      .filter((result) => result.success)
      .flatMap((result) => result.nfts);

    const totalFound = results.reduce(
      (sum, result) => sum + result.nfts.length,
      0
    );
    const successfulCollections = results.filter(
      (result) => result.success
    ).length;

    console.log(
      `[${
        Date.now() - startTime
      }ms] Found ${totalFound} total NFTs from ${successfulCollections}/${
        COLLECTION_CONTRACTS.length
      } collections`
    );

    console.log(
      `[${Date.now() - startTime}ms] NFTs API call completed successfully`
    );
    return NextResponse.json({ nfts: allNFTs });
  } catch (error) {
    console.error(`[${Date.now() - startTime}ms] NFTs API route error:`, error);
    return NextResponse.json(
      {
        error: "Failed to fetch NFTs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
