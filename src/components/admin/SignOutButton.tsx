"use client";

import React from "react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
        window.location.href = "/admin/login";
      }}
      className="h-9 px-3 rounded-lg text-sm font-medium text-muted hover:bg-canvas"
    >
      Sign out
    </button>
  );
}
