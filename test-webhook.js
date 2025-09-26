// Test script for the enhanced Alchemy webhook
// This simulates the webhook payload you provided

const testPayload = {
  webhookId: "wh_zdlkt27k5x4d1bbk",
  id: "whevt_6fsjjfawxlj6fw96",
  createdAt: "2025-09-26T19:18:48.502Z",
  type: "NFT_ACTIVITY",
  event: {
    network: "ETH_SEPOLIA",
    activity: [
      {
        fromAddress: "0x0000000000000000000000000000000000000000",
        toAddress: "0x6140f00e4ff3936702e68744f2b5978885464cbb",
        contractAddress: "0x57d74ff9303283cd19461c80e90e6ae59222675c",
        blockNum: "0x8db177",
        hash: "0xe038710d64121951b29bf846680cbc38f47b752b23160ca6ddd88c550f7f30fc",
        erc721TokenId: "0xf",
        category: "erc721",
        log: {
          address: "0x57d74ff9303283cd19461c80e90e6ae59222675c",
          topics: [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            "0x0000000000000000006140f00e4ff3936702e68744f2b5978885464cbb",
            "0x000000000000000000000000000000000000000000000000000000000000000f",
          ],
          data: "0x",
          blockHash:
            "0xad3cf74062efe4e2ad5d460c58549ff589dcb1140ffe3be9327fb7cace00c9d6",
          blockNumber: "0x8db177",
          blockTimestamp: "0x68d6e718",
          transactionHash:
            "0xe038710d64121951b29bf846680cbc38f47b752b23160ca6ddd88c550f7f30fc",
          transactionIndex: "0x5",
          logIndex: "0x7",
          removed: false,
        },
      },
    ],
    source: "chainlake-kafka",
  },
};

async function testWebhook() {
  try {
    console.log("Testing enhanced webhook with payload:");
    console.log(JSON.stringify(testPayload, null, 2));

    const response = await fetch("http://localhost:3000/api/webhook/alchemy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
    });

    const result = await response.json();
    console.log("Webhook response:", result);

    if (response.ok) {
      console.log("✅ Webhook test successful!");
    } else {
      console.log("❌ Webhook test failed:", result);
    }
  } catch (error) {
    console.error("Error testing webhook:", error);
  }
}

// Run the test
testWebhook();
