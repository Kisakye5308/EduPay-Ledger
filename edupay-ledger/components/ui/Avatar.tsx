"use client";

import React from "react";
import Image from "next/image";
import { cn, getInitials } from "@/lib/utils";

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  fallbackClassName?: string;
}

// Generate a consistent color based on name
function getAvatarColor(name: string): string {
  const colors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-amber-500",
    "bg-cyan-500",
    "bg-indigo-500",
    "bg-rose-500",
    "bg-teal-500",
    "bg-orange-500",
  ];

  // Generate a hash from the name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({
  src,
  alt,
  name,
  size = "md",
  className,
  fallbackClassName,
}: AvatarProps) {
  const sizes = {
    xs: "size-6 text-[10px]",
    sm: "size-8 text-xs",
    md: "size-10 text-sm",
    lg: "size-12 text-base",
    xl: "size-24 text-xl",
  };

  const initials = name ? getInitials(name) : "?";
  const bgColor = name ? getAvatarColor(name) : "bg-slate-400";

  if (src) {
    return (
      <div
        className={cn(
          "rounded-full bg-cover bg-center bg-no-repeat border border-gray-200 dark:border-gray-700",
          sizes[size],
          className,
        )}
        style={{ backgroundImage: `url(${src})` }}
        role="img"
        aria-label={alt || name || "Avatar"}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center text-white font-bold",
        bgColor,
        sizes[size],
        className,
        fallbackClassName,
      )}
      aria-label={name || "Avatar"}
    >
      {initials}
    </div>
  );
}

// Avatar Group
interface AvatarGroupProps {
  avatars: Array<{
    src?: string;
    name?: string;
  }>;
  max?: number;
  size?: AvatarProps["size"];
  className?: string;
}

export function AvatarGroup({
  avatars,
  max = 4,
  size = "sm",
  className,
}: AvatarGroupProps) {
  const displayed = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className={cn("flex -space-x-2", className)}>
      {displayed.map((avatar, index) => (
        <Avatar
          key={index}
          src={avatar.src}
          name={avatar.name}
          size={size}
          className="ring-2 ring-white dark:ring-slate-900"
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            "rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold ring-2 ring-white dark:ring-slate-900",
            size === "sm" ? "size-8 text-xs" : "size-10 text-sm",
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
