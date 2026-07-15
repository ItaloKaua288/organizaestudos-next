"use client"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface ColorPickerProps {
  value: string
  onChange: (value: string) => void
}

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#10b981", 
  "#06b6d4", "#3b82f6", "#6366f1", "#a855f7", 
  "#ec4899", "#64748b", "#000000", "#ffffff"
]

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal flex items-center gap-2",
            !value && "text-muted-foreground"
          )}
        >
          <div
            className="h-4 w-4 rounded-full border border-neutral-200 shadow-sm"
            style={{ backgroundColor: value || "#000000" }}
          />
          <span>{value || "Selecione uma cor"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-4 gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={cn(
                  "h-8 w-8 rounded-md border border-neutral-200 transition-all hover:scale-105 flex items-center justify-center",
                  value === color && "ring-2 ring-primary ring-offset-2"
                )}
                style={{ backgroundColor: color }}
                onClick={() => onChange(color)}
              />
            ))}
          </div>

          <div className="h-px bg-border my-1" />

          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="h-9 w-12 p-1 cursor-pointer"
            />
            <Input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#000000"
              className="flex-1 uppercase font-mono text-sm"
              maxLength={7}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}