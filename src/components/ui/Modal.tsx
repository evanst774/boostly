'use client';

import { Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    showCloseButton?: boolean;
}

const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
};

export default function Modal({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    maxWidth = 'md',
    showCloseButton = true 
}: ModalProps) {
    // Prevent body scroll when modal is open but allow toasts
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            // Add padding to body to prevent layout shift
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        } else {
            document.body.style.overflow = 'unset';
            document.body.style.paddingRight = '0px';
        }
        return () => {
            document.body.style.overflow = 'unset';
            document.body.style.paddingRight = '0px';
        };
    }, [isOpen]);

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[9999]" onClose={onClose}>
                {/* Backdrop - with lower opacity */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                {/* Modal container */}
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className={`w-full ${maxWidthClasses[maxWidth]} transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-800 text-left align-middle shadow-2xl transition-all`}>
                                {/* Header */}
                                <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-xl font-JakartaExtraBold text-neutral-900 dark:text-white"
                                    >
                                        {title}
                                    </Dialog.Title>
                                    {showCloseButton && (
                                        <button
                                            onClick={onClose}
                                            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                                        >
                                            <XMarkIcon className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
                                        </button>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    {children}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}