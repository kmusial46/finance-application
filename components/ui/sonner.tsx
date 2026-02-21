"use client"

import type { CSSProperties } from "react"
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      richColors={false}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          // Sonner renders toast backgrounds using these CSS variables.
          // This project does not define shadcn theme vars like `--popover`,
          // so we set explicit opaque values to prevent transparent toasts.
          "--normal-bg": "white",
          "--normal-text": "rgb(16 24 40)",
          "--normal-border": "rgb(234 236 240)",

          // Keep all variants consistent and opaque.
          "--success-bg": "white",
          "--success-text": "rgb(16 24 40)",
          "--success-border": "rgb(234 236 240)",
          "--info-bg": "white",
          "--info-text": "rgb(16 24 40)",
          "--info-border": "rgb(234 236 240)",
          "--warning-bg": "white",
          "--warning-text": "rgb(16 24 40)",
          "--warning-border": "rgb(234 236 240)",
          "--error-bg": "white",
          "--error-text": "rgb(16 24 40)",
          "--error-border": "rgb(234 236 240)",

          "--border-radius": "var(--radius, 0.75rem)",
        } as CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
