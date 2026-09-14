"use client";

import * as React from "react";

interface AvatarProps {
  /** Two-letter initials fallback. */
  initials: string;
  src?: string;
  alt?: string;
  size?: number;
}

export function Avatar({ initials, src, alt, size = 28 }: AvatarProps) {
  return (
    <div
      aria-hidden={!alt}
      role={alt ? "img" : undefined}
      aria-label={alt}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--hd-avatar-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt ?? ""} width={size} height={size} style={{ objectFit: "cover" }} />
      ) : (
        <span
          style={{
            color: "#fff",
            fontSize: size * 0.375,
            fontWeight: 700,
            letterSpacing: "0.02em",
          }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}
