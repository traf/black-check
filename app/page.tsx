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
          <div className="flex flex-col p-4 sm:p-12">
            {authenticated ? (
              <h1 className="text-balance my-16">
                gm, {getDisplayName()}—select some Checks to deposit into the
                Black Check contract.
              </h1>
            ) : (
              <h1 className="text-balance my-16">
                The Black Check — web3's ultimate artifact.
              </h1>
            )}

            {/* Funding Status Display */}
            <div className="mb-8 p-4 bg-neutral-900 rounded-lg border border-neutral-800">
              <h2 className="text-lg font-semibold mb-2">
                Black Check Funding Status
              </h2>
              {fundingLoading ? (
                <p className="text-neutral-400">Loading funding status...</p>
              ) : fundingError ? (
                <p className="text-red-400">Error: {fundingError}</p>
              ) : (
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      fundingCompleted ? "bg-green-500" : "bg-yellow-500"
                    }`}
                  ></div>
                  <p className="text-neutral-300">
                    {fundingCompleted
                      ? "Funding completed! The Black Check is ready for compositing."
                      : "Funding in progress... More Checks needed for compositing."}
                  </p>
                </div>
              )}
            </div>

            {/* Checks by Level Display */}
            <div className="mb-8 p-4 bg-neutral-900 rounded-lg border border-neutral-800">
              <h2 className="text-lg font-semibold mb-4">Checks by Level</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { level: 0, data: level0Checks },
                  { level: 1, data: level1Checks },
                  { level: 2, data: level2Checks },
                  { level: 3, data: level3Checks },
                  { level: 4, data: level4Checks },
                ].map(({ level, data }) => (
                  <div
                    key={level}
                    className="p-3 bg-neutral-800 rounded border border-neutral-700 hover:border-neutral-600 hover:bg-neutral-750 cursor-pointer transition-colors"
                    onClick={() => handleLevelClick(level)}
                  >
                    <h3 className="text-sm font-medium mb-2">Level {level}</h3>
                    {data.loading ? (
                      <p className="text-xs text-neutral-400">Loading...</p>
                    ) : data.error ? (
                      <p className="text-xs text-red-400">Error</p>
                    ) : (
                      <div>
                        <p className="text-xs text-neutral-400 mb-1">
                          Count: {data.checks?.length || 0}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

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

        <div className="mt-auto">
          <Button
            onClick={!authenticated ? handleConnect : undefined}
            className={`w-full h-14 border-b lg:border-b-0 border-t border-neutral-800 ${
              authenticated ? "pointer-events-none" : ""
            }`}
            variant={authenticated ? "ghost" : "secondary"}
          >
            {authenticated
              ? "No checks deposited yet"
              : "Connect wallet to deposit checks"}
          </Button>
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
