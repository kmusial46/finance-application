'use client'

import { sidebarLinks } from "@/constants"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import Footer from "../ui/footer"
import PlaidLink from "../ui/plaid-link"

const Sidebar = ({user}: SidebarProps) => {
    const pathName = usePathname();
    const [clickedLink, setClickedLink] = useState<string | null>(null);
    const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
    const [suppressedLabel, setSuppressedLabel] = useState<string | null>(null);
    const router = useRouter();

    const handleNav = (e: any, route: string, label: string) => {
        // allow modifier keys / middle click to behave normally
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
        e.preventDefault();
        const wasHovering = hoveredLabel === label;
        if (wasHovering) setSuppressedLabel(label);
        setClickedLink(label);
        setTimeout(() => {
            setClickedLink(null);
            // if we started suppression while hovering, keep suppressed until mouse leaves
            router.push(route);
        }, 500);
    };

    return (
    <section className="sidebar">
        <nav className="flex flex-col gap-4">
            <Link href="/" className="mb-12 cursor-pointer flex items-center gap-2">
                <Image
                    src="/icons/logo.svg"
                    width={34}
                    height={34}
                    alt="Logo"
                    className="size-[24px] max-xl:size-14"
                />
                <h1 className="sidebar-logo">
                    Aureon
                </h1>
            </Link>

            {sidebarLinks.map((item) => {
                const isActive = pathName === item.route || pathName.startsWith(`${item.route}/`);
                const isClicked = clickedLink === item.label;
                return (
                    <Link 
                        href={item.route} 
                        key={item.label}
                        onClick={(e) => handleNav(e, item.route, item.label)}
                        onMouseEnter={() => setHoveredLabel(item.label)}
                        onMouseLeave={() => {
                            setHoveredLabel(null);
                            if (suppressedLabel === item.label) setSuppressedLabel(null);
                        }}
                        className={cn("sidebar-link group")}
                    >
                        <div className="relative size-6">
                            <Image
                                src={item.imgURL}
                                alt={item.label}
                                fill
                                className={cn({
                                    'brightness-0 saturate-100': isActive,
                                })}
                                style={isActive ? { filter: 'invert(38%) sepia(97%) saturate(1527%) hue-rotate(201deg) brightness(98%) contrast(101%)' } : undefined}
                            />
                        </div>
                        <p className={cn("sidebar-label transition-all duration-200 group-hover:underline underline-offset-4", {
                            '!text-blue-600 !font-bold !text-[17px]': isActive,
                        })}>
                            {item.label}
                        </p>
                        <div className={cn(
                            // hide hover-trigger when this label is suppressed
                            `ml-1 opacity-0 -translate-x-2 ${suppressedLabel === item.label ? '' : 'group-hover:opacity-100 group-hover:translate-x-0'} transition-all duration-500 max-xl:hidden`,
                            {
                                "translate-x-6": isClicked,
                                "opacity-100": isClicked,
                                "arrow-animate": isClicked,
                            }
                        )}>
                            <svg 
                                width="16" 
                                height="16" 
                                viewBox="0 0 16 16" 
                                fill="none" 
                                xmlns="http://www.w3.org/2000/svg"
                                className={cn("text-black-2", {
                                    'text-blue-600': isActive,
                                })}
                            >
                                <path 
                                    d="M6 12L10 8L6 4" 
                                    stroke="currentColor" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                    </Link>
                )
            })}
            <PlaidLink user={user} />
        </nav>

        <Footer user={user} />
    </section>
  )
}

export default Sidebar