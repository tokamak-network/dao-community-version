import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

const buttonVariants = cva(
    "border ",
    {
      variants: {
        variant: {
          default:
            "bg-slate-600 hover:bg-slate-800 text-white ",
        },
        size: {
          default: "w-full h-12 mt-4 rounded-fill p-3 mb-4",
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