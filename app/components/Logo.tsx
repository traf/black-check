import Link from 'next/link';
import Check from './Check';

export default function Logo({ className = "" }: { className?: string }) {
    return (
        <Link href="/" className={`flex-center w-14 h-[55px] bg-white hover:bg-neutral-200 ${className}`}>
            <Check variant="dark" />
        </Link>
    );
} 