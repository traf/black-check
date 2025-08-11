"use client";

import { usePrivy, useLogin } from "@privy-io/react-auth";
import { useState } from "react";
import Grid from "./components/Grid";
import Button from "./components/Button";
import Check from "./components/Check";
import Tokens from "./components/Tokens";
import { useENS } from "./hooks/useENS";
import { useFundingCompleted } from "./hooks/useFundingCompleted";
import { useChecksByLevel } from "./hooks/useChecksByLevel";
import ChecksModal from "./components/ChecksModal";
import Badge from "./components/Badge";

export default function Home() {
  const { authenticated, user } = usePrivy();
  const { login } = useLogin();
  const address = user?.wallet?.address;
  const ensName = useENS(address);
  const {
    fundingCompleted,
    loading: fundingLoading,
    error: fundingError,
  } = useFundingCompleted();

  // Modal state
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  // Fetch checks data for levels 0-4
  const level0Checks = useChecksByLevel(0);
  const level1Checks = useChecksByLevel(1);
  const level2Checks = useChecksByLevel(2);
  const level3Checks = useChecksByLevel(3);
  const level4Checks = useChecksByLevel(4);

  const getDisplayName = () => {
    if (ensName) return ensName.replace(".eth", "");
    if (address) return `${address.slice(0, 6)}...${address.slice(-4)}`;
    return "anon";
  };

  const handleConnect = () => {
    login();
  };

  const handleLevelClick = (level: number) => {
    setSelectedLevel(level);
  };

  const handleCloseModal = () => {
    setSelectedLevel(null);
  };

  const getLevelData = (level: number) => {
    switch (level) {
      case 0:
        return level0Checks;
      case 1:
        return level1Checks;
      case 2:
        return level2Checks;
      case 3:
        return level3Checks;
      case 4:
        return level4Checks;
      default:
        return { checks: null, loading: false, error: "Invalid level" };
    }
  };

  return (
    <div className="flex flex-col lg:flex-row w-full h-full divide-x divide-neutral-800">
      <div className="flex flex-col flex-1 relative pt-12 lg:pt-0 overflow-hidden">
        <div className="flex flex-col w-full h-full relative p-4 lg:p-0 overflow-y-auto">
          <div className="flex flex-col justify-end p-4 sm:p-12 mt-auto">
            <Badge
              title={fundingCompleted ? "Funding completed... Black check ready to composite!" : "Funding active... More checks needed to composite."}
              loading={fundingLoading}
              error={fundingError || undefined}
              completed={fundingCompleted || false}
            />
            {authenticated ? (
              <h1 className="text-balance mt-6 mb-12">
                Select some checks to deposit into the contract.
              </h1>
            ) : (
              <h1 className="text-balance mt-6 mb-12">
                The Black Check — web3's ultimate artifact.
              </h1>
            )}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
              <p className="flex flex-row sm:flex-col items-start gap-3 text-left sm:text-balance">
                <Check className="w-4 mt-1.5" /> Contribute your Check to the
                aggregator to receive a unique onchain receipt.
              </p>
              <p className="flex flex-row sm:flex-col items-start gap-3 text-left sm:text-balance">
                <Check className="w-4 mt-1.5" /> Once enough Checks are
                deposited, the aggregator automatically composites.
              </p>
              <p className="flex flex-row sm:flex-col items-start gap-3 text-left sm:text-balance">
                <Check className="w-4 mt-1.5" /> Your receipt will then become
                your vote in the fate of the Black Check!
              </p>
              <p className="flex flex-row sm:flex-col items-start gap-3 text-left sm:text-balance">
                <Check className="w-4 mt-1.5" /> Your contribution to the Black
                Check will be recorded onchain forever.
              </p>
            </div>
          </div>

          <Grid
            rows={4}
            cols={3}
            className={`hidden lg:${authenticated ? "hidden" : "grid"} mb-8`}
          />
        </div>

        <div className="mt-auto w-full h-14 border-b lg:border-b-0 border-t border-neutral-800 flex items-center justify-center gap-2 px-12 flex-shrink-0">
          {(() => {
            const allChecks = [level0Checks, level1Checks, level2Checks, level3Checks, level4Checks];
            const totalCount = allChecks.reduce((total, level) => total + (level.checks?.length || 0), 0);
            return `${totalCount} checks deposited`;
          })()}
          <p>
            {(() => {
              const allChecks = [level0Checks, level1Checks, level2Checks, level3Checks, level4Checks];
              const totalCount = allChecks.reduce((total, level) => total + (level.checks?.length || 0), 0);
              const percentage = ((totalCount / 4096) * 100).toFixed(3);
              return `[${percentage}% complete]`;
            })()}
          </p>
        </div>
      </div>

      <div className="flex-center flex-col flex-1 h-full bg-neutral-950">
        <Tokens />
      </div>

      {/* Checks Modal */}
      {selectedLevel !== null && (
        <ChecksModal
          isOpen={selectedLevel !== null}
          onClose={handleCloseModal}
          level={selectedLevel}
          checks={getLevelData(selectedLevel).checks}
          loading={getLevelData(selectedLevel).loading}
          error={getLevelData(selectedLevel).error}
        />
      )}
    </div>
  );
}
