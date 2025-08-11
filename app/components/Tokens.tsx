"use client";

import { usePrivy, useLogin } from "@privy-io/react-auth";
import { useState, useEffect, useCallback } from "react";
import { createWalletClient, createPublicClient, custom, http } from "viem";
import { sepolia } from "viem/chains";
import Check from "./Check";
import Button from "./Button";
import Modal from "./Modal";
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
  const { login } = useLogin();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNfts, setSelectedNfts] = useState<Set<string>>(new Set());
  const [approvalStatus, setApprovalStatus] = useState<{
    editions: boolean;
    originals: boolean;
  }>({ editions: false, originals: false });
  const [showApprovalPrompt, setShowApprovalPrompt] = useState(false);
  const [showDepositPrompt, setShowDepositPrompt] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState({
    editions: false,
    originals: false,
  });
  const [depositLoading, setDepositLoading] = useState(false);

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

      setApprovalLoading(prev => ({ ...prev, [contractType]: true }));
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



      // Wait for transaction to be mined before updating status
      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(),
      });

      await publicClient.waitForTransactionReceipt({ hash });

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

      setApprovalLoading(prev => ({ ...prev, [contractType]: false }));
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

      // Show deposit confirmation modal
      setShowDepositPrompt(true);
      setLoading(false);
    } catch (err) {
      console.error("Error in handleDeposit:", err);
      setError("Failed to process deposit. Please try again.");
      setLoading(false);
    }
  };

  const performDeposit = async () => {
    if (!user?.wallet?.address) return;

    try {
      setDepositLoading(true);
      setError(null);

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



      // Wait for transaction to be mined before updating status
      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(),
      });

      await publicClient.waitForTransactionReceipt({ hash });

      // Clear selected NFTs after successful deposit
      setSelectedNfts(new Set());

      // Refresh the NFT list
      await fetchTokens();

      // Close the deposit modal
      setShowDepositPrompt(false);
    } catch (err) {
      console.error("Error depositing NFTs:", err);
      setError("Failed to deposit NFTs. Please try again.");
    } finally {
      setDepositLoading(false);
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

  if (!ready) {
    return (
      <div className="flex-center flex-col w-full h-full p-16">
        <img src="/check-token.png" alt="black check" className="w-72" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex flex-col w-full h-full">
        <div className="flex-center flex-col w-full h-full p-16">
          <img src="/check-token.png" alt="black check" className="w-72" />
        </div>
        <div className="w-full flex-center bg-neutral-950/75 backdrop-blur-sm border-t border-neutral-800 flex-shrink-0">
            <Button
              onClick={login}
              variant="ghost"
              className="flex-1 h-14"
            >
              Connect wallet to deposit or withdraw checks
            </Button>
        </div>
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
    <>
      {/* Approval Prompt Modal */}
      <Modal
        isOpen={showApprovalPrompt}
        onClose={() => setShowApprovalPrompt(false)}
        title="Approve NFT Transfers"
        subtitle="In order to deposit your Checks, you'll need to approve the Black Check One contract to transfer your NFTs."
        closeText="Cancel"
        primaryText="Deposit"
        onPrimaryAction={async () => {
          setShowApprovalPrompt(false);
          await performDeposit();
        }}
        primaryDisabled={!approvalStatus.editions || !approvalStatus.originals}
      >

        <Button
          onClick={async () => {
            if (approvalStatus.editions) return;
            try {
              await requestApproval("editions");
            } catch (err) {
              console.error("Error approving editions:", err);
            }
          }}
          variant="border"
          disabled={approvalLoading.editions || approvalStatus.editions}
          className="flex justify-between group !p-5"
          size="sm"
        >
          Checks Editions
          <span className="bg-white/10 py-2 px-3 text-neutral-400 group-hover:text-white flex items-center gap-2">
            {approvalStatus.editions ? (
              <>
                Approved
                <img src="/check-light.svg" alt="approved" className="w-4" />
              </>
            ) : approvalLoading.editions ? (
              "Approving..."
            ) : (
              "Approve"
            )}
          </span>
        </Button>

        <Button
          onClick={async () => {
            if (approvalStatus.originals) return;
            try {
              await requestApproval("originals");
            } catch (err) {
              console.error("Error approving originals:", err);
            }
          }}
          variant="border"
          disabled={approvalLoading.originals || approvalStatus.originals}
          className="flex justify-between group !p-5"
          size="sm"
        >
          Checks Originals
          <span className="bg-white/10 py-2 px-3 text-neutral-400 group-hover:text-white flex items-center gap-2">
            {approvalStatus.originals ? (
              <>
                Approved
                <img src="/check-light.svg" alt="approved" className="w-4" />
              </>
            ) : approvalLoading.originals ? (
              "Approving..."
            ) : (
              "Approve"
            )}
          </span>
        </Button>
      </Modal>

      {/* Deposit Confirmation Modal */}
      <Modal
        isOpen={showDepositPrompt}
        onClose={() => setShowDepositPrompt(false)}
        title="Confirm Deposit"
        subtitle={`You're about to deposit ${selectedNfts.size} Check${selectedNfts.size !== 1 ? "s" : ""} to the Black Check contract. You can withdraw them up until the Black check is created.`}
        closeText="Cancel"
        closeDisabled={depositLoading}
        primaryText={depositLoading ? "Depositing..." : "Confirm Deposit"}
        onPrimaryAction={performDeposit}
        primaryDisabled={depositLoading}
        primaryLoading={depositLoading}
      >
        <h3>Selected Checks:</h3>
        <div className="max-h-36 overflow-y-auto space-y-1">
          {Array.from(selectedNfts).map((identifier) => {
            const nft = nfts.find((n) => n.identifier === identifier);
            return (
              <div key={identifier} className="flex items-center gap-1.5 text-sm">
                <p className="text-white">#{identifier}</p>
                <p>[{nft?.collection === "vv-checks-originals" ? "Original" : "Edition"}]</p>
              </div>
            );
          })}
        </div>
      </Modal>

      <div className="flex-1 overflow-y-auto w-full overflow-x-hidden">
        <div className="grid grid-cols-2">
          {nfts.map((nft, index) => {
            const isSelected = selectedNfts.has(nft.identifier);
            const isEvenIndex = index % 2 === 0;
            const isLastItemOdd =
              nfts.length % 2 === 1 && index === nfts.length - 1;
            return (
              <button
                key={nft.identifier}
                className={`relative cursor-pointer mix-blend-lighten group border-b border-neutral-800 ${isEvenIndex ? "border-r border-neutral-800" : ""
                  } ${isLastItemOdd ? "border-b-0 border-r border-neutral-800" : ""
                  }`}
                onClick={() => toggleNftSelection(nft.identifier)}
              >
                {(nft.display_image_url || nft.image_url) && (
                  <img
                    src={nft.display_image_url || nft.image_url}
                    alt={`Checks #${nft.identifier}`}
                    className={`w-full h-full object-cover relative -my-4 group-hover:opacity-60 ${isSelected && "blur-[2px] opacity-60"
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
        <div className="w-full flex justify-between h-full">
          {!authenticated ? (
            <Button
              onClick={login}
              variant="secondary"
              className="flex-1 h-full"
            >
              Connect wallet to deposit checks
            </Button>
          ) : selectedNfts.size > 0 ? (
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
          {authenticated && (
            <Button
              variant="tertiary"
              className="w-40 h-full border-l border-neutral-800"
              onClick={handleSelectAllToggle}
            >
              {selectedNfts.size === nfts.length ? "Deselect all" : "Select all"}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
