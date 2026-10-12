import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — JARME Nursing Portal" },
      { name: "description", content: "Terms for using the JARME Nursing Portal and its SMS authentication messaging program." },
      { property: "og:title", content: "Terms & Conditions — JARME Nursing Portal" },
      { property: "og:description", content: "Portal terms and SMS program details: frequency, rates, HELP and STOP instructions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions" updated="October 12, 2026">
      <p>
        These terms govern your use of the JARME Nursing Portal (the "Portal") operated by JARME Home
        &amp; Healthcare Services, Inc. ("JARME"). The Portal is for authorized JARME staff only. By
        signing in, you agree to these terms.
      </p>

      <h2>Use of the Portal</h2>
      <ul>
        <li>Use the Portal only for your work documenting care for JARME patients.</li>
        <li>Keep your sign-in details and verification codes private; never share them.</li>
        <li>Enter accurate information and protect patient confidentiality at all times.</li>
      </ul>

      <h2>SMS messaging program</h2>
      <ul>
        <li><strong>Program name:</strong> JARME Nursing Portal Authentication Alerts.</li>
        <li>
          <strong>Description:</strong> When you enter your mobile number on the Portal sign-in page,
          you will receive a one-time passcode by text to sign in or verify your account.
        </li>
        <li><strong>Message frequency:</strong> Varies; one message per sign-in or verification request.</li>
        <li><strong>Cost:</strong> Message and data rates may apply.</li>
        <li>
          <strong>Help:</strong> Reply HELP for assistance, or email{" "}
          <a href="mailto:support@jhhcare.com" className="underline">support@jhhcare.com</a>.
        </li>
        <li>
          <strong>Opt out:</strong> Reply STOP to cancel at any time. You will receive one final
          confirmation message and no further texts. You may still sign in by email.
        </li>
        <li>Carriers are not liable for delayed or undelivered messages.</li>
        <li>No marketing or promotional messages are sent through this program.</li>
      </ul>

      <h2>Privacy</h2>
      <p>
        Your information is handled as described in our Privacy Policy. Mobile opt-in data and consent
        are never shared with third parties for marketing purposes.
      </p>

      <h2>Changes</h2>
      <p>We may update these terms; the date above shows the latest version.</p>

      <h2>Contact</h2>
      <p>
        JARME Home &amp; Healthcare Services, Inc. —{" "}
        <a href="mailto:support@jhhcare.com" className="underline">support@jhhcare.com</a>
      </p>
    </LegalPage>
  );
}
