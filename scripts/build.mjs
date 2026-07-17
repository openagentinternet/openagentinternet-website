import { mkdir, readFile, writeFile } from "node:fs/promises";
import vm from "node:vm";
import * as parse5 from "parse5";

const template = await readFile(new URL("../src/index.template.html", import.meta.url), "utf8");
const translationSource = template.match(
  /const chineseTranslations = (\{[\s\S]*?\n      \});/,
);
if (!translationSource) throw new Error("Could not find chineseTranslations in the template.");
const chinese = vm.runInNewContext(`(${translationSource[1]})`);

function attribute(node, name) {
  return node.attrs?.find((item) => item.name === name);
}

function translate(node, translations) {
  const textKey = attribute(node, "data-i18n")?.value;
  if (textKey && translations) {
    if (!(textKey in translations)) {
      throw new Error(`Missing translation: ${textKey}`);
    }
    node.childNodes = [{ nodeName: "#text", value: translations[textKey], parentNode: node }];
  }

  const attributeSpec = attribute(node, "data-i18n-attr")?.value;
  if (attributeSpec && translations) {
    for (const entry of attributeSpec.split(";")) {
      const separator = entry.indexOf(":");
      const name = entry.slice(0, separator);
      const key = entry.slice(separator + 1);
      if (!(key in translations)) {
        throw new Error(`Missing translation: ${key}`);
      }
      const target = attribute(node, name);
      if (target) target.value = translations[key];
      else node.attrs.push({ name, value: translations[key] });
    }
  }

  for (const child of node.childNodes || []) translate(child, translations);
}

function build(language, translations) {
  const document = parse5.parse(template);
  const html = document.childNodes.find((node) => node.tagName === "html");
  attribute(html, "lang").value = language;
  translate(document, translations);
  return `${parse5.serialize(document).replace(/[ \t]+$/gm, "").trim()}\n`;
}

await mkdir(new URL("../zh/", import.meta.url), { recursive: true });
await writeFile(new URL("../index.html", import.meta.url), build("en", null));
await writeFile(new URL("../zh/index.html", import.meta.url), build("zh-CN", chinese));
