import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import {
    Type,
  } from "lucide-react"
// const buttonVariants = cva(
//   "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
//   {
//     variants: {
//       variant: {
//         default:
//           "bg-primary text-primary-foreground shadow hover:bg-primary/90",
//         destructive:
//           "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
//         outline:
//           "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
//         secondary:
//           "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
//         ghost: "hover:bg-accent hover:text-accent-foreground",
//         link: "text-primary underline-offset-4 hover:underline",
//       },
//       size: {
//         default: "h-9 px-4 py-2",
//         sm: "h-8 rounded-md px-3 text-xs",
//         lg: "h-10 rounded-md px-8",
//         icon: "h-9 w-9",
//       },
//     },
//     defaultVariants: {
//       variant: "default",
//       size: "default",
//     },
//   }
// )

const buttonVariants = cva(
    "border ",
    {
      variants: {
        variant: {
          default:
            "border border-gray-200 flex items-center ",
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
          default: "rounded-md p-4 gap-3 relative",
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
export interface ProposalInfoButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const ProposalInfoButton = React.forwardRef<HTMLButtonElement, ProposalInfoButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
    //   <button
    //     className={cn(buttonVariants({ variant, size, className }))}
    //     ref={ref}
    //     {...props}
    //   />

//     <Button className="bg-slate-700 hover:bg-slate-800 text-white w-full mt-2">
//     <Plus className="w-4 h-4 mr-2" />
//     Add Action
//   </Button>

        <div  className={cn(buttonVariants({ variant, size, className }))}>
            <Type className="w-5 h-5 text-gray-600" />
            <div>
                <div className="font-medium">Proposal text</div>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full"></div>
        </div>

    )
  }
)
ProposalInfoButton.displayName = "Proposal text"

export { ProposalInfoButton, buttonVariants }