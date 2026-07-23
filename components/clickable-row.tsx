"use client";

import { useRouter } from "next/navigation";
import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ClickableRow({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const router = useRouter();

  function go() {
    router.push(href);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTableRowElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      go();
    }
  }

  return (
    <tr
      role="link"
      tabIndex={0}
      onClick={go}
      onKeyDown={handleKeyDown}
      className={cn("cursor-pointer hover:bg-bg transition-colors focus:outline-none focus:bg-bg", className)}
    >
      {children}
    </tr>
  );
}
