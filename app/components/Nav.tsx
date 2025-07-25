'use client';

import Logo from "./Logo";
import Button from "./Button";
import Connect from "./Connect";
import Dropdown from "./Dropdown";
import Feed from "./Feed";
import About from "./About";
import { usePrivy, useLogout } from '@privy-io/react-auth';

export default function Nav() {
  const { authenticated } = usePrivy();
  const { logout } = useLogout();

  return (
    <nav className="fixed lg:relative top-0 pl-px bg-neutral-950 w-full h-14 flex lg:grid grid-cols-6 z-20 border-b border-neutral-800 divide-x divide-neutral-800 flex-shrink-0">
      <Logo className="flex lg:hidden" />
      <Button variant="ghost" className="col-span-1 pointer-events-none mr-px hidden lg:flex">Black Check</Button>
      <div className="col-span-2 hidden lg:block"></div>
      <Dropdown trigger={<Button variant="ghost" className="w-full h-full">Feed</Button>}>
        <Feed />
      </Dropdown>
      <Dropdown trigger={<Button variant="ghost" className="w-full h-full">About</Button>}>
        <About />
      </Dropdown>
      <Connect className="flex-1 col-span-1 h-full !p-0" />
      {authenticated && (
        <Button onClick={logout} className="fixed hidden lg:flex top-0 right-0 w-14 h-[55px] text-white z-10 !p-0" variant="ghost">
            <img src="/disconnect.svg" alt="disconnect" className="w-4" />
        </Button>
      )}
    </nav>
  );
} 