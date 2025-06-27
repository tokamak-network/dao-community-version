"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

interface RadioGroupItemProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {}

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

// Custom radio group item with enhanced styling
interface RadioGroupItem1Props
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  selectedMethodType: string
  text: string
  value: string
  id: string
}

const RadioGroupItem1 = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItem1Props
>(({ className, selectedMethodType, text, value, id, ...props }, ref) => {
  return (
    <div className="relative">
      <RadioGroupPrimitive.Item
        ref={ref}
        value={value}
        id={id}
        className="peer sr-only"
        {...props}
      />
      <label
        htmlFor={id}
        className={`flex items-center p-2 border rounded-lg cursor-pointer transition-colors ${
          selectedMethodType === value
            ? "border-gray-400"
            : "border-gray-200 hover:bg-gray-50"
        }`}
      >
        <div
          className={`w-4 h-4 border-2 rounded-full mr-2 flex items-center justify-center ${
            selectedMethodType === value ? "border-gray-400" : "border-gray-300"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full bg-gray-600 transition-transform duration-200 ${
              selectedMethodType === value ? "scale-100" : "scale-0"
            }`}
          />
        </div>
        <span className="text-sm text-gray-900">{text}</span>
      </label>
    </div>
  )
})
RadioGroupItem1.displayName = "RadioGroupItem1"

export { RadioGroup, RadioGroupItem, RadioGroupItem1 }