import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type PDFImage } from "pdf-lib";
import { JARME_LOGO_PNG_BASE64 } from "./jarme-logo-base64.server";

// Records Management site that holds Patients/Patient Information/<Name>/...
const SITE_ID =
  "jhhcare.sharepoint.com,f9387e26-71b0-4222-b7cc-ec66ca61c827,76f0b10a-af5e-4bb1-94b6-d2304c8d09a3";
const GATEWAY = "https://connector-gateway.lovable.dev/microsoft_sharepoint";
const PATIENTS_ROOT = "Patients/Patient Information";

function headers(extra?: Record<string, string>) {
  const lovable = process.env["LOVABLE_API_KEY"];
  const conn = process.env["MICROSOFT_SHAREPOINT_API_KEY"];
  if (!lovable || !conn) throw new Error("SharePoint is not connected to this app.");
  return { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": conn, ...extra };
}

const enc = (path: string) => path.split("/").map(encodeURIComponent).join("/");
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Find the existing patient folder name (loose match), else use the cleaned name. */
async function resolvePatientFolder(patientName: string): Promise<string> {
  const target = norm(patientName);
  let url: string | null =
    `${GATEWAY}/sites/${SITE_ID}/drive/root:/${enc(PATIENTS_ROOT)}:/children?$select=name,folder&$top=200`;
  while (url) {
    const res: Response = await fetch(url, { headers: headers() });
    if (!res.ok) throw new Error(`SharePoint folder lookup failed [${res.status}]: ${await res.text()}`);
    const json = (await res.json()) as { value: { name: string; folder?: unknown }[]; "@odata.nextLink"?: string };
    const hit = json.value.find((i) => i.folder && norm(i.name) === target);
    if (hit) return hit.name;
    const next = json["@odata.nextLink"];
    url = next ? next.replace("https://graph.microsoft.com/v1.0", GATEWAY) : null;
  }
  return patientName.replace(/[\\/:*?"<>|#%]/g, "-").trim() || "Unknown patient";
}

export async function uploadToPatientFolder(opts: {
  patientName: string;
  subfolder: "Nursing Visit Notes" | "Patient Notes";
  fileBase: string; // e.g. "Nursing Visit Note - 2026-10"
  year: string;
  pdf: Uint8Array;
}): Promise<{ url: string; itemId: string }> {
  const folder = await resolvePatientFolder(opts.patientName);
  const path = `${PATIENTS_ROOT}/${folder}/${opts.subfolder}/${opts.year}/${opts.fileBase}.pdf`;
  const res = await fetch(
    `${GATEWAY}/sites/${SITE_ID}/drive/root:/${enc(path)}:/content?@microsoft.graph.conflictBehavior=rename`,
    { method: "PUT", headers: headers({ "Content-Type": "application/pdf" }), body: new Blob([opts.pdf as Uint8Array<ArrayBuffer>]) },
  );
  if (!res.ok) throw new Error(`SharePoint upload failed [${res.status}]: ${await res.text()}`);
  const json = (await res.json()) as { webUrl?: string; id?: string };
  return { url: json.webUrl ?? "", itemId: json.id ?? "" };
}

/** Delete a previously uploaded file. Missing files (already removed) are fine. */
export async function deleteSharePointItem(itemId: string): Promise<void> {
  const res = await fetch(`${GATEWAY}/sites/${SITE_ID}/drive/items/${encodeURIComponent(itemId)}`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`SharePoint delete failed [${res.status}]: ${await res.text()}`);
  }
}

// ---------------------------------------------------------------------------
// PDF builder
// ---------------------------------------------------------------------------

const RED = rgb(0.78, 0.12, 0.15);
const GREY = rgb(0.4, 0.4, 0.4);
const INK = rgb(0.1, 0.1, 0.1);

export class NotePdf {
  private constructor(
    private doc: PDFDocument,
    private font: PDFFont,
    private bold: PDFFont,
    private logo: PDFImage,
    private title: string,
  ) {}
  private page!: PDFPage;
  private y = 0;
  private readonly margin = 48;
  private readonly width = 612;
  private readonly height = 792;

  static async create(title: string) {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const logo = await doc.embedPng(Uint8Array.from(atob(JARME_LOGO_PNG_BASE64), (c) => c.charCodeAt(0)));
    const pdf = new NotePdf(doc, font, bold, logo, title);
    pdf.newPage();
    return pdf;
  }

  private newPage() {
    this.page = this.doc.addPage([this.width, this.height]);
    const h = 54;
    const w = (this.logo.width / this.logo.height) * h;
    this.page.drawImage(this.logo, { x: this.margin, y: this.height - this.margin - h, width: w, height: h });
    const tx = this.margin + w + 12;
    this.page.drawText("JARME Home & Healthcare Services, Inc.", {
      x: tx, y: this.height - this.margin - 20, size: 13, font: this.bold, color: INK,
    });
    this.page.drawText(this.title, { x: tx, y: this.height - this.margin - 40, size: 11, font: this.font, color: RED });
    const lineY = this.height - this.margin - h - 10;
    this.page.drawLine({
      start: { x: this.margin, y: lineY }, end: { x: this.width - this.margin, y: lineY }, thickness: 1, color: RED,
    });
    this.y = lineY - 20;
  }

  private ensure(space: number) {
    if (this.y - space < this.margin) this.newPage();
  }

  private clean(s: string) {
    // Standard fonts only cover WinAnsi; drop anything else.
    return s.replace(/[\u2013\u2014]/g, "-").replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')
      .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "");
  }

  private wrap(text: string, size: number, maxWidth: number, f = this.font) {
    const lines: string[] = [];
    for (const para of this.clean(text).split(/\r?\n/)) {
      let line = "";
      for (const word of para.split(/\s+/)) {
        const test = line ? `${line} ${word}` : word;
        if (f.widthOfTextAtSize(test, size) > maxWidth && line) {
          lines.push(line);
          line = word;
        } else line = test;
      }
      lines.push(line);
    }
    return lines;
  }

  heading(text: string) {
    this.ensure(30);
    this.y -= 6;
    this.page.drawText(this.clean(text), { x: this.margin, y: this.y, size: 12, font: this.bold, color: RED });
    this.y -= 16;
  }

  row(label: string, value: string) {
    const labelW = 200;
    const valW = this.width - this.margin * 2 - labelW;
    const lines = this.wrap(value || "-", 10, valW);
    const labelLines = this.wrap(label, 9, labelW - 8, this.bold);
    const n = Math.max(lines.length, labelLines.length);
    this.ensure(n * 13 + 4);
    labelLines.forEach((l, i) =>
      this.page.drawText(l, { x: this.margin, y: this.y - i * 13, size: 9, font: this.bold, color: GREY }),
    );
    lines.forEach((l, i) =>
      this.page.drawText(l, { x: this.margin + labelW, y: this.y - i * 13, size: 10, font: this.font, color: INK }),
    );
    this.y -= n * 13 + 4;
  }

  paragraph(text: string) {
    for (const l of this.wrap(text, 10.5, this.width - this.margin * 2)) {
      this.ensure(15);
      this.page.drawText(l, { x: this.margin, y: this.y, size: 10.5, font: this.font, color: INK });
      this.y -= 15;
    }
  }

  async signature(label: string, dataUrl: string | null, signedAt: string | null) {
    this.ensure(100);
    this.page.drawText(label, { x: this.margin, y: this.y, size: 9, font: this.bold, color: GREY });
    this.y -= 8;
    if (dataUrl?.startsWith("data:image/")) {
      const bytes = Uint8Array.from(atob(dataUrl.split(",")[1] ?? ""), (c) => c.charCodeAt(0));
      const img = dataUrl.startsWith("data:image/png") ? await this.doc.embedPng(bytes) : await this.doc.embedJpg(bytes);
      const h = 60;
      const w = Math.min((img.width / img.height) * h, 240);
      this.page.drawImage(img, { x: this.margin, y: this.y - h, width: w, height: h });
      this.y -= h + 4;
    } else {
      this.y -= 14;
      this.page.drawText("Not signed", { x: this.margin, y: this.y, size: 10, font: this.font, color: INK });
    }
    this.page.drawLine({
      start: { x: this.margin, y: this.y }, end: { x: this.margin + 240, y: this.y }, thickness: 0.5, color: GREY,
    });
    this.y -= 12;
    if (signedAt) {
      this.page.drawText(`Signed ${new Date(signedAt).toLocaleString("en-US", { timeZone: "America/New_York" })}`, {
        x: this.margin, y: this.y, size: 8, font: this.font, color: GREY,
      });
      this.y -= 14;
    }
  }

  save() {
    return this.doc.save();
  }
}
