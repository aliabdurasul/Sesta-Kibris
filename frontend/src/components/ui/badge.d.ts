import * as React from "react";
import { type VariantProps } from "class-variance-authority";

declare const badgeVariants: (props?: {
  variant?: "default" | "secondary" | "destructive" | "outline";
} & { class?: string; className?: string }) => string;

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export declare function Badge(props: BadgeProps): React.JSX.Element;
export { badgeVariants };
