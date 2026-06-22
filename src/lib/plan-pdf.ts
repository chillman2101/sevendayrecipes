import { PDFDocument, PDFFont, RGB, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import type { Plan, Recipe } from "@/types";
import { DAY_LABELS, formatPlanDate, getBaseUrl } from "@/lib/utils";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const INK = rgb(0.12, 0.08, 0.2);
const BUTTER = rgb(1, 0.92, 0.55);

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let current = words[0] ?? "";

  for (let i = 1; i < words.length; i += 1) {
    const next = `${current} ${words[i]}`;
    if (font.widthOfTextAtSize(next, size) > maxWidth) {
      lines.push(current);
      current = words[i]!;
    } else {
      current = next;
    }
  }

  lines.push(current);
  return lines;
}

function drawWrappedText(
  page: ReturnType<PDFDocument["addPage"]>,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  maxWidth: number,
  color: RGB = INK
): number {
  const lines = wrapText(text, font, size, maxWidth);
  for (const line of lines) {
    page.drawText(line, { x, y, size, font, color });
    y -= size + 4;
  }
  return y;
}

export async function buildPlanPdf(plan: Plan, recipes: Recipe[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const baseUrl = getBaseUrl();
  const recipeMap = new Map(recipes.map((r) => [r.id, r]));

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
  };

  page.drawText("SEVENDAY RECIPES", {
    x: MARGIN,
    y,
    size: 10,
    font,
    color: INK,
  });
  y -= 22;

  page.drawText("Menu Minggu Ini", {
    x: MARGIN,
    y,
    size: 22,
    font: fontBold,
    color: INK,
  });
  y -= 24;

  page.drawText(formatPlanDate(plan.createdAt), {
    x: MARGIN,
    y,
    size: 11,
    font,
    color: INK,
  });
  y -= 28;

  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 2,
    color: INK,
  });
  y -= 24;

  for (let i = 0; i < plan.config.days; i += 1) {
    const day = i + 1;
    const label = DAY_LABELS[i] ?? `Hari ${day}`;
    const slots = plan.slots.filter((s) => s.day === day);
    const titles = slots
      .map((s) => recipeMap.get(s.recipeId)?.title)
      .filter(Boolean) as string[];
    const menuSummary = titles.join(" · ");

    ensureSpace(80);
    page.drawRectangle({
      x: MARGIN,
      y: y - 22,
      width: CONTENT_WIDTH,
      height: 26,
      color: BUTTER,
      borderColor: INK,
      borderWidth: 1,
    });
    page.drawText(`Hari ${day} — ${label}`, {
      x: MARGIN + 10,
      y: y - 16,
      size: 13,
      font: fontBold,
      color: INK,
    });
    y -= 36;

    if (menuSummary) {
      ensureSpace(24);
      y = drawWrappedText(page, menuSummary, MARGIN, y, font, 10, CONTENT_WIDTH);
      y -= 8;
    }

    for (const slot of slots) {
      const recipe = recipeMap.get(slot.recipeId);
      if (!recipe) continue;

      ensureSpace(110);
      const cardTop = y;
      const cardHeight = 96;
      page.drawRectangle({
        x: MARGIN,
        y: cardTop - cardHeight,
        width: CONTENT_WIDTH,
        height: cardHeight,
        color: rgb(1, 1, 1),
        borderColor: INK,
        borderWidth: 1,
      });

      const textX = MARGIN + 12;
      const textMaxWidth = CONTENT_WIDTH - 120;
      let textY = cardTop - 18;

      page.drawText(`Lauk ${slot.slot}`, {
        x: textX,
        y: textY,
        size: 9,
        font,
        color: INK,
      });
      textY -= 16;

      if (slot.pantryTag) {
        page.drawText(`Pakai: ${slot.pantryTag}`, {
          x: textX,
          y: textY,
          size: 9,
          font: fontBold,
          color: INK,
        });
        textY -= 14;
      }

      textY = drawWrappedText(page, recipe.title, textX, textY, fontBold, 12, textMaxWidth);
      page.drawText("Scan QR untuk bahan & langkah", {
        x: textX,
        y: cardTop - cardHeight + 12,
        size: 9,
        font,
        color: INK,
      });

      const qrBuffer = await QRCode.toBuffer(`${baseUrl}/recipe/${slot.recipeId}`, {
        type: "png",
        margin: 1,
        width: 120,
      });
      const qrImage = await pdfDoc.embedPng(qrBuffer);
      const qrSize = 72;
      page.drawImage(qrImage, {
        x: PAGE_WIDTH - MARGIN - qrSize - 10,
        y: cardTop - cardHeight + 12,
        width: qrSize,
        height: qrSize,
      });

      y = cardTop - cardHeight - 12;
    }

    y -= 8;
  }

  ensureSpace(40);
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 1,
    color: INK,
  });
  y -= 16;
  page.drawText("Scan QR untuk melihat detail resep di SevenDay Recipes", {
    x: MARGIN,
    y,
    size: 9,
    font,
    color: INK,
  });

  return pdfDoc.save();
}

export function planPdfFilename(plan: Plan): string {
  const dateSlug = new Date(plan.createdAt).toISOString().slice(0, 10);
  return `menu-mingguan-${dateSlug}.pdf`;
}
