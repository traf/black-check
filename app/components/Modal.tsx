"use client";

import { ReactNode, useEffect } from "react";
import Button from "./Button";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    className?: string;
    title?: string;
    subtitle?: string;
    closeText?: string;
    closeDisabled?: boolean;
    primaryText?: string;
    onPrimaryAction?: () => void | Promise<void>;
    primaryDisabled?: boolean;
    primaryLoading?: boolean;
}

export default function Modal({ isOpen, onClose, children, className = "", title, subtitle, closeText = "Close", closeDisabled = false, primaryText, onPrimaryAction, primaryDisabled = false, primaryLoading = false }: ModalProps) {
    useEffect(() => {
        if (!isOpen) return;

        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !closeDisabled) {
                onClose();
            }
        };

        document.addEventListener("keydown", handleEscapeKey);
        return () => document.removeEventListener("keydown", handleEscapeKey);
    }, [isOpen, onClose, closeDisabled]);

    if (!isOpen) return null;

    const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget && !closeDisabled) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleBackdropClick}>
            <div className={`bg-black border border-neutral-800 rounded-lg max-w-md w-full overflow-hidden ${className}`}>
                <div className="flex flex-col p-6 gap-3">
                    {title && (<h2 className="text-white text-lg">{title}</h2>)}
                    {subtitle && (<p className="mb-4">{subtitle}</p>)}
                    {children}
                </div>
                <div className="flex mt-4 border-t border-neutral-800">
                    <Button
                        onClick={onClose}
                        variant="tertiary"
                        className="flex-1"
                        disabled={closeDisabled}
                    >
                        {closeText}
                    </Button>
                    {primaryText && onPrimaryAction && (
                        <Button
                            onClick={onPrimaryAction}
                            variant="primary"
                            className="flex-1"
                            disabled={primaryDisabled || primaryLoading}
                        >
                            {primaryText}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
