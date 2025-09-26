"use client";

import { usePrivy, useLogin } from "@privy-io/react-auth";
import { useState, useEffect, useCallback } from "react";
import { createWalletClient, createPublicClient, custom, http } from "viem";
import { mainnet, sepolia } from "viem/chains";
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

export interface DepositedNFT {
  tokenId: number;
  from: string;
  to: string;
  tokenAddress: string;
  transactionHash: string;
  blockNumber: number;
  blockTimestamp: number;
  id: string;
  receivedTokenId?: number | null; // Token ID of the NFT received for this deposit
  // Add NFT metadata fields
  name?: string;
  description?: string;
  imageUrl?: string;
  displayImageUrl?: string;
  collection?: string;
  contract?: string;
  tokenStandard?: string;
  metadata?: any;
}

export default function Tokens() {
  const { user, ready, authenticated } = usePrivy();
  const { login } = useLogin();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [depositedNfts, setDepositedNfts] = useState<DepositedNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDepositedNfts, setLoadingDepositedNfts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNfts, setSelectedNfts] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [approvalStatus, setApprovalStatus] = useState<{
    editions: boolean;
    originals: boolean;
  }>({ editions: false, originals: false });
  const [showApprovalPrompt, setShowApprovalPrompt] = useState(false);
  const [showDepositPrompt, setShowDepositPrompt] = useState(false);
  const [showWithdrawPrompt, setShowWithdrawPrompt] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState({
    editions: false,
    originals: false,
  });
  const [depositLoading, setDepositLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [chainSwitching, setChainSwitching] = useState(false);
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [depositedCount, setDepositedCount] = useState(0);

  // Chain switching utilities
  const getTargetChain = () => {
    return process.env.NEXT_PUBLIC_NETWORK === "sepolia" ? sepolia : mainnet;
  };

  const checkCurrentChain = async () => {
    if (!window.ethereum) return;

    try {
      const targetChain = getTargetChain();
      const currentChainId = await (window.ethereum as any).request({
        method: "eth_chainId",
      });
      const isCorrectChain =
        currentChainId === `0x${targetChain.id.toString(16)}`;
      setWrongNetwork(!isCorrectChain);
    } catch (error) {
      console.error("Error checking current chain:", error);
    }
  };

  const checkAndSwitchChain = async () => {
    if (!window.ethereum) {
      throw new Error("No Ethereum provider found");
    }

    const targetChain = getTargetChain();
    const currentChainId = await (window.ethereum as any).request({
      method: "eth_chainId",
    });

    if (currentChainId !== `0x${targetChain.id.toString(16)}`) {
      setChainSwitching(true);
      try {
        // Try to switch to the target chain
        await (window.ethereum as any).request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${targetChain.id.toString(16)}` }],
        });
      } catch (switchError: any) {
        // If the chain is not added to the wallet, add it
        if (switchError.code === 4902) {
          try {
            await (window.ethereum as any).request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: `0x${targetChain.id.toString(16)}`,
                  chainName: targetChain.name,
                  nativeCurrency: targetChain.nativeCurrency,
                  rpcUrls: targetChain.rpcUrls.default.http,
                  blockExplorerUrls: targetChain.blockExplorers
                    ? [targetChain.blockExplorers.default.url]
                    : undefined,
                },
              ],
            });
          } catch (addError: any) {
            if (addError.code === 4001) {
              throw new Error(
                "User rejected adding the network to their wallet"
              );
            } else {
              throw new Error(
                `Failed to add network: ${addError.message || "Unknown error"}`
              );
            }
          }
        } else if (switchError.code === 4001) {
          throw new Error("User rejected switching to the required network");
        } else {
          throw new Error(
            `Failed to switch network: ${
              switchError.message || "Unknown error"
            }`
          );
        }
      } finally {
        setChainSwitching(false);
      }
    }
  };

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
    const currentNfts = activeTab === "deposit" ? nfts : depositedNfts;
    if (selectedNfts.size === currentNfts.length) {
      // All selected, deselect all
      setSelectedNfts(new Set());
    } else {
      // Not all selected, select all
      setSelectedNfts(
        new Set(
          currentNfts.map((nft) =>
            activeTab === "deposit"
              ? (nft as NFT).identifier
              : (nft as DepositedNFT).tokenId.toString()
          )
        )
      );
    }
  };

  const checkApprovalStatus = async () => {
    if (!user?.wallet?.address) return;

    try {
      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(
          `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
        ),
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
      setApprovalLoading((prev) => ({ ...prev, [contractType]: true }));
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

      // Check and switch chain if needed
      await checkAndSwitchChain();

      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: contractAbi,
        functionName: "setApprovalForAll",
        args: [CONTRACT_ADDRESS as `0x${string}`, true],
        account: user.wallet.address as `0x${string}`,
        chain:
          process.env.NEXT_PUBLIC_NETWORK === "sepolia" ? sepolia : mainnet,
      });

      // Wait for transaction to be mined before updating status
      const publicClient = createPublicClient({
        chain:
          process.env.NEXT_PUBLIC_NETWORK === "sepolia" ? sepolia : mainnet,
        transport: http(
          `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
        ),
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
      setApprovalLoading((prev) => ({ ...prev, [contractType]: false }));
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

      // Check and switch chain if needed
      await checkAndSwitchChain();

      // Call the contribute function
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: BLACK_CHECK_ONE_ABI,
        functionName: "contribute",
        args: [editionsTokenIds, originalsTokenIds],
        account: user.wallet.address as `0x${string}`,
        chain:
          process.env.NEXT_PUBLIC_NETWORK === "sepolia" ? sepolia : mainnet,
      });

      // Wait for transaction to be mined before updating status
      const publicClient = createPublicClient({
        chain:
          process.env.NEXT_PUBLIC_NETWORK === "sepolia" ? sepolia : mainnet,
        transport: http(
          `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
        ),
      });

      console.log("!!!Waiting for receipt", hash);

      await publicClient.waitForTransactionReceipt({ hash });

      console.log("!!!Receipt mined", hash);

      // Store the count of deposited NFTs for celebration
      setDepositedCount(selectedNfts.size);

      // Clear selected NFTs after successful deposit
      setSelectedNfts(new Set());

      // Refresh the NFT lists
      await Promise.all([fetchTokens(), fetchDepositedTokens()]);

      // Close the deposit modal and show celebration
      setShowDepositPrompt(false);
      setShowCelebration(true);
    } catch (err) {
      console.error("Error depositing NFTs:", err);
      setError("Failed to deposit NFTs. Please try again.");
    } finally {
      setDepositLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user?.wallet?.address || selectedNfts.size === 0) return;

    setShowWithdrawPrompt(true);
  };

  const performWithdraw = async () => {
    if (!user?.wallet?.address) return;

    setWithdrawLoading(true);
    setError(null);

    try {
      if (!window.ethereum) {
        throw new Error("No Ethereum provider found");
      }

      const walletClient = createWalletClient({
        chain:
          process.env.NEXT_PUBLIC_NETWORK === "sepolia"
            ? sepolia
            : process.env.NEXT_PUBLIC_NETWORK === "mainnet"
            ? mainnet
            : sepolia,
        transport: custom(window.ethereum as any),
      });

      // Check and switch chain if needed
      await checkAndSwitchChain();

      // Get the received token IDs directly from the selected deposited NFTs
      const receivedTokenIds: bigint[] = [];

      for (const selectedIdentifier of selectedNfts) {
        // Find the corresponding deposited NFT to get the receivedTokenId
        const depositedNFT = depositedNfts.find(
          (nft) => nft.tokenId.toString() === selectedIdentifier
        );

        if (depositedNFT?.receivedTokenId) {
          receivedTokenIds.push(BigInt(depositedNFT.receivedTokenId));
        } else {
          console.warn(
            `No received token ID found for deposited NFT ${selectedIdentifier}`
          );
        }
      }

      if (receivedTokenIds.length === 0) {
        throw new Error(
          "No valid received token IDs found for the selected deposited NFTs"
        );
      }

      // Call the refund function with the received token IDs
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: BLACK_CHECK_ONE_ABI,
        functionName: "refund",
        args: [receivedTokenIds],
        account: user.wallet.address as `0x${string}`,
        chain:
          process.env.NEXT_PUBLIC_NETWORK === "sepolia"
            ? sepolia
            : process.env.NEXT_PUBLIC_NETWORK === "mainnet"
            ? mainnet
            : sepolia,
      });

      // Wait for transaction to be mined
      const publicClientForReceipt = createPublicClient({
        chain:
          process.env.NEXT_PUBLIC_NETWORK === "sepolia"
            ? sepolia
            : process.env.NEXT_PUBLIC_NETWORK === "mainnet"
            ? mainnet
            : sepolia,
        transport: http(
          `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
        ),
      });

      console.log("!!!Waiting for receipt");

      await publicClientForReceipt.waitForTransactionReceipt({ hash });

      console.log("!!!Withdrawal successful");

      // Clear selected NFTs after successful withdrawal
      setSelectedNfts(new Set());

      // Refresh the NFT lists
      await Promise.all([fetchTokens(), fetchDepositedTokens()]);

      // Close the withdraw modal
      setShowWithdrawPrompt(false);
    } catch (err) {
      console.error("Error withdrawing NFTs:", err);
      setError("Failed to withdraw NFTs. Please try again.");
    } finally {
      setWithdrawLoading(false);
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

  const fetchDepositedTokens = useCallback(async () => {
    if (!user?.wallet?.address) return;

    setLoadingDepositedNfts(true);
    setError(null);

    try {
      // Fetch deposited NFTs from our API route
      const response = await fetch(
        `/api/deposited-nfts/${user.wallet.address}`
      );

      if (response.ok) {
        const data = await response.json();
        setDepositedNfts(data.depositedNfts || []);
      } else {
        console.error("Failed to fetch deposited NFTs:", response.status);
        setDepositedNfts([]);
      }
    } catch (err) {
      console.error("Error fetching deposited NFTs:", err);
      setDepositedNfts([]);
    } finally {
      setLoadingDepositedNfts(false);
    }
  }, [user?.wallet?.address]);

  useEffect(() => {
    if (!ready || !authenticated || !user?.wallet?.address) {
      return;
    }

    fetchTokens();
    fetchDepositedTokens();
    checkApprovalStatus();
    // Check current chain on mount
    checkCurrentChain();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authenticated, user?.wallet?.address]);

  // Listen for chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleChainChanged = () => {
      checkCurrentChain();
    };

    (window.ethereum as any).on("chainChanged", handleChainChanged);

    return () => {
      (window.ethereum as any).removeListener(
        "chainChanged",
        handleChainChanged
      );
    };
  }, []);

  // Clear selected NFTs when switching tabs
  useEffect(() => {
    setSelectedNfts(new Set());
  }, [activeTab]);

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
          <Button onClick={login} variant="ghost" className="flex-1 h-14">
            Connect wallet to deposit or withdraw checks
          </Button>
        </div>
      </div>
    );
  }

  if (loading || loadingDepositedNfts) {
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

  // Handle empty states
  const currentNfts = activeTab === "deposit" ? nfts : depositedNfts;
  const isEmpty = currentNfts.length === 0;

  console.log("!!!", currentNfts);
  const EmptyState = () => (
    <div className="flex-center flex-col gap-8 h-full">
      <Check variant="x" className="w-12" />
      <p className="text-white text-balance text-center">
        {activeTab === "deposit"
          ? "No Checks to deposit."
          : "No Checks to withdraw."}
      </p>
      {activeTab === "deposit" && (
        <Button
          href="https://opensea.io/collection/vv-checks-originals"
          target="_blank"
          size="sm"
        >
          View on opensea
        </Button>
      )}
    </div>
  );

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
        {chainSwitching && (
          <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/40 rounded-lg">
            <div className="flex items-center gap-2 text-blue-300">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-300"></div>
              <span className="text-sm">
                Switching to{" "}
                {process.env.NEXT_PUBLIC_NETWORK === "sepolia"
                  ? "Sepolia"
                  : "Mainnet"}{" "}
                network...
              </span>
            </div>
          </div>
        )}
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
        subtitle={`You're about to deposit ${selectedNfts.size} Check${
          selectedNfts.size !== 1 ? "s" : ""
        } to the Black Check contract. You can withdraw them up until the Black check is created.`}
        closeText="Cancel"
        closeDisabled={depositLoading}
        primaryText={depositLoading ? "Depositing..." : "Confirm Deposit"}
        onPrimaryAction={performDeposit}
        primaryDisabled={depositLoading}
        primaryLoading={depositLoading}
      >
        {chainSwitching && (
          <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/40 rounded-lg">
            <div className="flex items-center gap-2 text-blue-300">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-300"></div>
              <span className="text-sm">
                Switching to{" "}
                {process.env.NEXT_PUBLIC_NETWORK === "sepolia"
                  ? "Sepolia"
                  : "Mainnet"}{" "}
                network...
              </span>
            </div>
          </div>
        )}
        <h3>Selected Checks:</h3>
        <div className="max-h-36 overflow-y-auto space-y-1">
          {Array.from(selectedNfts).map((identifier) => {
            const nft = nfts.find((n) => n.identifier === identifier);
            return (
              <div
                key={identifier}
                className="flex items-center gap-1.5 text-sm"
              >
                <p className="text-white">#{identifier}</p>
                <p>
                  [
                  {nft?.collection === "vv-checks-originals"
                    ? "Original"
                    : "Edition"}
                  ]
                </p>
              </div>
            );
          })}
        </div>
      </Modal>

      {/* Celebration Modal */}
      <Modal
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        title="🎉 Deposit Successful!"
        subtitle={`You've successfully deposited ${depositedCount} Check${
          depositedCount !== 1 ? "s" : ""
        } to the Black Check contract. You can withdraw them anytime until the Black Check is created.`}
        closeText="Awesome!"
      >
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="relative">
            <img
              src="/check-token.png"
              alt="black check"
              className="w-24 h-24 animate-bounce"
            />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <img src="/check-light.svg" alt="success" className="w-4 h-4" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-green-400 font-semibold text-lg">
              {depositedCount} Check{depositedCount !== 1 ? "s" : ""} deposited!
            </p>
            <p className="text-neutral-400 text-sm mt-2">
              Your Checks are now part of the Black Check creation process
            </p>
          </div>
        </div>
      </Modal>

      {/* Withdraw Confirmation Modal */}
      <Modal
        isOpen={showWithdrawPrompt}
        onClose={() => setShowWithdrawPrompt(false)}
        title="Confirm Withdraw"
        subtitle={`You're about to withdraw ${selectedNfts.size} Check${
          selectedNfts.size !== 1 ? "s" : ""
        } from the Black Check contract.`}
        closeText="Cancel"
        closeDisabled={withdrawLoading}
        primaryText={withdrawLoading ? "Withdrawing..." : "Confirm Withdraw"}
        onPrimaryAction={performWithdraw}
        primaryDisabled={withdrawLoading}
        primaryLoading={withdrawLoading}
      >
        {chainSwitching && (
          <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/40 rounded-lg">
            <div className="flex items-center gap-2 text-blue-300">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-300"></div>
              <span className="text-sm">
                Switching to{" "}
                {process.env.NEXT_PUBLIC_NETWORK === "sepolia"
                  ? "Sepolia"
                  : "Mainnet"}{" "}
                network...
              </span>
            </div>
          </div>
        )}
        <h3>Selected Checks:</h3>
        <div className="max-h-36 overflow-y-auto space-y-1">
          {Array.from(selectedNfts).map((identifier) => {
            const nft = depositedNfts.find(
              (n) => n.tokenId.toString() === identifier
            );
            return (
              <div
                key={identifier}
                className="flex items-center gap-1.5 text-sm"
              >
                <p className="text-white">#{identifier}</p>
                <p>[Deposited]</p>
              </div>
            );
          })}
        </div>
      </Modal>

      {/* Network Warning Banner */}
      {wrongNetwork && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500/90 border-b border-yellow-400/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="text-yellow-900 font-medium">
                  You're connected to the wrong network. Please switch to{" "}
                  {process.env.NEXT_PUBLIC_NETWORK === "sepolia"
                    ? "Sepolia"
                    : "Mainnet"}
                  .
                </span>
              </div>
              <Button
                onClick={checkAndSwitchChain}
                variant="secondary"
                size="sm"
                className="bg-yellow-400 text-yellow-900 hover:bg-yellow-300"
              >
                Switch Network
              </Button>
            </div>
          </div>
        </div>
      )}

      {authenticated ? (
        isEmpty ? (
          <div className={wrongNetwork ? "pt-16" : ""}>
            <EmptyState />
          </div>
        ) : (
          <div
            className={`flex-1 overflow-y-auto w-full overflow-x-hidden ${
              wrongNetwork ? "pt-16" : ""
            }`}
          >
            <div className="grid grid-cols-2" key={activeTab}>
              {currentNfts.map((nft, index) => {
                const identifier =
                  activeTab === "deposit"
                    ? (nft as NFT).identifier
                    : (nft as DepositedNFT).tokenId.toString();
                const isSelected = selectedNfts.has(identifier);
                const isEvenIndex = index % 2 === 0;
                const isLastItemOdd =
                  currentNfts.length % 2 === 1 &&
                  index === currentNfts.length - 1;

                // For deposited NFTs, we need to get image URLs from the original API
                const displayImage =
                  activeTab === "withdraw"
                    ? (nft as DepositedNFT).imageUrl
                    : (nft as NFT).display_image_url || (nft as NFT).image_url;

                return (
                  <button
                    key={identifier}
                    className={`relative cursor-pointer mix-blend-lighten group border-b border-neutral-800 ${
                      isEvenIndex ? "border-r border-neutral-800" : ""
                    } ${
                      isLastItemOdd
                        ? "border-b-0 border-r border-neutral-800"
                        : ""
                    }`}
                    onClick={() => toggleNftSelection(identifier)}
                  >
                    {displayImage && (
                      <img
                        src={displayImage}
                        alt={`Checks #${identifier}`}
                        className={`w-full h-full object-cover relative -my-4 group-hover:opacity-60 ${
                          isSelected && "blur-[2px] opacity-60"
                        }`}
                        onError={(e) => {
                          // Hide broken images
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                    {!displayImage && (
                      <img
                        src="/check-token.png"
                        alt={`Checks #${identifier}`}
                        className={`w-full h-full object-cover relative -my-4 group-hover:opacity-60 ${
                          isSelected && "blur-[2px] opacity-60"
                        }`}
                      />
                    )}
                    <p className="absolute bottom-6 w-full text-center">
                      #{identifier}
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
        )
      ) : (
        <div
          className={`flex-center flex-col w-full h-full p-16 ${
            wrongNetwork ? "pt-32" : ""
          }`}
        >
          <img src="/check-token.png" alt="black check" className="w-72" />
        </div>
      )}
      {/* Action button when items are selected */}
      {authenticated && selectedNfts.size > 0 && (
        <div
          className={`w-full h-14 flex-center bg-neutral-950/75 backdrop-blur-sm border-t border-neutral-800 flex-shrink-0 ${
            wrongNetwork ? "pt-16" : ""
          }`}
        >
          <Button
            onClick={activeTab === "deposit" ? handleDeposit : handleWithdraw}
            variant="primary"
            className="flex-1 h-full"
          >
            {activeTab === "deposit" ? "Deposit" : "Withdraw"}{" "}
            {selectedNfts.size} check
            {selectedNfts.size !== 1 ? "s" : ""}
          </Button>
        </div>
      )}

      <div
        className={`w-full h-14 flex-center bg-neutral-950/75 backdrop-blur-sm border-t border-neutral-800 flex-shrink-0 ${
          wrongNetwork ? "pt-16" : ""
        }`}
      >
        {!authenticated ? (
          <Button onClick={login} variant="secondary" className="flex-1 h-full">
            Connect wallet to deposit or withdraw checks
          </Button>
        ) : (
          <div className="w-full flex h-full">
            <Button
              onClick={() => setActiveTab("deposit")}
              variant={activeTab === "deposit" ? "secondary" : "ghost"}
              className={`flex-1 h-full !text-neutral-400 border-r border-neutral-800 ${
                activeTab === "deposit"
                  ? "!text-white pointer-events-none"
                  : "hover:bg-transparent"
              }`}
            >
              Deposit
            </Button>
            <Button
              onClick={() => setActiveTab("withdraw")}
              variant={activeTab === "withdraw" ? "secondary" : "ghost"}
              className={`flex-1 h-full !text-neutral-400 ${
                activeTab === "withdraw"
                  ? "!text-white pointer-events-none"
                  : "hover:bg-transparent"
              }`}
            >
              Withdraw
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
