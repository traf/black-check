"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { mainnet, sepolia } from "viem/chains";

export default function PrivyWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#ffffff",
        },
        loginMethods: ["wallet"],
        defaultChain:
          process.env.NEXT_PUBLIC_NETWORK === "sepolia"
            ? sepolia
            : process.env.NEXT_PUBLIC_NETWORK === "mainnet"
            ? mainnet
            : sepolia,
        supportedChains: [sepolia, mainnet],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
