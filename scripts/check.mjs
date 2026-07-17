import { readFile } from "node:fs/promises";
import * as parse5 from "parse5";

const pages = [
  { path: "index.html", lang: "en", canonical: "https://openagentinternet.org/" },
  { path: "zh/index.html", lang: "zh-CN", canonical: "https://openagentinternet.org/zh/" },
  {
    path: "manifesto/index.html",
    lang: "en",
    canonical: "https://openagentinternet.org/manifesto/",
  },
  {
    path: "zh/manifesto/index.html",
    lang: "zh-CN",
    canonical: "https://openagentinternet.org/zh/manifesto/",
  },
];

function walk(node, visit) {
  visit(node);
  for (const child of node.childNodes || []) walk(child, visit);
}

for (const page of pages) {
  const source = await readFile(new URL(`../${page.path}`, import.meta.url), "utf8");
  const document = parse5.parse(source);
  const matches = [];
  walk(document, (node) => {
    if (node.attrs) matches.push(node);
  });
  const html = matches.find((node) => node.tagName === "html");
  const canonical = matches.find(
    (node) => node.tagName === "link" && node.attrs.some((attr) => attr.name === "rel" && attr.value === "canonical"),
  );
  const canonicalHref = canonical?.attrs.find((attr) => attr.name === "href")?.value;
  const lang = html?.attrs.find((attr) => attr.name === "lang")?.value;
  if (lang !== page.lang) throw new Error(`${page.path}: expected lang=${page.lang}, got ${lang}`);
  if (canonicalHref !== page.canonical) {
    throw new Error(`${page.path}: expected canonical=${page.canonical}, got ${canonicalHref}`);
  }
  for (const marker of ["og:title", "og:description", "og:url", "twitter:card"]) {
    if (!source.includes(marker)) throw new Error(`${page.path}: missing ${marker}`);
  }
}

console.log("SEO checks passed for English and Chinese pages.");
