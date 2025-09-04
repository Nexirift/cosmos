"use client";

import * as React from "react";
import { FieldValues, Path } from "react-hook-form";
import { ChevronsUpDown, Check, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Reusable Combobox Component (Shadcn + Command + Popover)
 *
 * Features:
 * - Controlled (value + onChange)
 * - Searchable
 * - Clearable (optional)
 * - Custom render for options
 * - Custom button content
 * - Disabled state
 * - Keyboard & accessible behavior
 * - Optional descriptive empty message
 */

export type ComboboxOption = {
  label: string;
  value: string;
  // Optional icon component
  icon?: React.ComponentType<{ className?: string }>;
  // Any extra meta data
  meta?: Record<string, unknown>;
};

interface BaseProps {
  options: readonly ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  popoverClassName?: string;
  commandClassName?: string;
  buttonClassName?: string;
  disabled?: boolean;
  clearable?: boolean;
  /**
   * Custom renderer for the button label
   */
  renderButtonValue?: (selected?: ComboboxOption) => React.ReactNode;
  /**
   * Custom renderer for individual option
   */
  renderOption?: (option: ComboboxOption, selected: boolean) => React.ReactNode;
  /**
   * Optional id / name prefix for accessibility
   */
  id?: string;
}

export interface ComboboxProps extends BaseProps {
  value?: string | null;
  onChange?: (value: string | null, option?: ComboboxOption) => void;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const Combobox = React.forwardRef<HTMLButtonElement, ComboboxProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = "Select an option",
      searchPlaceholder = "Search...",
      emptyMessage = "No results found.",
      className,
      popoverClassName,
      commandClassName,
      buttonClassName,
      disabled,
      clearable = true,
      renderButtonValue,
      renderOption,
      id,
      defaultOpen,
      open: openProp,
      onOpenChange,
    },
    ref,
  ) => {
    const [internalOpen, setInternalOpen] = React.useState<boolean>(
      defaultOpen ?? false,
    );
    const isControlledOpen = openProp !== undefined;
    const open = isControlledOpen ? openProp : internalOpen;

    const setOpen = (next: boolean) => {
      if (!isControlledOpen) setInternalOpen(next);
      onOpenChange?.(next);
    };

    const selected = options.find((o) => o.value === value) || undefined;

    const handleSelect = (val: string) => {
      if (val === value) {
        if (clearable) {
          onChange?.(null, undefined);
        }
        setOpen(false);
        return;
      }
      const opt = options.find((o) => o.label === val || o.value === val);
      if (opt) {
        onChange?.(opt.value, opt);
        setOpen(false);
      }
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled) return;
      onChange?.(null, undefined);
    };

    return (
      <div className={cn("w-full", className)}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={ref}
              type="button"
              variant="outline"
              role="combobox"
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-controls={id ? `${id}-command` : undefined}
              disabled={disabled}
              className={cn(
                "w-full justify-between font-normal",
                !selected && "text-muted-foreground",
                buttonClassName,
              )}
              onClick={() => setOpen(!open)}
            >
              <span className="truncate">
                {renderButtonValue
                  ? renderButtonValue(selected)
                  : selected?.label || placeholder}
              </span>
              <div className="flex items-center gap-1">
                {clearable && selected && !disabled && (
                  <X
                    className="h-4 w-4 min-w-4 opacity-60 hover:opacity-100"
                    onClick={handleClear}
                    aria-label="Clear selection"
                  />
                )}
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className={cn(
              "w-[var(--radix-popover-trigger-width)] p-0",
              popoverClassName,
            )}
          >
            <Command
              id={id ? `${id}-command` : undefined}
              className={cn("max-h-72", commandClassName)}
            >
              <CommandInput placeholder={searchPlaceholder} className="h-9" />
              <CommandList>
                <CommandEmpty>{emptyMessage}</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => {
                    const isSelected = option.value === value;
                    return (
                      <CommandItem
                        key={option.value}
                        value={option.label}
                        onSelect={handleSelect}
                        className="cursor-pointer"
                      >
                        {renderOption ? (
                          renderOption(option, isSelected)
                        ) : (
                          <>
                            {option.icon && (
                              <option.icon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
                            )}
                            <span className="truncate">{option.label}</span>
                            <Check
                              className={cn(
                                "ml-auto h-4 w-4",
                                isSelected ? "opacity-100" : "opacity-0",
                              )}
                            />
                          </>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  },
);
Combobox.displayName = "Combobox";

/**
 * React Hook Form field wrapper
 *
 * Usage:
 * <FormCombobox
 *   control={form.control}
 *   name="language"
 *   label="Language"
 *   description="Select the language for the dashboard."
 *   options={languageOptions}
 * />
 */
interface FormComboboxProps<TFieldValues extends FieldValues>
  extends Omit<ComboboxProps, "value"> {
  control: any;
  name: Path<TFieldValues>;
  label?: React.ReactNode;
  description?: React.ReactNode;
  required?: boolean;
  onChange?: (value: string | null, option?: ComboboxOption) => void;
  /** Forward additional FormItem props if needed later */
}

export function FormCombobox<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  onChange,
  ...comboboxProps
}: FormComboboxProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          {label && (
            <FormLabel>
              {label} {required && <span className="text-destructive">*</span>}
            </FormLabel>
          )}
          <FormControl>
            <Combobox
              {...comboboxProps}
              value={field.value}
              onChange={(val, option) => {
                field.onChange(val);
                onChange?.(val, option);
              }}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
