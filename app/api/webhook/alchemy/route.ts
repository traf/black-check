import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

// Interface for Alchemy webhook payload
interface AlchemyWebhookPayload {
  createdAt: string;
  event: {
    network?: string;
    activity?: any;
    source?: string;
    // Legacy fields for older webhook format
    category?: string;
    erc721TokenId?: string;
    erc1155Metadata?: Array<{
      tokenId: string;
      value: string;
    }>;
    fromAddress?: string;
    toAddress?: string;
    log?: {
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

    // Add detailed logging to debug the payload structure
    console.log(
      "Received Alchemy webhook payload:",
      JSON.stringify(payload, null, 2)
    );
    console.log("Payload structure check:", {
      hasEvent: !!payload.event,
      hasLog: !!payload.event?.log,
      eventKeys: payload.event ? Object.keys(payload.event) : [],
      logKeys: payload.event?.log ? Object.keys(payload.event.log) : [],
    });

    // Safe access to properties with detailed logging
    const event = payload.event;
    const log = event?.log;

    console.log("Received Alchemy webhook:", {
      id: payload.id,
      type: payload.type,
      format: event?.network ? "new" : "legacy",
      category: event?.category,
      fromAddress: event?.fromAddress,
      toAddress: event?.toAddress,
      transactionHash: log?.transactionHash,
      blockNumber: log?.blockNumber,
      network: event?.network,
      source: event?.source,
    });

    // Validate the payload with detailed error messages
    if (!event) {
      console.error("Missing event property in webhook payload");
      return NextResponse.json(
        { success: false, error: "Missing event property in webhook payload" },
        { status: 400 }
      );
    }

    // Check if this is a new format webhook (with network, activity, source)
    if (event.network && event.activity && event.source) {
      console.log("Processing new format webhook with activity data");
      // Handle new format webhook
      await handleNewFormatWebhook(payload);
      return NextResponse.json({
        success: true,
        message: "New format webhook processed successfully",
      });
    }

    // Check for legacy format with log data
    if (!log) {
      console.error("Missing log property in webhook event", {
        eventKeys: Object.keys(event),
      });
      return NextResponse.json(
        { success: false, error: "Missing log property in webhook event" },
        { status: 400 }
      );
    }

    if (!log.transactionHash) {
      console.error("Missing transactionHash in webhook log", {
        logKeys: Object.keys(log),
      });
      return NextResponse.json(
        { success: false, error: "Missing transactionHash in webhook log" },
        { status: 400 }
      );
    }

    // Handle different event types (only for legacy format)
    switch (payload.type) {
      case "NFT_ACTIVITY":
        await handleNFTActivity(payload);
        break;
      default:
        console.log(`Unhandled webhook type: ${payload.type}`);
    }

    // Store webhook data in database for tracking (non-critical)
    try {
      await storeWebhookData(payload);
    } catch (webhookStoreError) {
      console.error(
        "Failed to store webhook data (non-critical):",
        webhookStoreError
      );
      // Continue processing as this is not critical
    }

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

async function handleNewFormatWebhook(payload: AlchemyWebhookPayload) {
  try {
    const { event } = payload;

    console.log("Processing new format webhook:", {
      network: event.network,
      source: event.source,
      activity: event.activity,
    });

    // Log the activity data for debugging
    console.log("Activity data:", JSON.stringify(event.activity, null, 2));

    // Process each activity item in the array
    if (event.activity && Array.isArray(event.activity)) {
      for (const activity of event.activity) {
        try {
          await processActivityItem(activity, payload.createdAt);
        } catch (activityError) {
          // Check if it's a duplicate key error - these are expected and should not fail the entire webhook
          if (
            activityError &&
            typeof activityError === "object" &&
            "code" in activityError &&
            activityError.code === "23505"
          ) {
            console.log(
              `Activity already processed (duplicate): ${activity.hash}_${activity.erc721TokenId}`
            );
            continue; // Continue processing other activities
          }

          // For other errors, log and continue processing other activities
          console.error(
            "Error processing individual activity item:",
            activityError
          );
          continue;
        }
      }
    }

    console.log("New format webhook processed successfully");
  } catch (error) {
    console.error("Error handling new format webhook:", error);
    throw error;
  }
}

async function processActivityItem(activity: any, createdAt: string) {
  try {
    // Extract data from the activity
    const fromAddress = activity.fromAddress;
    const toAddress = activity.toAddress;
    const contractAddress = activity.contractAddress;
    const blockNum = activity.blockNum;
    const hash = activity.hash;
    const erc721TokenId = activity.erc721TokenId;
    const category = activity.category;

    // Validate required fields
    if (!fromAddress || !toAddress || !hash || !erc721TokenId) {
      console.warn("Missing required fields in activity:", {
        fromAddress,
        toAddress,
        hash,
        erc721TokenId,
      });
      return;
    }

    // Convert hex values to appropriate formats
    const blockNumber = parseInt(blockNum, 16);
    const tokenId = parseInt(erc721TokenId, 16);
    const blockTimestamp = Math.floor(new Date(createdAt).getTime() / 1000);

    // Store the transfer data
    await storeTransferData({
      from: fromAddress.toLowerCase(),
      to: toAddress.toLowerCase(),
      tokenId: tokenId.toString(),
      value: 1, // ERC721 transfers always have value of 1
      transactionHash: hash,
      blockNumber,
      blockTimestamp,
      contractAddress: contractAddress?.toLowerCase(),
    });

    console.log(`Processed activity: ${fromAddress} -> ${toAddress} (${hash})`);
  } catch (error) {
    // Check if it's a duplicate key error - these are expected and should not be treated as failures
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      console.log(
        `Activity item already processed (duplicate): ${activity.hash}_${activity.erc721TokenId}`
      );
      return;
    }

    console.error("Error processing activity item:", error);
    throw error;
  }
}

async function handleNFTActivity(payload: AlchemyWebhookPayload) {
  try {
    const { event } = payload;
    const log = event.log;

    // Ensure log exists before proceeding
    if (!log) {
      throw new Error("Log data is required for NFT activity processing");
    }

    // Ensure required fields exist
    if (!event.fromAddress || !event.toAddress) {
      throw new Error("Missing fromAddress or toAddress in webhook event");
    }

    // Extract relevant data with safe access
    const fromAddress = event.fromAddress;
    const toAddress = event.toAddress;
    const transactionHash = log.transactionHash;
    const blockNumber = parseInt(log.blockNumber, 16);
    const blockTimestamp = Math.floor(
      new Date(payload.createdAt).getTime() / 1000
    ); // Convert to Unix timestamp

    // Handle ERC-1155 transfers
    if (event.category === "erc721" && event.erc721TokenId) {
      // Store transfer data
      await storeTransferData({
        from: fromAddress,
        to: toAddress,
        tokenId: event.erc721TokenId,
        value: 1,
        transactionHash,
        blockNumber,
        blockTimestamp,
      });
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
  contractAddress?: string;
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
      contractAddress: transferData.contractAddress,
    });

    const transferId = `${transferData.transactionHash}_${transferData.tokenId}`;

    // First check if the transfer already exists
    const { data: existingTransfer, error: checkError } = await supabase
      .from("Transfer")
      .select("id")
      .eq("id", transferId)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found" error, which is expected for new transfers
      console.error("Error checking for existing transfer:", checkError);
      throw checkError;
    }

    if (existingTransfer) {
      console.log(`Transfer already exists: ${transferId}, skipping duplicate`);
      return;
    }

    // Insert the new transfer
    const { data, error } = await supabase.from("Transfer").insert({
      id: transferId,
      token_id: parseInt(transferData.tokenId) || 0,
      from: transferData.from,
      to: transferData.to,
      token_address: transferData.contractAddress || null,
      block_number: transferData.blockNumber,
      block_timestamp: transferData.blockTimestamp,
      transaction_hash: transferData.transactionHash,
    });

    if (error) {
      // Check if it's a duplicate key error (race condition)
      if (error.code === "23505") {
        console.log(
          `Transfer already exists (race condition): ${transferId}, skipping duplicate`
        );
        return;
      }
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
    const { event } = payload;

    // Handle new format webhook
    if (event.network && event.activity) {
      console.log("Storing new format webhook data");
      // For new format, we'll store basic info without log data
      const { data, error } = await supabase.from("Transfer").insert({
        id: `${payload.id}_${Date.now()}`,
        token_id: 0, // Use 0 for webhook logs
        from: "webhook",
        to: "system",
        block_number: 0, // No block number in new format
        block_timestamp: Math.floor(
          new Date(payload.createdAt).getTime() / 1000
        ),
        transaction_hash: payload.id, // Use webhook ID as transaction hash
      });

      if (error) {
        console.error("Error storing new format webhook log:", error);
      }
      return;
    }

    // Handle legacy format webhook
    const log = event.log;
    if (!log) {
      console.error("Cannot store webhook data: log is undefined");
      return;
    }

    // Store webhook data in the Transfer table as a log entry
    const { data, error } = await supabase.from("Transfer").insert({
      id: `${log.transactionHash}_${log.logIndex}`,
      token_id: 0, // Use 0 for webhook logs
      from: "webhook",
      to: "system",
      block_number: parseInt(log.blockNumber, 16),
      block_timestamp: Math.floor(new Date(payload.createdAt).getTime() / 1000),
      transaction_hash: log.transactionHash,
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
