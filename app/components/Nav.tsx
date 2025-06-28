'use client';

import Logo from "./Logo";
import Button from "./Button";
import Connect from "./Connect";

export default function Nav() {
  return (
    <nav className="pl-px bg-neutral-950 w-full h-14 flex lg:grid grid-cols-6 z-20 border-b border-neutral-800 divide-x divide-neutral-800 flex-shrink-0">
      <Logo className="flex lg:hidden" />
      <Button variant="ghost" className="col-span-1 pointer-events-none mr-px hidden lg:flex">Black Check</Button>
      <div className="col-span-2 hidden lg:block"></div>
      <Button href="/" variant="ghost" className="flex-1 col-span-1 h-full">Feed</Button>
      <Button href="/" variant="ghost" className="flex-1 col-span-1 h-full">About</Button>
      <Connect className="flex-1 col-span-1 h-full" />
    </nav>
  );
} 