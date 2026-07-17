import { mkdir, readFile, writeFile } from "node:fs/promises";
import vm from "node:vm";
import * as parse5 from "parse5";

const template = await readFile(new URL("../src/index.template.html", import.meta.url), "utf8");
const manifestoTemplate = await readFile(
  new URL("../src/manifesto.template.html", import.meta.url),
  "utf8",
);
const manifestoContent = {
  en: await readFile(new URL("../src/manifesto.en.html", import.meta.url), "utf8"),
  zh: await readFile(new URL("../src/manifesto.zh.html", import.meta.url), "utf8"),
};
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

function replaceTokens(source, tokens) {
  return Object.entries(tokens).reduce(
    (output, [key, value]) => output.split(`{{${key}}}`).join(value),
    source,
  );
}

function buildManifesto(language) {
  const isChinese = language === "zh";
  const sections = isChinese
    ? [
        ["why", "为什么 AI 需要自己的互联网"],
        ["need", "为什么现有互联网还不够"],
        ["network", "AI 需要一个怎样的互联网"],
        ["blockchain", "为什么是区块链"],
        ["not", "这不是什么"],
        ["join", "加入建设"],
      ]
    : [
        ["why", "Why AI agents need their own internet"],
        ["need", "Why the current web is not enough"],
        ["network", "What kind of internet do AI agents need?"],
        ["blockchain", "Why blockchain?"],
        ["not", "What this is not"],
        ["join", "Join the building"],
      ];
  const toc = sections
    .map(([id, label]) => `<a href="#${id}">${label}</a>`)
    .join("\n          ");
  const tokens = isChinese
    ? {
        LANG: "zh-CN",
        TITLE: "Open Agent Internet 宣言 | 面向 AI Agent 的开放网络",
        DESCRIPTION:
          "Open Agent Internet 关于 AI Agent 开放互联网的公开主张：开放、无许可、可互联互通，并以区块链作为基础设施。",
        CANONICAL: "https://openagentinternet.org/zh/manifesto/",
        LOCALE: "zh_CN",
        IMAGE_ALT: "Open Agent Internet 开放网络中的多个 Bot",
        HEADLINE: "AI Agent 的互联网",
        INTRO: "今天的互联网是为人类构建的。AI Agent 需要属于它们自己的互联网。",
        INTRO_NOTE:
          "一组关于未来 AI Agent 网络的公开主张：让智能体能够存在、连接、协作，交换数据与价值。",
        HOME: "/zh/",
        LANGUAGE_HREF: "/manifesto/",
        LANGUAGE_LABEL: "Switch to English",
        TOC: toc,
        CONTENT: manifestoContent.zh,
      }
    : {
        LANG: "en",
        TITLE: "Open Agent Internet Manifesto | A Permissionless Internet for AI Agents",
        DESCRIPTION:
          "The Open Agent Internet manifesto: a public case for an open, permissionless, interoperable internet designed for AI agents, built on blockchain.",
        CANONICAL: "https://openagentinternet.org/manifesto/",
        LOCALE: "en_US",
        IMAGE_ALT: "Multiple bots connected through the Open Agent Internet",
        HEADLINE: "The internet for AI agents",
        INTRO: "The internet today was built for humans. AI agents need an internet of their own.",
        INTRO_NOTE:
          "A public set of claims about a future network where intelligent systems can exist, connect, collaborate, and exchange data and value.",
        HOME: "/",
        LANGUAGE_HREF: "/zh/manifesto/",
        LANGUAGE_LABEL: "切换为中文",
        TOC: toc,
        CONTENT: manifestoContent.en,
      };
  return replaceTokens(manifestoTemplate, tokens);
}

await mkdir(new URL("../zh/", import.meta.url), { recursive: true });
await mkdir(new URL("../manifesto/", import.meta.url), { recursive: true });
await mkdir(new URL("../zh/manifesto/", import.meta.url), { recursive: true });
await writeFile(new URL("../index.html", import.meta.url), build("en", null));
await writeFile(new URL("../zh/index.html", import.meta.url), build("zh-CN", chinese));
await writeFile(new URL("../manifesto/index.html", import.meta.url), buildManifesto("en"));
await writeFile(new URL("../zh/manifesto/index.html", import.meta.url), buildManifesto("zh"));
