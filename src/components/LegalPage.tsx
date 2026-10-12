import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <article className="mx-auto max-w-3xl space-y-6 text-sm leading-relaxed text-foreground [&_h2]:mt-8 [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6">
        <Link to="/auth" className="text-xs text-muted-foreground underline">← Back to sign in</Link>
        <header>
          <h1 className="font-serif text-3xl font-semibold">{title}</h1>
          <p className="mt-1 text-muted-foreground">JARME Home &amp; Healthcare Services, Inc. · Last updated {updated}</p>
        </header>
        {children}
        <footer className="border-t border-border pt-6 text-xs text-muted-foreground">
          <Link to="/privacy" className="underline">Privacy Policy</Link> ·{" "}
          <Link to="/terms" className="underline">Terms &amp; Conditions</Link>
        </footer>
      </article>
    </main>
  );
}
