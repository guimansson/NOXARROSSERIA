const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const prefix = "/NOXARROSSERIA/";
const homepages = new Map([
  ["index.html", "ca"],
  ["es/index.html", "es"],
  ["en/index.html", "en"],
  ["fr/index.html", "fr"],
  ["pt/index.html", "pt-BR"],
]);
const cookieLabels = new Map([
  ["ca", "Avís de cookies"],
  ["es", "Aviso de cookies"],
  ["en", "Cookie notice"],
  ["fr", "Avis sur les cookies"],
  ["pt-BR", "Aviso de cookies"],
]);
const issues = [];
let checks = 0;

function check(description, valid) {
  checks++;
  if (!valid) issues.push(description);
}

function listFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === ".git" || entry.name === ".venv") return [];
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return listFiles(file);
    return [file];
  });
}

function relative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function existsForUrl(url) {
  let target = decodeURIComponent(url.slice(prefix.length).split(/[?#]/)[0]);
  if (!target || target.endsWith("/")) target += "index.html";
  return fs.existsSync(path.join(root, target));
}

function expectedLanguage(file) {
  const first = file.split("/")[0];
  return ({
    "index.html": "ca",
    es: "es",
    en: "en",
    fr: "fr",
    pt: "pt-BR",
  })[first] || "ca";
}

function isLegalPage(file) {
  return /(?:^|\/)(?:avis-legal|legal-notice|aviso-legal|mentions-legales|privacitat|privacy|privacidad|confidentialite)\//i.test(file);
}

function inspectHtml(file, source) {
  const name = relative(file);
  const lang = expectedLanguage(name);

  for (const match of source.matchAll(/\b(href|src|srcset)="([^"]+)"/g)) {
    const urls = match[1] === "srcset"
      ? match[2].split(",").map((candidate) => candidate.trim().split(/\s+/)[0])
      : [match[2]];
    for (const url of urls) {
      if (/^(?:https?:|mailto:|tel:|data:|javascript:|#)/i.test(url)) continue;
      check(`${name}: internal ${match[1]} starts with ${prefix}`, url.startsWith(prefix));
      if (url.startsWith(prefix)) check(`${name}: target exists (${url})`, existsForUrl(url));
    }
  }

  for (const match of source.matchAll(/<img\b([^>]*)>/gi)) {
    check(`${name}: image has alt`, /\balt="[^"]*"/i.test(match[1]));
    check(`${name}: image has width and height`, /\bwidth="\d+"/i.test(match[1]) && /\bheight="\d+"/i.test(match[1]));
  }

  const headings = [...source.matchAll(/<h([1-6])\b/gi)].map((match) => Number(match[1]));
  check(`${name}: exactly one h1`, headings.filter((heading) => heading === 1).length === 1);
  for (let index = 1; index < headings.length; index++) {
    check(`${name}: heading order has no skipped levels`, headings[index] <= headings[index - 1] + 1);
  }

  const labels = [...source.matchAll(/\baria-label="([^"]+)"/gi)].map((match) => match[1]);
  check(`${name}: aria-labels are present and non-English where required`,
    Boolean(lang) && (lang === "en" || !labels.some((label) => /\b(?:main menu|language|the menu|dietary filters|allergens|follow us on instagram|legal notice|privacy policy|cookie notice)\b/i.test(label))));
  if (lang) {
    const cookieLabel = source.match(/<div\b[^>]*class="cookie-banner"[^>]*aria-label="([^"]+)"/i);
    check(`${name}: localized cookie banner aria-label`, cookieLabel?.[1] === cookieLabels.get(lang));
  }

  check(`${name}: cookie banner has two buttons`,
    (source.match(/<button\b[^>]*\bdata-consent="(?:granted|denied)"/gi) || []).length === 2);
  check(`${name}: footer has cookie settings`, /class="cookie-settings"/.test(source));

  const withoutScripts = source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  check(`${name}: Google Tag Manager appears only in scripts`, !/googletagmanager/i.test(withoutScripts));
  if (/googletagmanager/i.test(source)) {
    check(`${name}: Google Tag Manager is loaded through consent guard`,
      /function loadGA\(\)[\s\S]*?if \(window\.__noxGA \|\| !\(PROD \|\| TEST\)\) return;[\s\S]*?googletagmanager/i.test(source));
  }

  if (homepages.has(name)) {
    check(`${name}: correct html lang`, source.includes(`<html lang="${homepages.get(name)}">`));
    check(`${name}: title present`, /<title>[^<]+<\/title>/i.test(source));
    check(`${name}: meta description present`, /<meta name="description" content="[^"]+"/i.test(source));
    check(`${name}: canonical present`, /<link rel="canonical" href="https:\/\/noxarrosseria\.com\//i.test(source));
    for (const language of ["ca", "es", "en", "fr", "pt", "x-default"]) {
      check(`${name}: absolute ${language} hreflang`,
        new RegExp(`hreflang="${language}" href="https://noxarrosseria\\.com`).test(source));
    }
    check(`${name}: Open Graph locale and four alternates`,
      (source.match(/property="og:locale"/g) || []).length === 1
      && (source.match(/property="og:locale:alternate"/g) || []).length === 4);
    const jsonLd = [...source.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
    check(`${name}: JSON-LD parses`, jsonLd.length > 0 && jsonLd.every((match) => {
      try {
        JSON.parse(match[1]);
        return true;
      } catch {
        return false;
      }
    }));
  }

  if (isLegalPage(name)) {
    check(`${name}: legal page has noindex`, /<meta name="robots" content="noindex/i.test(source));
  }
}

function inspectCss(file, source) {
  const name = relative(file);
  const rootBlocks = [...source.matchAll(/:root\s*\{[^}]*\}/g)]
    .map((match) => [match.index, match.index + match[0].length]);
  for (const match of source.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    check(`${name}: hex color is inside :root`,
      rootBlocks.some(([start, end]) => match.index >= start && match.index < end));
  }

  for (const match of source.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
    const url = match[1].trim();
    if (/^(?:https?:|data:|#)/i.test(url)) continue;
    check(`${name}: internal CSS URL starts with ${prefix}`, url.startsWith(prefix));
    if (url.startsWith(prefix)) check(`${name}: CSS target exists (${url})`, existsForUrl(url));
  }

  const controls = [".btn", ".al-btn", ".al-clear", ".cookie-btn"];
  for (const selector of controls) {
    const rule = source.match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{([^}]*)\\}`));
    check(`${name}: ${selector} has a 44px minimum touch target`,
      Boolean(rule && /min-height:\s*(?:44|48|[5-9]\d|\d{3,})px/i.test(rule[1])));
  }

  for (const rule of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (rule[1].includes(":root") || rule[1].includes(".review .stars")) continue;
    if (/color\s*:\s*var\(--safra\)/i.test(rule[2])) {
      const size = rule[2].match(/font-size\s*:\s*(\d+(?:\.\d+)?)px/i);
      check(`${name}: Safrà is not used for small text (${rule[1].trim()})`,
        !size || Number(size[1]) >= 18.7);
    }
  }
}

const files = listFiles(root).filter((file) => /\.(?:html|css)$/i.test(file));
for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  const name = relative(file);
  if (file.endsWith(".html")) {
    check(`${name}: no placeholder text or emojis`,
      !/(?:\blorem\b|\bTODO\b|\bPENDENT\b|Opinió en línia|\p{Emoji_Presentation})/iu.test(source));
    inspectHtml(file, source);
  } else {
    check(`${name}: no placeholder text or emojis`,
      !/(?:\blorem\b|\bTODO\b|\bPENDENT\b|Opinió en línia|\p{Emoji_Presentation})/iu.test(source));
    inspectCss(file, source);
  }
}

const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
check("sitemap: contains all five homepage URLs",
  (sitemap.match(/<loc>https:\/\/noxarrosseria\.com\/[^<]*<\/loc>/g) || []).length >= 5
  && ["https://noxarrosseria.com/", "https://noxarrosseria.com/es/", "https://noxarrosseria.com/en/", "https://noxarrosseria.com/fr/", "https://noxarrosseria.com/pt/"].every((url) => sitemap.includes(`<loc>${url}</loc>`)));
check("sitemap: each homepage has all language alternates",
  (sitemap.match(/hreflang="x-default"/g) || []).length === 5
  && (sitemap.match(/hreflang="ca"/g) || []).length === 5
  && (sitemap.match(/hreflang="es"/g) || []).length === 5
  && (sitemap.match(/hreflang="en"/g) || []).length === 5
  && (sitemap.match(/hreflang="fr"/g) || []).length === 5
  && (sitemap.match(/hreflang="pt"/g) || []).length === 5);

console.log(`HTML pages: ${files.filter((file) => file.endsWith(".html")).length}`);
console.log(`Checks: ${checks}`);
if (issues.length) {
  console.error(`FAIL (${issues.length}):\n- ${issues.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log("PASS: all static checks passed");
}
