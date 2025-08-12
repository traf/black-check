import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

// Interface for Alchemy webhook payload
interface AlchemyWebhookPayload {
  createdAt: string;
  event: {
    category: string;
    erc1155Metadata?: Array<{
      tokenId: string;
      value: string;
    }>;
    fromAddress: string;
    toAddress: string;
    log: {
      address: string;
      blockHash: string;
      blockNumber: string;
      data: string;
      logIndex: string;
      removed: boolean;
      topics: string[];
      transactionHash: string;
      transactionIndex: string;
    };
  };
  id: string;
  type: string;
  webhookId: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse the webhook payload
    const payload: AlchemyWebhookPayload = await request.json();

    console.log("Received Alchemy webhook:", {
      id: payload.id,
      type: payload.type,
      category: payload.event.category,
      fromAddress: payload.event.fromAddress,
      toAddress: payload.event.toAddress,
      transactionHash: payload.event.log.transactionHash,
      blockNumber: payload.event.log.blockNumber,
    });

    // Validate the payload
    if (
      !payload.event ||
      !payload.event.log ||
      !payload.event.log.transactionHash
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    // Handle different event types
    switch (payload.type) {
      case "NFT_ACTIVITY":
        await handleNFTActivity(payload);
        break;
      default:
        console.log(`Unhandled webhook type: ${payload.type}`);
    }

    // Store webhook data in database for tracking
    await storeWebhookData(payload);

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    console.error("Error processing Alchemy webhook:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleNFTActivity(payload: AlchemyWebhookPayload) {
  try {
    const { event } = payload;

    // Extract relevant data
    const fromAddress = event.fromAddress;
    const toAddress = event.toAddress;
    const transactionHash = event.log.transactionHash;
    const blockNumber = parseInt(event.log.blockNumber, 16);
    const blockTimestamp = Math.floor(
      new Date(payload.createdAt).getTime() / 1000
    ); // Convert to Unix timestamp

    // Handle ERC-1155 transfers
    if (event.category === "erc1155" && event.erc1155Metadata) {
      for (const metadata of event.erc1155Metadata) {
        const tokenId = metadata.tokenId;
        const value = parseInt(metadata.value, 16);

        // Store transfer data
        await storeTransferData({
          from: fromAddress,
          to: toAddress,
          tokenId,
          value,
          transactionHash,
          blockNumber,
          blockTimestamp,
        });
      }
    }

    console.log(
      `Processed NFT activity: ${fromAddress} -> ${toAddress} (${transactionHash})`
    );
  } catch (error) {
    console.error("Error handling NFT activity:", error);
    throw error;
  }
}

async function storeTransferData(transferData: {
  from: string;
  to: string;
  tokenId: string;
  value: number;
  transactionHash: string;
  blockNumber: number;
  blockTimestamp: number;
}) {
  try {
    console.log("Attempting to store transfer data:", {
      from: transferData.from,
      to: transferData.to,
      tokenId: transferData.tokenId,
      value: transferData.value,
      transactionHash: transferData.transactionHash,
      blockNumber: transferData.blockNumber,
      blockTimestamp: transferData.blockTimestamp,
    });

    const { data, error } = await supabase.from("Transfer").insert({
      id: `${transferData.transactionHash}_${transferData.tokenId}`,
      token_id: parseInt(transferData.tokenId) || 0,
      from: transferData.from,
      to: transferData.to,
      block_number: transferData.blockNumber,
      block_timestamp: transferData.blockTimestamp,
      transaction_hash: transferData.transactionHash,
    });

    if (error) {
      console.error("Error storing transfer data:", error);
      throw error;
    }

    console.log("Transfer data stored successfully:", data);
  } catch (error) {
    console.error("Error storing transfer data:", error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }
    throw error;
  }
}

async function storeWebhookData(payload: AlchemyWebhookPayload) {
  try {
    // Store webhook data in the Transfer table as a log entry
    const { data, error } = await supabase.from("Transfer").insert({
      id: `${payload.event.log.transactionHash}_${payload.event.log.logIndex}`,
      token_id: 0, // Use 0 for webhook logs
      from: "webhook",
      to: "system",
      block_number: parseInt(payload.event.log.blockNumber, 16),
      block_timestamp: Math.floor(new Date(payload.createdAt).getTime() / 1000),
      transaction_hash: payload.event.log.transactionHash,
    });

    if (error) {
      console.error("Error storing webhook log:", error);
      // Don't throw here as this is not critical for the main webhook processing
    }
  } catch (error) {
    console.error("Error storing webhook log:", error);
    // Don't throw here as this is not critical for the main webhook processing
  }
}

// Handle GET requests (for webhook verification)
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Alchemy webhook endpoint is active",
  });
}
