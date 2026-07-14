import { InboxIcon } from "lucide-react"
import { cn } from "@/lib/utils"

import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"

type IconCardProps = {
  variant?: "default" | "outline" | "muted";
  title?: string;
  content?: string;
  iconElement?: React.ReactNode;
  className?: string;
};

export function IconCard({ variant, title, content, iconElement, className }: IconCardProps) {
  return (
    <div className={cn("flex w-full flex-col gap-6", className)}>
      <Item variant={variant}>
        <ItemMedia variant="icon">
          {iconElement || <InboxIcon />}
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{title || "Default Title"}</ItemTitle>
          <ItemDescription>
            {content || "Default content"}
          </ItemDescription>
        </ItemContent>
      </Item>
    </div>
  )
}
