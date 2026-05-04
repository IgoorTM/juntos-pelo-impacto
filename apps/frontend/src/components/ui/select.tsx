import { Select as SelectPrimitive } from '@base-ui/react/select'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onChange: (value: string | null) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
}

function Select({ value, onChange, options, placeholder, disabled, className, id }: SelectProps) {
  const selected = options.find((o) => o.value === value)

  return (
    <SelectPrimitive.Root
      value={value || undefined}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        id={id}
        data-slot="select"
        className={cn(
          'flex h-9 items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-3 py-1 text-sm transition-colors outline-none',
          'placeholder:text-muted-foreground',
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
          'dark:bg-input/30',
          !selected && 'text-muted-foreground',
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder}>
          {selected?.label ?? placeholder}
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50 transition-transform duration-200 [[data-open]_&]:rotate-180" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner sideOffset={6} align="start" alignItemWithTrigger={false}>
          <SelectPrimitive.Popup
            className={cn(
              'z-50 min-w-[var(--anchor-width)] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md',
              'data-[ending-style]:animate-none data-[starting-style]:animate-none',
              'origin-[var(--transform-origin)]',
            )}
          >
            <SelectPrimitive.List className="p-1">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  className={cn(
                    'cursor-pointer select-none rounded-md px-3 py-1.5 text-sm outline-none transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground',
                    'data-[selected]:bg-primary/10 data-[selected]:text-primary data-[selected]:font-medium',
                    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                  )}
                >
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

export { Select }
export type { SelectOption }
