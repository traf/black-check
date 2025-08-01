import { useState, useEffect } from "react";
import { createPublicClient, http, getContract } from "viem";
import { sepolia } from "viem/chains";
import { BLACK_CHECK_ONE_SEPOLIA_ADDRESS } from "../lib/constants";
import { BLACK_CHECK_ONE_ABI } from "../lib/abi";

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

export function useFundingCompleted() {
  const [fundingCompleted, setFundingCompleted] = useState<boolean | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFundingStatus = async () => {
      try {
        setLoading(true);
        setError(null);

        const contract = getContract({
          address: BLACK_CHECK_ONE_SEPOLIA_ADDRESS as `0x${string}`,
          abi: BLACK_CHECK_ONE_ABI,
          client: publicClient,
        });

        const result = await contract.read.fundingCompleted();
        setFundingCompleted(result as boolean);
      } catch (err) {
        console.error("Error fetching funding status:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch funding status"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchFundingStatus();
  }, []);

  return { fundingCompleted, loading, error };
}
