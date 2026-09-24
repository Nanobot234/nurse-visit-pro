import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const MAX_BYTES = 13 * 1024 * 1024;

export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return new Response("Unauthorized", { status: 401 });
        const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: userData, error: userErr } = await sb.auth.getUser(token);
        if (userErr || !userData.user) return new Response("Unauthorized", { status: 401 });

        const len = Number(request.headers.get("content-length") ?? 0);
        if (len > MAX_BYTES + 100_000) return new Response("Recording is too long", { status: 413 });

        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof File) || !file.size || file.size > MAX_BYTES || !file.type.startsWith("audio/")) {
          return new Response("Invalid recording", { status: 400 });
        }
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return new Response("Voice service not configured", { status: 500 });

        const out = new FormData();
        out.append("model", "google/gemini-3.5-transcribe");
        out.append("file", file, file.name);
        out.append("response_format", "json");
        out.append("stream", "true");
        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: out,
          signal: request.signal,
        });
        if (!upstream.ok) {
          const body = await upstream.text();
          console.error(`Transcription failed [${upstream.status}]: ${body}`);
        }
        return new Response(upstream.body, {
          status: upstream.status,
          headers: { "content-type": upstream.headers.get("content-type") ?? "text/event-stream" },
        });
      },
    },
  },
});
