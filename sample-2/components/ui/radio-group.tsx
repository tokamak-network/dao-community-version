"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Circle } from "lucide-react";

import { cn } from "@/lib/utils";

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
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

interface RadioGroupItemProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  // 여기에 selectedMethodType을 추가할 수도 있으나, RadioGroupItem1에만 해당된다면 별도 인터페이스가 나을 수 있습니다.
}

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps // 수정된 Props 타입을 사용합니다.
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
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

// RadioGroupItem1을 위한 별도의 Props 인터페이스 정의
interface RadioGroupItem1Props
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  selectedMethodType: string;
  text: string;
  value: string; // RadioGroupItem은 value prop이 필수입니다.
  id: string; // Label과 연결하기 위해 id prop이 필수입니다.
}

const RadioGroupItem1 = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItem1Props
>(({ className, selectedMethodType, text, value, id, ...props }, ref) => {
  return (
    <div className="relative">
      {/* RadioGroupPrimitive.Item을 사용해야 RadioGroup의 제어를 받습니다. */}
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
          selectedMethodType === value // 현재 RadioGroupItem1의 value와 selectedMethodType을 비교합니다.
            ? "border-purple-200 bg-purple-50/50"
            : "hover:bg-gray-50"
        }`}
      >
        <div
          className={`w-4 h-4 border-2 rounded-full mr-2 flex items-center justify-center ${
            selectedMethodType === value ? "border-purple-300" : ""
          }`}
        >
          <div
            className={`w-3 h-3 rounded-full bg-purple-400 transition-transform duration-200 ${
              selectedMethodType === value ? "scale-100" : "scale-0"
            }`}
          />
        </div>
        <span className="text-sm text-gray-900">{text}</span>
      </label>
    </div>

    // <RadioGroupPrimitive.Item
    //   ref={ref}
    //   className={cn(
    //     "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    //     className
    //   )}
    //   {...props}
    // >
    //   <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
    //     <Circle className="h-2.5 w-2.5 fill-current text-current" />
    //   </RadioGroupPrimitive.Indicator>
    // </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem1.displayName = "RadioGroupItem1"; // displayName도 구별되도록 변경

export { RadioGroup, RadioGroupItem, RadioGroupItem1 };
