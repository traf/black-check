export default function Feed() {
    return (
        <div className="w-full h-full overflow-y-auto space-y-4 divide-y divide-dashed divide-neutral-800">

            {/* Feed item */}
            <div className="w-full h-full flex flex-col gap-4 pb-5">
                <div className="flex items-center justify-between w-full">
                    <p className="w-full"><span className="text-white">traf.eth</span> deposited 2 checks</p>
                    <p className="flex-shrink-0">10m ago</p>
                    <a href="https://etherscan.io/tx/0x..." target="_blank" className="flex-center p-2 opacity-50 hover:opacity-100"><img src="/arrow.svg" alt="tx" /></a>
                </div>
                <div className="flex flex-row gap-3">
                    <div className="w-16 h-16 border border-neutral-800 overflow-hidden"><img src="/placeholder-check-1.svg" alt="check" className="w-full h-full object-cover scale-120" /></div>
                    <div className="w-16 h-16 border border-neutral-800 overflow-hidden"><img src="/placeholder-check-2.svg" alt="check" className="w-full h-full object-cover scale-120" /></div>
                </div>
            </div>

            {/* Feed item */}
            <div className="w-full h-full flex flex-col gap-4 pb-5">
                <div className="flex items-center justify-between w-full">
                    <p className="w-full"><span className="text-white">0x442...4475</span> withdrew 2 checks</p>
                    <p className="flex-shrink-0">10m ago</p>
                    <a href="https://etherscan.io/tx/0x..." target="_blank" className="flex-center p-2 opacity-50 hover:opacity-100"><img src="/arrow.svg" alt="tx" /></a>
                </div>
                <div className="flex flex-row gap-3">
                    <div className="w-16 h-16 border border-neutral-800 overflow-hidden"><img src="/placeholder-check-1.svg" alt="check" className="w-full h-full object-cover scale-120" /></div>
                    <div className="w-16 h-16 border border-neutral-800 overflow-hidden"><img src="/placeholder-check-2.svg" alt="check" className="w-full h-full object-cover scale-120" /></div>
                </div>
            </div>

        </div>
    );
} 