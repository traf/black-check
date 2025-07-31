"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useState, useEffect, useCallback } from "react";
import { createWalletClient, createPublicClient, custom, http } from "viem";
import { sepolia } from "viem/chains";
import Check from "./Check";
import Button from "./Button";
import { BLACK_CHECK_ONE_ABI, ORIGINALS_ABI, EDITIONS_ABI } from "../lib/abi";
import {
  CHECKS_EDITIONS_SEPOLIA_ADDRESS,
  CHECKS_ORIGINALS_SEPOLIA_ADDRESS,
  BLACK_CHECK_ONE_SEPOLIA_ADDRESS as CONTRACT_ADDRESS,
} from "../lib/constants";

interface NFT {
  identifier: string;
  contract: string;
  collection: string;
  image_url: string;
  display_image_url: string;
}

export default function Tokens() {
  const { user, ready, authenticated } = usePrivy();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNfts, setSelectedNfts] = useState<Set<string>>(new Set());
  const [approvalStatus, setApprovalStatus] = useState<{
    editions: boolean;
    originals: boolean;
  }>({ editions: false, originals: false });
  const [showApprovalPrompt, setShowApprovalPrompt] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);

  const toggleNftSelection = (identifier: string) => {
    setSelectedNfts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(identifier)) {
        newSet.delete(identifier);
      } else {
        newSet.add(identifier);
      }
      return newSet;
    });
  };

  const handleSelectAllToggle = () => {
    if (selectedNfts.size === nfts.length) {
      // All selected, deselect all
      setSelectedNfts(new Set());
    } else {
      // Not all selected, select all
      setSelectedNfts(new Set(nfts.map((nft) => nft.identifier)));
    }
  };

  const checkApprovalStatus = async () => {
    if (!user?.wallet?.address) return;

    try {
      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(),
      });

      // Check approval for Editions contract
      const editionsApproved = await publicClient.readContract({
        address: CHECKS_EDITIONS_SEPOLIA_ADDRESS as `0x${string}`,
        abi: EDITIONS_ABI,
        functionName: "isApprovedForAll",
        args: [
          user.wallet.address as `0x${string}`,
          CONTRACT_ADDRESS as `0x${string}`,
        ],
      });

      // Check approval for Originals contract
      const originalsApproved = await publicClient.readContract({
        address: CHECKS_ORIGINALS_SEPOLIA_ADDRESS as `0x${string}`,
        abi: ORIGINALS_ABI,
        functionName: "isApprovedForAll",
        args: [
          user.wallet.address as `0x${string}`,
          CONTRACT_ADDRESS as `0x${string}`,
        ],
      });

      setApprovalStatus({
        editions: editionsApproved as boolean,
        originals: originalsApproved as boolean,
      });

      return {
        editions: editionsApproved as boolean,
        originals: originalsApproved as boolean,
      };
    } catch (err) {
      console.error("Error checking approval status:", err);
      return { editions: false, originals: false };
    }
  };

  const requestApproval = async (contractType: "editions" | "originals") => {
    if (!user?.wallet?.address) return;

    try {
      setApprovalLoading(true);
      setError(null);

      if (!window.ethereum) {
        throw new Error("No Ethereum provider found");
      }

      const walletClient = createWalletClient({
        chain: sepolia,
        transport: custom(window.ethereum as any),
      });

      const contractAddress =
        contractType === "editions"
          ? CHECKS_EDITIONS_SEPOLIA_ADDRESS
          : CHECKS_ORIGINALS_SEPOLIA_ADDRESS;
      const contractAbi =
        contractType === "editions" ? EDITIONS_ABI : ORIGINALS_ABI;

      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: contractAbi,
        functionName: "setApprovalForAll",
        args: [CONTRACT_ADDRESS as `0x${string}`, true],
        account: user.wallet.address as `0x${string}`,
      });

      console.log(`${contractType} approval transaction hash:`, hash);

      // Update approval status
      setApprovalStatus((prev) => ({
        ...prev,
        [contractType]: true,
      }));

      // Refresh approval status to ensure it's up to date
      await checkApprovalStatus();

      return hash;
    } catch (err) {
      console.error(`Error requesting ${contractType} approval:`, err);
      setError(`Failed to approve ${contractType}. Please try again.`);
      throw err;
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!user?.wallet?.address || selectedNfts.size === 0) return;

    try {
      setLoading(true);
      setError(null);

      // Check approval status first
      const approvalStatus = await checkApprovalStatus();

      if (!approvalStatus) {
        throw new Error("Failed to check approval status");
      }

      // Check if we need approvals for the selected NFTs
      const selectedNftData = nfts.filter((nft) =>
        selectedNfts.has(nft.identifier)
      );
      const hasEditions = selectedNftData.some(
        (nft) =>
          nft.contract.toLowerCase() ===
          CHECKS_EDITIONS_SEPOLIA_ADDRESS.toLowerCase()
      );
      const hasOriginals = selectedNftData.some(
        (nft) =>
          nft.contract.toLowerCase() ===
          CHECKS_ORIGINALS_SEPOLIA_ADDRESS.toLowerCase()
      );

      // If approvals are needed, show approval prompt
      if (
        (hasEditions && !approvalStatus.editions) ||
        (hasOriginals && !approvalStatus.originals)
      ) {
        setShowApprovalPrompt(true);
        setLoading(false);
        return;
      }

      // Proceed with deposit if all approvals are in place
      await performDeposit();
    } catch (err) {
      console.error("Error in handleDeposit:", err);
      setError("Failed to process deposit. Please try again.");
      setLoading(false);
    }
  };

  const performDeposit = async () => {
    if (!user?.wallet?.address) return;

    try {
      if (!window.ethereum) {
        throw new Error("No Ethereum provider found");
      }

      const walletClient = createWalletClient({
        chain: sepolia,
        transport: custom(window.ethereum as any),
      });

      // Separate selected NFTs into editions and originals
      const selectedNftData = nfts.filter((nft) =>
        selectedNfts.has(nft.identifier)
      );
      const editionsTokenIds = selectedNftData
        .filter(
          (nft) =>
            nft.contract.toLowerCase() ===
            CHECKS_EDITIONS_SEPOLIA_ADDRESS.toLowerCase()
        )
        .map((nft) => BigInt(nft.identifier));
      const originalsTokenIds = selectedNftData
        .filter(
          (nft) =>
            nft.contract.toLowerCase() ===
            CHECKS_ORIGINALS_SEPOLIA_ADDRESS.toLowerCase()
        )
        .map((nft) => BigInt(nft.identifier));

      // Call the contribute function
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: BLACK_CHECK_ONE_ABI,
        functionName: "contribute",
        args: [editionsTokenIds, originalsTokenIds],
        account: user.wallet.address as `0x${string}`,
      });

      console.log("Transaction hash:", hash);

      // Clear selected NFTs after successful deposit
      setSelectedNfts(new Set());

      // Refresh the NFT list
      await fetchTokens();
    } catch (err) {
      console.error("Error depositing NFTs:", err);
      setError("Failed to deposit NFTs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTokens = useCallback(async () => {
    if (!user?.wallet?.address) return;

    setLoading(true);
    setError(null);

    try {
      // Use our API route to fetch NFTs securely
      const response = await fetch(`/api/nfts/${user.wallet.address}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();
      // Sort NFTs: originals first, then editions, then by token ID
      const sortedNfts = (data.nfts || []).sort((a: NFT, b: NFT) => {
        // First sort by collection (originals first)
        if (
          a.collection === "vv-checks-originals" &&
          b.collection !== "vv-checks-originals"
        ) {
          return -1;
        }
        if (
          b.collection === "vv-checks-originals" &&
          a.collection !== "vv-checks-originals"
        ) {
          return 1;
        }
        // Then sort by token ID numerically
        return parseInt(a.identifier) - parseInt(b.identifier);
      });
      setNfts(sortedNfts);
    } catch (err) {
      console.error("Error fetching NFTs:", err);
      setError(
        "Failed to fetch NFTs. This might be due to network issues or API rate limits."
      );
    } finally {
      setLoading(false);
    }
  }, [user?.wallet?.address]);

  useEffect(() => {
    if (!ready || !authenticated || !user?.wallet?.address) {
      return;
    }

    fetchTokens();
    checkApprovalStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authenticated, user?.wallet?.address]);

  if (!ready || !authenticated) {
    return (
      <div className="flex-center flex-col w-full h-full p-16">
        <img src="/check-token.png" alt="black check" className="w-72" />
      </div>
    );
  }

  if (loading) {
    return <div className="flex-center text-white">Loading Checks...</div>;
  }

  if (error) {
    return (
      <div className="flex-center flex-col gap-8">
        <p className="text-white">{error}</p>
        <Button onClick={fetchTokens} size="sm">
          Reload tokens
        </Button>
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="flex-center flex-col gap-8">
        <Check variant="x" className="w-12" />
        <p className="text-white">No Checks found.</p>
        <Button
          href="https://opensea.io/collection/vv-checks-originals"
          target="_blank"
          size="sm"
        >
          View on opensea
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Approval Prompt Modal */}
      {showApprovalPrompt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-white text-lg font-semibold mb-4">
              Approve NFT Transfers
            </h3>
            <p className="text-neutral-300 mb-6">
              To deposit your Checks, you need to approve the Black Check One
              contract to transfer your NFTs.
            </p>

            <div className="space-y-3 mb-6">
              {!approvalStatus.editions && (
                <div className="flex items-center justify-between p-3 bg-neutral-800 rounded">
                  <span className="text-white">Checks Editions</span>
                  <Button
                    onClick={async () => {
                      try {
                        await requestApproval("editions");
                      } catch (err) {
                        console.error("Error approving editions:", err);
                      }
                    }}
                    variant="secondary"
                    size="sm"
                    disabled={approvalLoading}
                  >
                    {approvalLoading ? "Approving..." : "Approve"}
                  </Button>
                </div>
              )}

              {!approvalStatus.originals && (
                <div className="flex items-center justify-between p-3 bg-neutral-800 rounded">
                  <span className="text-white">Checks Originals</span>
                  <Button
                    onClick={async () => {
                      try {
                        await requestApproval("originals");
                      } catch (err) {
                        console.error("Error approving originals:", err);
                      }
                    }}
                    variant="secondary"
                    size="sm"
                    disabled={approvalLoading}
                  >
                    {approvalLoading ? "Approving..." : "Approve"}
                  </Button>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowApprovalPrompt(false)}
                variant="ghost"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  setShowApprovalPrompt(false);
                  await performDeposit();
                }}
                variant="secondary"
                className="flex-1"
                disabled={!approvalStatus.editions || !approvalStatus.originals}
              >
                Deposit
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="grid grid-cols-2">
          {nfts.map((nft, index) => {
            const isSelected = selectedNfts.has(nft.identifier);
            const isEvenIndex = index % 2 === 0;
            const isLastItemOdd =
              nfts.length % 2 === 1 && index === nfts.length - 1;
            return (
              <button
                key={nft.identifier}
                className={`relative cursor-pointer mix-blend-lighten group border-b border-neutral-800 ${
                  isEvenIndex ? "border-r border-neutral-800" : ""
                } ${
                  isLastItemOdd ? "border-b-0 border-r border-neutral-800" : ""
                }`}
                onClick={() => toggleNftSelection(nft.identifier)}
              >
                {(nft.display_image_url || nft.image_url) && (
                  <img
                    src={nft.display_image_url || nft.image_url}
                    alt={`Checks #${nft.identifier}`}
                    className={`w-full h-full object-cover relative -my-4 group-hover:opacity-60 ${
                      isSelected && "blur-[2px] opacity-60"
                    }`}
                    onError={(e) => {
                      // Hide broken images
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}
                <p className="absolute bottom-6 w-full text-center">
                  #{nft.identifier}
                </p>
                {isSelected && (
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Check className="w-6 h-6" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="w-full h-14 flex-center bg-neutral-950/75 backdrop-blur-sm border-t border-neutral-800 flex-shrink-0">
        <div className="w-full flex-between h-full">
          {selectedNfts.size > 0 ? (
            <Button
              onClick={handleDeposit}
              variant="secondary"
              className="flex-1 h-full hover:bg-neutral/5"
            >
              Deposit {selectedNfts.size} check
              {selectedNfts.size !== 1 ? "s" : ""}
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="flex-1 h-full pointer-events-none"
            >
              Select checks to deposit
            </Button>
          )}
          <Button
            variant="tertiary"
            className="w-40 h-full border-l border-neutral-800"
            onClick={handleSelectAllToggle}
          >
            {selectedNfts.size === nfts.length ? "Deselect all" : "Select all"}
          </Button>
        </div>
      </div>
    </div>
  );
}
