'use client';

import { useState, useRef, useEffect, ReactNode, cloneElement, isValidElement } from 'react';

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function Dropdown({ trigger, children, className = '' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const triggerWithActiveState = isValidElement(trigger) 
    ? cloneElement(trigger as React.ReactElement<any>, {
        ...(trigger.props as any),
        className: `${(trigger.props as any)?.className || ''} ${isOpen ? '!bg-neutral-900' : ''}`,
        children: isOpen ? 'Close' : (trigger.props as any)?.children
      })
    : trigger;

  return (
    <div className={`flex-1 relative cursor-pointer ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="w-full h-full cursor-pointer">
        {triggerWithActiveState}
      </div>

      {isOpen && (
        <div className="fixed top-14 right-0 lg:right-14 w-full lg:w-[calc(50%-3.5rem+0.5px)] h-fit max-h-4/5 bg-neutral-950/95 backdrop-blur-sm border-x-0 lg:border-x border-b border-neutral-800 z-30 shadow-2xl shadow-black">
          <div className="w-full flex flex-col gap-2 p-6">
            {children}
          </div>
        </div>
      )}
    </div>
  );
} 