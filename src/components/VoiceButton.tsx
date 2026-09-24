import { useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { recordWav } from "@/lib/record-wav";

/** Records speech and appends the transcript via onText (streamed pieces). */
export function VoiceButton({ onText }: { onText: (text: string) => void }) {
  const [state, setState] = useState<"idle" | "recording" | "working">("idle");
  const recRef = useRef<{ stop: () => Promise<File> } | null>(null);

  const start = async () => {
    try {
      recRef.current = await recordWav();
      setState("recording");
    } catch {
      toast.error("Could not use the microphone. Please allow microphone access.");
    }
  };

  const stop = async () => {
    const rec = recRef.current;
    if (!rec) return;
    recRef.current = null;
    setState("working");
    try {
      const file = await rec.stop();
      const { data } = await supabase.auth.getSession();
      const form = new FormData();
      form.append("file", file, file.name);
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { Authorization: `Bearer ${data.session?.access_token ?? ""}` },
        body: form,
      });
      if (!res.ok || !res.body) {
        const msg = await res.text().catch(() => "");
        throw new Error(
          res.status === 402
            ? "Voice notes are paused: out of AI credits."
            : res.status === 429
              ? "Too many requests — try again in a moment."
              : msg.slice(0, 200) || "Could not transcribe the recording.",
        );
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let got = false;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const events = buf.split("\n\n");
        buf = events.pop() ?? "";
        for (const ev of events) {
          const line = ev.split("\n").find((l) => l.startsWith("data:"));
          if (!line) continue;
          const payload = line.slice(5).trim();
          if (payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload);
            if (json.type === "transcript.text.delta" && json.delta) {
              got = true;
              onText(json.delta);
            } else if (json.type === "transcript.text.done" && !got && json.text) {
              got = true;
              onText(json.text);
            } else if (json.error) {
              throw new Error(json.error.message ?? "Transcription failed");
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
      if (!got) toast.error("No speech was heard. Please try again.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not transcribe the recording.");
    } finally {
      setState("idle");
    }
  };

  if (state === "recording")
    return (
      <Button type="button" variant="destructive" size="sm" onClick={stop}>
        <Square className="mr-1 h-4 w-4" /> Stop recording
      </Button>
    );
  return (
    <Button type="button" variant="outline" size="sm" onClick={start} disabled={state === "working"}>
      {state === "working" ? (
        <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Writing it out…</>
      ) : (
        <><Mic className="mr-1 h-4 w-4" /> Speak note</>
      )}
    </Button>
  );
}
