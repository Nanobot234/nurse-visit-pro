import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JARME Nursing Visit Notes" },
      {
        name: "description",
        content:
          "Complete home care nursing visit notes on a phone or tablet, signed by the nurse and the aide before you leave the visit.",
      },
      { property: "og:title", content: "JARME Nursing Visit Notes" },
      {
        property: "og:description",
        content: "Paperless nursing visit notes with on-the-spot nurse and aide signatures.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { session, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) navigate({ to: "/dashboard", replace: true });
  }, [loading, session, navigate]);

  return (
    <main className="flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-20">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
          JARME Home &amp; Healthcare Services, Inc.
        </p>
        <h1 className="mt-4 font-serif text-4xl leading-tight text-foreground sm:text-5xl">
          Nursing visit notes,
          <br />
          finished at the bedside.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          The same visit note your nurses already know, filled in on a phone or tablet. The nurse and
          the aide sign with a finger before leaving the home, and the office sees it right away.
        </p>
        <div className="mt-10">
          <Button asChild size="lg">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
        <dl className="mt-16 grid gap-8 border-t border-border pt-10 sm:grid-cols-3">
          <div>
            <dt className="font-serif text-lg text-foreground">One form</dt>
            <dd className="mt-1 text-sm text-muted-foreground">
              Every field from the paper note, in the same order.
            </dd>
          </div>
          <div>
            <dt className="font-serif text-lg text-foreground">Two signatures</dt>
            <dd className="mt-1 text-sm text-muted-foreground">
              Nurse and aide sign by hand on the same device.
            </dd>
          </div>
          <div>
            <dt className="font-serif text-lg text-foreground">Findable</dt>
            <dd className="mt-1 text-sm text-muted-foreground">
              The office searches completed notes by patient name.
            </dd>
          </div>
        </dl>
      </div>
    </main>
  );
}
