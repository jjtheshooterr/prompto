"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// Suppress the React warning about script tags from next-themes.
// next-themes intentionally injects a script for theme detection before hydration.
// This is a known issue: https://github.com/pacocoursey/next-themes/issues/320
if (typeof window !== "undefined") {
  const originalError = console.error.bind(console)
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Encountered a script tag while rendering React component")
    ) {
      return
    }
    originalError(...args)
  }
}

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
