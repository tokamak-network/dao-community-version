import * as React from "react"

import { useState } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import {
    Type,
  } from "lucide-react"

const buttonVariants = cva(
    "border ",
    {
      variants: {
        variant: {
          default:
            "border border-gray-200 flex items-center ",
        },
        size: {
          default: "rounded-md p-4 gap-3 relative",
        },
      },
      defaultVariants: {
        variant: "default",
        size: "default",
      },
    }
  )
export interface ProposalInfoButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  title: string
  description: string
  snapshotUrl: string
  discourseUrl: string
  onClick?: () => void
}

const ProposalInfoButton = React.forwardRef<HTMLButtonElement, ProposalInfoButtonProps>(
  ({ className, variant, size, asChild = false, title, description, snapshotUrl, discourseUrl, onClick, ...props }, ref) => {
    const isAnyFieldEmpty = !title || !description || !snapshotUrl || !discourseUrl;

    return (
        <div className={cn(buttonVariants({ variant, size, className }))} onClick={onClick} style={{ cursor: 'pointer' }}>
            <Type className="w-5 h-5 text-gray-600" />
            <div>
                <div className="font-medium">Proposal text</div>
            </div>
            {isAnyFieldEmpty && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full"></div>
            )}
        </div>
    )
  }
)
ProposalInfoButton.displayName = "Proposal text"

export { ProposalInfoButton, buttonVariants }