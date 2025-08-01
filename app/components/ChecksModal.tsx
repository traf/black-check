import { useState } from "react";
import CheckArt from "./CheckArt";

interface ChecksModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: number;
  checks: number[] | null;
  loading: boolean;
  error: string | null;
}

export default function ChecksModal({
  isOpen,
  onClose,
  level,
  checks,
  loading,
  error,
}: ChecksModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[80vh] bg-neutral-900 rounded-lg border border-neutral-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <h2 className="text-xl font-semibold">Level {level} Checks</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-neutral-400">Loading checks...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-red-400">Error: {error}</div>
            </div>
          ) : checks && checks.length > 0 ? (
            <div>
              <div className="mb-4 text-sm text-neutral-400">
                Total checks: {checks.length}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {checks.map((checkId, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center p-3 bg-neutral-800 rounded-lg border border-neutral-700 hover:border-neutral-600 transition-colors cursor-pointer group"
                    onClick={() => {
                      // You could add functionality here to view individual check details
                      console.log(`Clicked check #${checkId}`);
                    }}
                  >
                    <CheckArt
                      checkId={checkId}
                      level={level}
                      size={80}
                      className="mb-2"
                    />
                    <div className="text-xs text-neutral-400">
                      Level {level}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-neutral-400">
                No checks found for this level
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
