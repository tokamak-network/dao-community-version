import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Plus,
} from "lucide-react"

const buttonVariants = cva(
    "border ",
    {
      variants: {
        variant: {
          default:
            "bg-slate-600 hover:bg-slate-800 text-white ",
        //   destructive:
        //     "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        //   outline:
        //     "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
        //   secondary:
        //     "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        //   ghost: "hover:bg-accent hover:text-accent-foreground",
        //   link: "text-primary underline-offset-4 hover:underline",
        },
        size: {
          default: "w-full h-12 mt-4 rounded-fill p-3 mb-4",
        //   sm: "h-8 rounded-md px-3 text-xs",
        //   lg: "h-10 rounded-md px-8",
        //   icon: "h-9 w-9",
        },
      },
      defaultVariants: {
        variant: "default",
        size: "default",
      },
    }
  )
export interface ProposalAddActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  onClick?: () => void
}

const ProposalAddActionButton = React.forwardRef<HTMLButtonElement, ProposalAddActionButtonProps>(
  ({ className, variant, size, asChild = false, onClick, ...props }, ref) => {
    return (
      <Button className={cn(buttonVariants({ variant, size, className }))} onClick={onClick}>
        <Plus className="w-4 h-4 mr-2" />
        Add Action
      </Button>
    )
  }
)

export { ProposalAddActionButton, buttonVariants }