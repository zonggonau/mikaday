import type { ShippingAddress } from "./address";
import { formatDate, formatMoney } from "./format";
import { site } from "./site";

// Customer emails. Email clients ignore stylesheets and web fonts, so everything is inline and table-based.

export interface EmailOrder {
  invoiceNumber: string;
  customerName: string;
  currency: string;
  subtotal: number;
  shippingTotal: number;
  total: number;
  shippingMethodName: string | null;
  address: ShippingAddress;
  items: { name: string; variant: string | null; quantity: number; unitPrice: number; imageUrl: string | null }[];
}

export interface EmailShipment {
  carrier: string | null;
  service: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const C = {
  page: "#FAF7F2",
  card: "#FFFFFF",
  ink: "#242424",
  muted: "#655E57",
  line: "#DDD5CB",
  soft: "#F1EBE3",
  primary: "#B94716",
  brand: "#E87932",
};
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";

const esc = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const firstName = (name: string) => name.trim().split(/\s+/)[0] || "there";
const money = (order: EmailOrder, amount: number) => formatMoney(amount, order.currency);
const trackPage = (order: EmailOrder) => `${site.url}/track?order=${encodeURIComponent(order.invoiceNumber)}`;
/** "USPS" + "USPS First Class Package" reads as just the service. */
function carrierName({ carrier, service }: EmailShipment) {
  if (carrier && service?.toLowerCase().startsWith(carrier.toLowerCase())) return service;
  return [carrier, service].filter(Boolean).join(" · ");
}

const orderNo = (order: EmailOrder) => `<strong style="white-space:nowrap">${esc(order.invoiceNumber)}</strong>`;

function countryName(code: string) {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

function addressLines(a: ShippingAddress) {
  return [
    a.name,
    a.company,
    a.address1,
    a.address2,
    [a.city, a.state, a.zip].filter(Boolean).join(", "),
    countryName(a.country),
  ].filter((line): line is string => Boolean(line));
}

function helpLine() {
  return site.supportEmail
    ? `Questions? Just reply to this email or write to ${site.supportEmail}.`
    : `Questions? Just reply to this email or reach us at ${site.url}/contact.`;
}

// ---------- Building blocks ----------

function button(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px"><tr>
<td style="border-radius:8px;background:${C.primary}"><a href="${esc(href)}" style="display:inline-block;padding:13px 22px;font-family:${SANS};font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:8px">${esc(label)}</a></td>
</tr></table>`;
}

function heading(text: string) {
  return `<h1 style="margin:0 0 12px;font-family:${SERIF};font-size:26px;line-height:1.25;font-weight:normal;color:${C.ink}">${esc(text)}</h1>`;
}

function paragraph(html: string) {
  return `<p style="margin:0 0 12px;font-family:${SANS};font-size:15px;line-height:1.6;color:${C.ink}">${html}</p>`;
}

function sectionTitle(text: string) {
  return `<p style="margin:28px 0 10px;font-family:${SANS};font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${C.muted}">${esc(text)}</p>`;
}

function itemRows(order: EmailOrder, withPrices: boolean) {
  return order.items
    .map((item) => {
      const image = item.imageUrl
        ? `<img src="${esc(item.imageUrl)}" width="56" height="56" alt="" style="display:block;width:56px;height:56px;object-fit:contain;border:1px solid ${C.line};border-radius:8px;background:${C.page}">`
        : `<div style="width:56px;height:56px;border:1px solid ${C.line};border-radius:8px;background:${C.page}"></div>`;
      const details = [item.variant, `Qty ${item.quantity}`].filter(Boolean).map((d) => esc(String(d))).join(" · ");
      return `<tr>
<td width="68" style="padding:10px 12px 10px 0;vertical-align:middle">${image}</td>
<td style="padding:10px 0;vertical-align:middle;font-family:${SANS};font-size:14px;line-height:1.45;color:${C.ink}"><strong style="font-weight:600">${esc(item.name)}</strong><br><span style="color:${C.muted}">${details}</span></td>
${withPrices ? `<td align="right" style="padding:10px 0 10px 12px;vertical-align:middle;font-family:${SANS};font-size:14px;color:${C.ink};white-space:nowrap">${esc(money(order, item.unitPrice * item.quantity))}</td>` : ""}
</tr>`;
    })
    .join("");
}

function itemsTable(order: EmailOrder, withPrices: boolean) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${C.line};border-bottom:1px solid ${C.line}">${itemRows(order, withPrices)}</table>`;
}

function totalsTable(order: EmailOrder) {
  const row = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:4px 0;font-family:${SANS};font-size:${strong ? 16 : 14}px;color:${strong ? C.ink : C.muted};${strong ? "font-weight:700;" : ""}">${esc(label)}</td><td align="right" style="padding:4px 0;font-family:${SANS};font-size:${strong ? 16 : 14}px;color:${C.ink};${strong ? "font-weight:700;" : ""}">${esc(value)}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:10px">
${row("Subtotal", money(order, order.subtotal))}
${row(order.shippingMethodName ? `Shipping (${order.shippingMethodName.replace(/\s*\(.*\)\s*$/, "")})` : "Shipping", money(order, order.shippingTotal))}
${row("Total paid", money(order, order.total), true)}
</table>`;
}

function addressBlock(order: EmailOrder) {
  return `<p style="margin:0;font-family:${SANS};font-size:14px;line-height:1.6;color:${C.ink}">${addressLines(order.address).map(esc).join("<br>")}</p>`;
}

function infoTable(rows: [string, string][]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.soft};border-radius:10px">
${rows
  .map(
    ([label, value]) =>
      `<tr><td style="padding:10px 16px;font-family:${SANS};font-size:13px;color:${C.muted};width:40%">${esc(label)}</td><td style="padding:10px 16px;font-family:${SANS};font-size:14px;font-weight:600;color:${C.ink};word-break:break-word;overflow-wrap:anywhere">${esc(value)}</td></tr>`,
  )
  .join("")}
</table>`;
}

function layout({ preheader, body }: { preheader: string; body: string }) {
  const social = site.social.length
    ? `<p style="margin:0 0 8px;font-family:${SANS};font-size:13px;color:${C.muted}">Follow Mika: ${site.social
        .map((s) => `<a href="${esc(s.url)}" style="color:${C.primary};text-decoration:underline">${esc(s.name)}</a>`)
        .join(" · ")}</p>`
    : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${esc(site.name)}</title>
</head>
<body style="margin:0;padding:0;background:${C.page}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.page}">
<tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">
<tr><td style="padding:0 8px 20px">
<a href="${esc(site.url)}" style="font-family:${SERIF};font-size:22px;letter-spacing:.18em;color:${C.ink};text-decoration:none">${esc(site.name)}</a>
<div style="width:40px;height:3px;margin-top:8px;background:${C.brand};border-radius:2px"></div>
</td></tr>
<tr><td style="background:${C.card};border:1px solid ${C.line};border-radius:14px;padding:32px 28px">
${body}
</td></tr>
<tr><td style="padding:22px 8px 0">
${social}
<p style="margin:0 0 6px;font-family:${SANS};font-size:13px;line-height:1.6;color:${C.muted}">${esc(helpLine())}</p>
<p style="margin:0;font-family:${SANS};font-size:12px;color:${C.muted}">${esc(site.name)} · ${esc(site.tagline)} · <a href="${esc(site.url)}" style="color:${C.muted}">${esc(site.url.replace(/^https?:\/\//, ""))}</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function textFooter() {
  return `\n\n${helpLine()}\n${site.name} · ${site.tagline} · ${site.url}`;
}

// ---------- Emails ----------

export function orderConfirmedEmail(order: EmailOrder): RenderedEmail {
  const subject = `Your ${site.name} order ${order.invoiceNumber} is confirmed`;
  const body = [
    heading(`Thank you, ${firstName(order.customerName)}!`),
    paragraph(
      `We've received your payment for order ${orderNo(order)}. Every piece is made just for you, so production starts right away. We'll email you the tracking number as soon as it ships.`,
    ),
    button(trackPage(order), "View order status"),
    sectionTitle("Order summary"),
    itemsTable(order, true),
    totalsTable(order),
    sectionTitle("Shipping to"),
    addressBlock(order),
  ].join("\n");

  const text = [
    `Thank you, ${firstName(order.customerName)}!`,
    "",
    `We've received your payment for order ${order.invoiceNumber}. Every piece is made just for you, so production starts right away. We'll email you the tracking number as soon as it ships.`,
    "",
    `Order status: ${trackPage(order)}`,
    "",
    "ORDER SUMMARY",
    ...order.items.map((i) => `- ${i.name}${i.variant ? ` (${i.variant})` : ""} × ${i.quantity}: ${money(order, i.unitPrice * i.quantity)}`),
    `Subtotal: ${money(order, order.subtotal)}`,
    `Shipping: ${money(order, order.shippingTotal)}`,
    `Total paid: ${money(order, order.total)}`,
    "",
    "SHIPPING TO",
    ...addressLines(order.address),
  ].join("\n");

  return { subject, html: layout({ preheader: `We've received your payment for ${order.invoiceNumber}.`, body }), text: text + textFooter() };
}

export function orderShippedEmail(order: EmailOrder, shipment: EmailShipment, shipmentCount: number): RenderedEmail {
  const several = shipmentCount > 1;
  const subject = `Your ${site.name} order ${order.invoiceNumber} is on its way`;
  const carrier = carrierName(shipment);
  const trackUrl = shipment.trackingUrl || trackPage(order);
  const details: [string, string][] = [
    ...(carrier ? [["Carrier", carrier] as [string, string]] : []),
    ["Tracking number", shipment.trackingNumber ?? "Pending"],
    ...(shipment.shippedAt ? [["Shipped", formatDate(shipment.shippedAt)] as [string, string]] : []),
  ];

  const body = [
    heading(several ? "Part of your order is on its way" : "Your order is on its way"),
    paragraph(
      `Good news, ${esc(firstName(order.customerName))}: ${several ? "a package" : "your package"} from order ${orderNo(order)} has shipped${carrier ? ` with ${esc(carrier)}` : ""}.`,
    ),
    infoTable(details),
    button(trackUrl, "Track your package"),
    paragraph(
      `<span style="color:${C.muted};font-size:13px">It can take a day or two for the first tracking update to appear.${several ? " Your order ships in more than one package, and we'll email you about each one." : ""}</span>`,
    ),
    sectionTitle("In your order"),
    itemsTable(order, false),
    sectionTitle("Shipping to"),
    addressBlock(order),
  ].join("\n");

  const text = [
    several ? "Part of your order is on its way" : "Your order is on its way",
    "",
    `Good news, ${firstName(order.customerName)}: ${several ? "a package" : "your package"} from order ${order.invoiceNumber} has shipped${carrier ? ` with ${carrier}` : ""}.`,
    "",
    ...details.map(([label, value]) => `${label}: ${value}`),
    `Track your package: ${trackUrl}`,
    "",
    "It can take a day or two for the first tracking update to appear.",
    "",
    "SHIPPING TO",
    ...addressLines(order.address),
  ].join("\n");

  return { subject, html: layout({ preheader: `Tracking for ${order.invoiceNumber}: ${shipment.trackingNumber ?? "inside"}`, body }), text: text + textFooter() };
}

export function orderDeliveredEmail(order: EmailOrder, shipment: EmailShipment, shipmentCount: number): RenderedEmail {
  const several = shipmentCount > 1;
  const subject = `Your ${site.name} order ${order.invoiceNumber} has arrived`;
  const when = shipment.deliveredAt ? ` on ${formatDate(shipment.deliveredAt)}` : "";
  const carrier = carrierName(shipment);

  const body = [
    heading(several ? "A package from your order has arrived" : "Your order has arrived"),
    paragraph(
      `${carrier ? `According to ${esc(carrier)}, ` : ""}${several ? "a package" : "your package"} from order ${orderNo(order)} was delivered${esc(when)}. We hope you love it, ${esc(firstName(order.customerName))}!`,
    ),
    paragraph(
      `Haven't received it, or is something not right? Reply to this email and we'll sort it out.`,
    ),
    button(trackPage(order), "View your order"),
    sectionTitle("In your order"),
    itemsTable(order, false),
  ].join("\n");

  const text = [
    several ? "A package from your order has arrived" : "Your order has arrived",
    "",
    `${carrier ? `According to ${carrier}, ` : ""}${several ? "a package" : "your package"} from order ${order.invoiceNumber} was delivered${when}. We hope you love it, ${firstName(order.customerName)}!`,
    "",
    "Haven't received it, or is something not right? Reply to this email and we'll sort it out.",
    "",
    `Your order: ${trackPage(order)}`,
  ].join("\n");

  return { subject, html: layout({ preheader: `Order ${order.invoiceNumber} was delivered${when}.`, body }), text: text + textFooter() };
}
