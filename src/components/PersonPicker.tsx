import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { PatientRow } from "@/lib/patients";

type Extra = { value: string; label: string };

/** A name picker with a search box, so staff can type to find a person instead of scrolling. */
export function PersonPicker({
  people,
  value,
  onChange,
  placeholder = "Choose a name",
  extraOptions = [],
  disabled,
}: {
  people: PatientRow[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  extraOptions?: Extra[];
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected =
    extraOptions.find((o) => o.value === value)?.label ?? people.find((p) => p.id === value)?.full_name;
  const patients = people.filter((p) => p.kind !== "employee");
  const employees = people.filter((p) => p.kind === "employee");

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  const item = (p: PatientRow) => (
    <CommandItem key={p.id} value={`${p.full_name} ${p.id}`} onSelect={() => pick(p.id)} className="py-2.5 text-base">
      <Check className={cn("h-4 w-4", value === p.id ? "opacity-100" : "opacity-0")} />
      {p.full_name}
    </CommandItem>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="h-11 w-full justify-between font-normal"
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>{selected ?? placeholder}</span>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="Type a name to search…" className="text-base" />
          <CommandList className="max-h-80">
            <CommandEmpty>No name matches.</CommandEmpty>
            {extraOptions.length > 0 && (
              <CommandGroup>
                {extraOptions.map((o) => (
                  <CommandItem key={o.value} value={o.label} onSelect={() => pick(o.value)} className="py-2.5 text-base">
                    <Check className={cn("h-4 w-4", value === o.value ? "opacity-100" : "opacity-0")} />
                    {o.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {patients.length > 0 && <CommandGroup heading="Patients">{patients.map(item)}</CommandGroup>}
            {employees.length > 0 && <CommandGroup heading="Employees">{employees.map(item)}</CommandGroup>}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
