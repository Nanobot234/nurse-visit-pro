import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — JARME Nursing Portal" },
      { name: "description", content: "How JARME Home & Healthcare Services collects, uses, and protects information, including SMS mobile data." },
      { property: "og:title", content: "Privacy Policy — JARME Nursing Portal" },
      { property: "og:description", content: "How JARME protects your information, including mobile phone numbers used for SMS sign-in codes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="October 12, 2026">
      <p>
        JARME Home &amp; Healthcare Services, Inc. ("JARME", "we", "us") operates the JARME Nursing
        Portal at nursescribe.lovable.app (the "Portal"). This policy explains what information we
        collect from our nurses, aides, and office staff ("users"), how we use it, and how we protect it.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>Account information: your full name, work email address, and/or mobile phone number.</li>
        <li>Work records you create in the Portal, such as nursing visit notes, signatures, and progress notes.</li>
        <li>Basic technical data needed to keep you signed in and the Portal secure.</li>
      </ul>

      <h2>How we use your information</h2>
      <ul>
        <li>To create and secure your account and verify your identity at sign-in.</li>
        <li>To send one-time passcodes (OTP) by SMS when you request to sign in with your phone number.</li>
        <li>To record and store visit and progress documentation as part of patient care operations.</li>
        <li>To comply with legal, regulatory, and healthcare record-keeping obligations.</li>
      </ul>

      <h2>SMS / text messaging</h2>
      <p>
        If you enter your mobile number on the Portal sign-in page, you consent to receive one-time
        authentication codes from JARME. We use your number only for account authentication. Message
        frequency varies based on how often you sign in. Message and data rates may apply. Reply HELP
        for help or STOP to opt out at any time.
      </p>
      <p className="font-medium">
        No mobile information will be shared with third parties/affiliates for marketing/promotional
        purposes. All the above categories exclude text messaging originator opt-in data and consent;
        this information will not be shared with any third parties.
      </p>

      <h2>Sharing of information</h2>
      <p>
        We do not sell your personal information. We share information only with service providers
        who help us operate the Portal (for example, secure hosting and SMS delivery providers), solely
        to provide those services, or when required by law. Text messaging opt-in data and consent are
        never shared with third parties.
      </p>

      <h2>Security</h2>
      <p>
        Access to the Portal requires a verified account, and records are restricted by role (for
        example, progress notes are visible only to administrators). Data is encrypted in transit.
      </p>

      <h2>Retention</h2>
      <p>
        We retain account and care documentation for as long as required by our record-keeping
        obligations and applicable law.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>Reply STOP to any message to stop receiving SMS codes. You can still sign in by email.</li>
        <li>Contact us to update or correct your account information.</li>
      </ul>

      <h2>Contact us</h2>
      <p>
        JARME Home &amp; Healthcare Services, Inc. — Email:{" "}
        <a href="mailto:support@jhhcare.com" className="underline">support@jhhcare.com</a>
      </p>
    </LegalPage>
  );
}
