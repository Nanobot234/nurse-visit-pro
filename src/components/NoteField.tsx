import type { NoteField } from "@/lib/visit-note-schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Props {
  field: NoteField;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  error?: string;
}

//The notes that can be written for each health metric is editable
export function NoteFieldInput({ field, value, onChange, readOnly, error }: Props) {
  const id = `field-${field.key}`;

  if (readOnly) {
    return (
      <div className={cn("space-y-1", field.width === "full" && "sm:col-span-full")}>
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{field.label}</span>
        <p className="whitespace-pre-wrap text-foreground">{value || "—"}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", field.width === "full" && "sm:col-span-full")}>
      <Label htmlFor={id}>
        {field.label}
        {field.required && <span className="text-destructive"></span>}
      </Label>
      {field.suggestions?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {field.suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange(value === s ? "" : s)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs transition-colors",
                value === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary hover:text-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}
      {field.type === "textarea" ? (
        <Textarea
          id={id}
          rows={4}
          value={value}
          maxLength={2000}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input
          id={id}
          type={field.type === "date" ? "date" : "text"}
          value={value}
          maxLength={200}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {error && !readOnly && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
