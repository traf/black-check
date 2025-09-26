import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";
import { BLACK_CHECK_ONE_SEPOLIA_ADDRESS } from "@/app/lib/constants";
import { DepositedNFT } from "@/app/components/Tokens";
import { zeroAddress } from "viem";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const startTime = Date.now();
  console.log(
    `[${new Date().toISOString()}] Starting deposited-nfts API call for address: ${
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

    // Query the Transfer table for deposited NFTs
    // We want transfers where:
    // - to = BLACK_CHECK_ONE_SEPOLIA_ADDRESS (deposited to contract)
    // - from = user's address (deposited by user)
    // Order by block number descending to get most recent first
    console.log(
      `[${Date.now() - startTime}ms] Starting initial transfers query`
    );
    const { data: transfers, error } = await supabase
      .from("Transfer")
      .select("*")
      .eq("to", BLACK_CHECK_ONE_SEPOLIA_ADDRESS.toLowerCase())
      .eq("from", address.toLowerCase())
      .order("block_number", { ascending: false });
    console.log(
      `[${Date.now() - startTime}ms] Initial transfers query completed. Found ${
        transfers?.length || 0
      } transfers`
    );

    if (error) {
      console.error("Database query error:", error);
      return NextResponse.json(
        { error: "Failed to query database" },
        { status: 500 }
      );
    }

    // Filter to only include the most recent deposit for each token
    // Since we ordered by block_number desc, we can use a Set to track seen token IDs
    const seenTokenIds = new Set<number>();
    const uniqueTransfers =
      transfers?.filter((transfer) => {
        if (transfer.token_id && !seenTokenIds.has(transfer.token_id)) {
          seenTokenIds.add(transfer.token_id);
          return true;
        }
        return false;
      }) || [];

    console.log(
      `[${Date.now() - startTime}ms] Filtered to ${
        uniqueTransfers.length
      } unique token deposits (from ${transfers?.length || 0} total transfers)`
    );

    // Transform the transfer data into deposited NFTs format and fetch metadata
    const depositedNFTs: DepositedNFT[] = [];

    if (uniqueTransfers.length > 0) {
      console.log(
        `[${Date.now() - startTime}ms] Starting processing of ${
          uniqueTransfers.length
        } unique transfers`
      );

      // Batch query for all received NFTs at once
      const transactionHashes = uniqueTransfers
        .map((t) => t.transaction_hash)
        .filter(Boolean);
      console.log(
        `[${Date.now() - startTime}ms] Batch querying for received NFTs (${
          transactionHashes.length
        } transactions)`
      );

      const { data: allReceivedNFTs, error: receivedError } = await supabase
        .from("Transfer")
        .select("token_id, transaction_hash")
        .eq("from", zeroAddress)
        .eq("to", address.toLowerCase())
        .in("transaction_hash", transactionHashes);

      console.log(
        `[${
          Date.now() - startTime
        }ms] Batch received NFT query completed. Found ${
          allReceivedNFTs?.length || 0
        } received NFTs`
      );

      // Create a map for quick lookup
      const receivedNFTMap = new Map<string, number>();
      if (!receivedError && allReceivedNFTs) {
        for (const receivedNFT of allReceivedNFTs) {
          if (receivedNFT.transaction_hash && receivedNFT.token_id) {
            receivedNFTMap.set(
              receivedNFT.transaction_hash,
              receivedNFT.token_id
            );
          }
        }
      }

      // Get unique token IDs to avoid duplicate metadata fetches
      const uniqueTokenIds = [
        ...new Set(uniqueTransfers.map((t) => t.token_id).filter(Boolean)),
      ];
      console.log(
        `[${Date.now() - startTime}ms] Fetching metadata for ${
          uniqueTokenIds.length
        } unique tokens via batch API`
      );

      // Fetch all metadata in a single batch request
      let metadataMap = new Map<number, any>();
      try {
        const batchResponse = await fetch(
          `${request.nextUrl.origin}/api/check/batch`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ tokenIds: uniqueTokenIds }),
          }
        );

        if (batchResponse.ok) {
          const batchResults = await batchResponse.json();
          console.log(
            `[${
              Date.now() - startTime
            }ms] Batch metadata fetch completed. Found ${
              Object.keys(batchResults).length
            } metadata entries`
          );

          // Convert results to map
          for (const [tokenId, metadata] of Object.entries(batchResults)) {
            metadataMap.set(parseInt(tokenId), metadata);
          }
        } else {
          console.warn(
            `[${
              Date.now() - startTime
            }ms] Batch metadata fetch failed with status: ${
              batchResponse.status
            }`
          );
        }
      } catch (error) {
        console.warn(
          `[${Date.now() - startTime}ms] Batch metadata fetch failed:`,
          error
        );
      }

      // Process transfers with pre-fetched data
      for (let i = 0; i < uniqueTransfers.length; i++) {
        const transfer = uniqueTransfers[i];
        console.log(
          `[${Date.now() - startTime}ms] Processing transfer ${i + 1}/${
            uniqueTransfers.length
          } (token_id: ${transfer.token_id})`
        );

        const receivedTokenId = transfer.transaction_hash
          ? receivedNFTMap.get(transfer.transaction_hash) || null
          : null;

        const baseNFT: DepositedNFT = {
          tokenId: transfer.token_id || 0,
          from: transfer.from || "",
          to: transfer.to || "",
          tokenAddress: transfer.token_address || "",
          transactionHash: transfer.transaction_hash || "",
          blockNumber: transfer.block_number || 0,
          blockTimestamp: transfer.block_timestamp || 0,
          id: transfer.id || "",
          receivedTokenId: receivedTokenId,
        };

        // Add metadata if available
        const metadata = metadataMap.get(transfer.token_id || 0);
        if (metadata) {
          baseNFT.name = metadata.name;
          baseNFT.description = metadata.description;
          baseNFT.imageUrl = metadata.image_url;
          baseNFT.displayImageUrl = metadata.display_image_url;
          baseNFT.collection = metadata.collection;
          baseNFT.contract = metadata.contract;
          baseNFT.tokenStandard = metadata.token_standard;
          baseNFT.metadata = metadata.metadata;
        }

        depositedNFTs.push(baseNFT);
        console.log(
          `[${Date.now() - startTime}ms] Completed processing transfer ${
            i + 1
          }/${uniqueTransfers.length}`
        );
      }
    }
    console.log(
      `[${
        Date.now() - startTime
      }ms] Finished processing all transfers. Total deposited NFTs: ${
        depositedNFTs.length
      }`
    );

    console.log(
      `[${Date.now() - startTime}ms] API call completed successfully`
    );
    return NextResponse.json({
      depositedNfts: depositedNFTs,
      address: address,
      contractAddress: BLACK_CHECK_ONE_SEPOLIA_ADDRESS,
      count: depositedNFTs.length,
    });
  } catch (error) {
    console.error(`[${Date.now() - startTime}ms] API route error:`, error);
    return NextResponse.json(
      {
        error: "Failed to fetch deposited NFTs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
