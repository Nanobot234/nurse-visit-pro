import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth";
import logo from "@/assets/jarme-logo.png.asset.json";

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
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <img src={logo.url} alt="JARME Home & Healthcare Services logo" className="h-36 w-auto sm:h-44" />
      <p className="mt-6 font-medium text-primary">JARME Home &amp; Healthcare Services, Inc.</p>
      <h1 className="mt-3 font-serif text-4xl text-foreground sm:text-5xl">Nursing Visit Notes</h1>
      <p className="mt-6 max-w-xl text-lg text-muted-foreground">
        Keeping up with every patient, so we can provide compassionate, impactful care in every
        home we serve.
      </p>
      <Button asChild size="lg" className="mt-10">
        <Link to="/auth">Sign in</Link>
      </Button>
    </main>
  );
}
