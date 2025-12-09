import PDFDocument from "pdfkit";

// Palette WoodTech
const colors = {
  dark: "#0f172a",
  brand: "#c08457",
  brandDark: "#8c5a36",
  text: "#1f2937",
  muted: "#4b5563",
  light: "#f8f5f2",
};

// Genere une facture PDF soignee avec bandeau, badges et mise en page premium.
export async function buildInvoicePdf({
  orderId = "INV-" + Date.now(),
  customerName = "",
  customerEmail = "",
  items = [],
  currency = "EUR",
  total = 0,
}) {
  const doc = new PDFDocument({ size: "A4", margin: 42 });
  const chunks = [];
  doc.on("data", (c) => chunks.push(c));
  const done = new Promise((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  // Bandeau haut
  const topGradient = doc.linearGradient(42, 36, 554, 126);
  topGradient.stop(0, colors.dark).stop(1, colors.brand);
  doc.save().rect(42, 36, 512, 90).fill(topGradient).restore();
  doc.fillColor(colors.light).fontSize(22).font("Helvetica-Bold").text("WoodTech", 56, 56);
  doc.fontSize(10).font("Helvetica").text("Facture", 56, 82);
  doc.fontSize(10).text(new Date().toLocaleDateString("fr-FR"), 56, 98);

  // Badge facture
  doc
    .fillColor(colors.light)
    .fontSize(12)
    .font("Helvetica-Bold")
    .text(orderId, 430, 56, { align: "right", width: 120 });
  doc.save();
  doc.rect(430, 82, 120, 26).fill(colors.light);
  doc
    .fillColor(colors.brandDark)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("Paiement confirme", 440, 88, { align: "left", width: 100 });
  doc.restore();

  doc.moveDown(3);

  // Bloc info
  doc
    .fillColor(colors.text)
    .font("Helvetica-Bold")
    .fontSize(14)
    .text("Coordonnees", 42, 150);
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(colors.muted)
    .text("Atelier WoodTech, Normandie\ncontact@woodtech.fr\n15 rue des Metiers, 14000 Caen", 42, 166);

  doc.font("Helvetica-Bold").fontSize(12).fillColor(colors.text).text("Client", 320, 150);
  const clientLines = [
    customerName ? `Nom: ${customerName}` : null,
    customerEmail ? `Email: ${customerEmail}` : null,
  ]
    .filter(Boolean)
    .join("\n");
  doc.font("Helvetica").fontSize(10).fillColor(colors.muted).text(clientLines || "Client invite", 320, 166);

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(colors.text)
    .text("Facture", 42, 230);
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(colors.muted)
    .text(`Numero: ${orderId}\nDate: ${new Date().toLocaleDateString("fr-FR")}`, 42, 246);

  // Tableau
  const tableTop = 300;
  const colX = [42, 280, 360, 460];
  drawRow(doc, tableTop, colX, ["Description", "Quantite", "Prix", "Total"], true);
  let y = tableTop + 22;
  items.forEach((item) => {
    drawRow(doc, y, colX, [
      item.title ?? "Produit",
      String(item.qty ?? 1),
      formatPrice(item.price ?? 0, currency),
      formatPrice(item.total ?? (item.price ?? 0) * (item.qty ?? 1), currency),
    ]);
    y += 18;
  });

  // Total bloc
  doc
    .moveTo(colX[0], y + 8)
    .lineTo(554, y + 8)
    .strokeColor("#e5e7eb")
    .lineWidth(1)
    .stroke();
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(colors.text)
    .text("Total", colX[2], y + 14, { width: 80, align: "right" });
  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor(colors.text)
    .text(formatPrice(total, currency), colX[3], y + 12, { width: 90, align: "right" });

  // Bandeau bas
  doc
    .save();
  const bottomGradient = doc.linearGradient(42, 730, 554, 790);
  bottomGradient.stop(0, colors.brand).stop(1, colors.dark);
  doc.rect(42, 730, 512, 60).fill(bottomGradient).restore();
  doc
    .fillColor(colors.light)
    .font("Helvetica")
    .fontSize(10)
    .text(
      "Merci pour votre confiance. Cette facture est generee automatiquement suite au paiement.",
      56,
      744
    );

  doc.end();
  return done;
}

const drawRow = (doc, y, colX, cells, isHeader = false) => {
  doc
    .font(isHeader ? "Helvetica-Bold" : "Helvetica")
    .fontSize(isHeader ? 11 : 10)
    .fillColor(isHeader ? "#111827" : "#1f2937");
  doc.text(cells[0], colX[0], y, { width: 220 });
  doc.text(cells[1], colX[1], y, { width: 60, align: "right" });
  doc.text(cells[2], colX[2], y, { width: 80, align: "right" });
  doc.text(cells[3], colX[3], y, { width: 90, align: "right" });
};

const formatPrice = (value, currency) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(value);

export default buildInvoicePdf;
