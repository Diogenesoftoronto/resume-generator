// =============================================================================
// TYPES AND CONSTANTS
// =============================================================================

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

// Get directory paths - handle both bun run and compiled binary
const __filename = fileURLToPath(import.meta.url);
const __scriptDir = path.dirname(__filename);
const argv1 = process.argv[1] || "";

// Detect running mode
const isBunBinary =
  argv1.includes("bunfs") ||
  argv1.includes(".bun") ||
  !__filename.includes("resume-generator");

// For bun run: resolve from script location
// For compiled binary: use cwd
let PROJECT_ROOT: string;
if (isBunBinary) {
  PROJECT_ROOT = process.cwd();
  // If cwd doesn't look like project root, try to find it
  if (!fs.existsSync(path.join(PROJECT_ROOT, "package.json"))) {
    // Try common locations
    const possibleRoots = [
      "/home/diogenes/Programs/resume-generator",
      path.dirname(process.cwd()),
    ];
    for (const root of possibleRoots) {
      if (fs.existsSync(path.join(root, "package.json"))) {
        PROJECT_ROOT = root;
        break;
      }
    }
  }
} else {
  PROJECT_ROOT = path.resolve(__scriptDir, "../..");
}

const SRC_DIR = path.join(PROJECT_ROOT, "src");
const NODE_MODULES = path.join(PROJECT_ROOT, "node_modules");
const PACKAGE_JSON_PATH = path.join(PROJECT_ROOT, "package.json");
const RESUME_JSON_PATH = path.join(SRC_DIR, "resume.json");
const CACHE_FILE = path.join(SRC_DIR, ".resume_hash_cache");
const COVER_LETTER_JSON_PATH = path.join(SRC_DIR, "cover-letter.json");

// =============================================================================
// COVER LETTER TYPES
// =============================================================================

export interface CoverLetterData {
  recipient: {
    name: string;
    title: string;
    company: string;
    address?: string;
  };
  sender: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    linkedin?: string;
    website?: string;
  };
  opening: string;
  body: string[];
  closing: string;
  signature: string;
}

export interface CoverLetterValidationResult {
  valid: boolean;
  errors: string[];
}

// =============================================================================
// OUTPUT FORMAT TYPES
// =============================================================================

export type OutputFormat = "html" | "pdf" | "typst" | "all";

export interface FormatOption {
  id: OutputFormat;
  name: string;
  extension: string;
  description: string;
}

export const SUPPORTED_FORMATS: FormatOption[] = [
  {
    id: "html",
    name: "HTML",
    extension: "html",
    description: "Web-based resume",
  },
  { id: "pdf", name: "PDF", extension: "pdf", description: "Print-ready PDF" },
  {
    id: "typst",
    name: "Typst",
    extension: "typ",
    description: "Modern typesetting",
  },
  {
    id: "all",
    name: "All Formats",
    extension: "*",
    description: "Generate all formats",
  },
];

// =============================================================================
// GENERATE OPTIONS
// =============================================================================

export interface GenerateOptions {
  themes?: string[];
  formats?: OutputFormat[];
  outputDir?: string;
  name?: string;
  resumeFile?: string;
  coverLetter?: boolean;
  useCache?: boolean;
  parallel?: number;
  verbose?: boolean;
}

// =============================================================================
// THEME WITH FORMAT SUPPORT
// =============================================================================

export interface ThemeExportInfo {
  name: string;
  description: string;
  formats: OutputFormat[];
}

export const THEMES_WITH_FORMATS: ThemeExportInfo[] = [
  {
    name: "actual",
    description: "Clean, modern design",
    formats: ["html", "pdf"],
  },
  {
    name: "apage",
    description: "Minimalist page layout",
    formats: ["html", "pdf"],
  },
  {
    name: "autumn",
    description: "Autumn colors theme",
    formats: ["html", "pdf"],
  },
  {
    name: "caffeine",
    description: "Coffee-inspired design",
    formats: ["html", "pdf"],
  },
  {
    name: "class",
    description: "Classic professional look",
    formats: ["html", "pdf"],
  },
  {
    name: "classy",
    description: "Elegant and sophisticated",
    formats: ["html", "pdf"],
  },
  {
    name: "cora",
    description: "Cora's creative theme",
    formats: ["html", "pdf"],
  },
  {
    name: "dave",
    description: "Dave's personal design",
    formats: ["html", "pdf"],
  },
  {
    name: "elegant",
    description: "Sophisticated and clean",
    formats: ["html", "pdf"],
  },
  {
    name: "eloquent",
    description: "Well-spaced, readable",
    formats: ["html", "pdf"],
  },
  {
    name: "even",
    description: "Evenly balanced layout",
    formats: ["html", "pdf"],
  },
  {
    name: "flat",
    description: "Flat design aesthetic",
    formats: ["html", "pdf"],
  },
  {
    name: "flat-fr",
    description: "Flat design in French",
    formats: ["html", "pdf"],
  },
  {
    name: "full",
    description: "Full feature resume",
    formats: ["html", "pdf"],
  },
  {
    name: "github",
    description: "GitHub profile style",
    formats: ["html", "pdf"],
  },
  {
    name: "jacrys",
    description: "Creative portfolio theme",
    formats: ["html", "pdf"],
  },
  {
    name: "kards",
    description: "Cards-based layout",
    formats: ["html", "pdf"],
  },
  {
    name: "keloran",
    description: "Keloran's custom theme",
    formats: ["html", "pdf"],
  },
  {
    name: "kendall",
    description: "Kendall's professional theme",
    formats: ["html", "pdf"],
  },
  {
    name: "macchiato",
    description: "Coffee colors palette",
    formats: ["html", "pdf"],
  },
  {
    name: "mantra",
    description: "Mantra's unique style",
    formats: ["html", "pdf"],
  },
  {
    name: "mocha-responsive",
    description: "Responsive mocha theme",
    formats: ["html", "pdf"],
  },
  {
    name: "modern",
    description: "Contemporary design",
    formats: ["html", "pdf"],
  },
  {
    name: "msresume",
    description: "Microsoft-style resume",
    formats: ["html", "pdf"],
  },
  {
    name: "onepage",
    description: "Single page layout",
    formats: ["html", "pdf"],
  },
  {
    name: "onepageresume",
    description: "Compact one-pager",
    formats: ["html", "pdf"],
  },
  {
    name: "orbit",
    description: "Orbital design elements",
    formats: ["html", "pdf"],
  },
  {
    name: "paper",
    description: "Paper document style",
    formats: ["html", "pdf", "typst"],
  },
  {
    name: "paper-plus-plus",
    description: "Enhanced paper theme",
    formats: ["html", "pdf", "typst"],
  },
  {
    name: "papirus",
    description: "Papirus design system",
    formats: ["html", "pdf"],
  },
  {
    name: "pumpkin",
    description: "Orange pumpkin theme",
    formats: ["html", "pdf"],
  },
  {
    name: "rocketspacer",
    description: "Rocket science inspired",
    formats: ["html", "pdf"],
  },
  {
    name: "short",
    description: "Concise format",
    formats: ["html", "pdf", "typst"],
  },
  {
    name: "simple-red",
    description: "Simple with red accents",
    formats: ["html", "pdf"],
  },
  { name: "slick", description: "Slick modern look", formats: ["html", "pdf"] },
  {
    name: "spartan",
    description: "Spartan minimal theme",
    formats: ["html", "pdf", "typst"],
  },
  { name: "srt", description: "SRT custom theme", formats: ["html", "pdf"] },
  {
    name: "stackoverflow",
    description: "Stack Overflow style",
    formats: ["html", "pdf"],
  },
  {
    name: "standard-resume",
    description: "Standard format",
    formats: ["html", "pdf", "typst"],
  },
  {
    name: "tachyons-clean",
    description: "Tachyons CSS clean theme",
    formats: ["html", "pdf"],
  },
  {
    name: "tan-responsive",
    description: "Tan colored responsive",
    formats: ["html", "pdf"],
  },
  {
    name: "techlead",
    description: "Tech lead style",
    formats: ["html", "pdf"],
  },
  {
    name: "verbum",
    description: "Word-focused design",
    formats: ["html", "pdf", "typst"],
  },
  {
    name: "wraypro",
    description: "WrayPro professional",
    formats: ["html", "pdf"],
  },
];

// =============================================================================
// PATH EXPORTS
// =============================================================================

export const paths = {
  projectRoot: PROJECT_ROOT,
  srcDir: SRC_DIR,
  nodeModules: NODE_MODULES,
  packageJson: PACKAGE_JSON_PATH,
  resumeJson: RESUME_JSON_PATH,
  cacheFile: CACHE_FILE,
  coverLetterJson: COVER_LETTER_JSON_PATH,
};

// =============================================================================
// COLORS
// =============================================================================

export const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",
  fgBlack: "\x1b[30m",
  fgRed: "\x1b[31m",
  fgGreen: "\x1b[32m",
  fgYellow: "\x1b[33m",
  fgBlue: "\x1b[34m",
  fgMagenta: "\x1b[35m",
  fgCyan: "\x1b[36m",
  fgWhite: "\x1b[37m",
  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",
};

// =============================================================================
// ICONS
// =============================================================================

export const icons = {
  check: "✓",
  cross: "✗",
  arrow: "→",
  bullet: "●",
  star: "★",
  sparkles: "✨",
  rocket: "🚀",
  trophy: "🏆",
  warning: "⚠️",
  info: "ℹ️",
  folder: "📁",
  file: "📄",
  pdf: "📕",
  html: "📝",
  wrench: "🔧",
  gear: "⚙️",
  lightning: "⚡",
  eye: "👁️",
  trash: "🗑️",
  download: "📥",
  globe: "🌐",
  clock: "⏱️",
  heart: "❤️",
  plus: "➕",
  minus: "➖",
  loading: "⏳",
};

// =============================================================================
// THEME CONFIGURATION
// =============================================================================

export interface Theme {
  name: string;
  description: string;
}

// Legacy theme list (for backward compatibility)
export const LEGACY_THEMES: Theme[] = [
  { name: "actual", description: "Clean, modern design" },
  { name: "apage", description: "Minimalist page layout" },
  { name: "autumn", description: "Autumn colors theme" },
  { name: "caffeine", description: "Coffee-inspired design" },
  { name: "class", description: "Classic professional look" },
  { name: "classy", description: "Elegant and sophisticated" },
  { name: "cora", description: "Cora's creative theme" },
  { name: "dave", description: "Dave's personal design" },
  { name: "elegant", description: "Sophisticated and clean" },
  { name: "eloquent", description: "Well-spaced, readable" },
  { name: "even", description: "Evenly balanced layout" },
  { name: "flat", description: "Flat design aesthetic" },
  { name: "flat-fr", description: "Flat design in French" },
  { name: "full", description: "Full feature resume" },
  { name: "github", description: "GitHub profile style" },
  { name: "jacrys", description: "Creative portfolio theme" },
  { name: "kards", description: "Cards-based layout" },
  { name: "keloran", description: "Keloran's custom theme" },
  { name: "kendall", description: "Kendall's professional theme" },
  { name: "macchiato", description: "Coffee colors palette" },
  { name: "mantra", description: "Mantra's unique style" },
  { name: "mocha-responsive", description: "Responsive mocha theme" },
  { name: "modern", description: "Contemporary design" },
  { name: "msresume", description: "Microsoft-style resume" },
  { name: "onepage", description: "Single page layout" },
  { name: "onepageresume", description: "Compact one-pager" },
  { name: "orbit", description: "Orbital design elements" },
  { name: "paper", description: "Paper document style" },
  { name: "paper-plus-plus", description: "Enhanced paper theme" },
  { name: "papirus", description: "Papirus design system" },
  { name: "pumpkin", description: "Orange pumpkin theme" },
  { name: "rocketspacer", description: "Rocket science inspired" },
  { name: "short", description: "Concise format" },
  { name: "simple-red", description: "Simple with red accents" },
  { name: "slick", description: "Slick modern look" },
  { name: "spartan", description: "Spartan minimal theme" },
  { name: "srt", description: "SRT custom theme" },
  { name: "stackoverflow", description: "Stack Overflow style" },
  { name: "standard-resume", description: "Standard format" },
  { name: "tachyons-clean", description: "Tachyons CSS clean theme" },
  { name: "tan-responsive", description: "Tan colored responsive" },
  { name: "techlead", description: "Tech lead style" },
  { name: "verbum", description: "Word-focused design" },
  { name: "wraypro", description: "WrayPro professional" },
];

// Use THEMES_WITH_FORMATS for new code
export const CURATED_THEMES = LEGACY_THEMES;

// Themes to skip (known issues)
export const SKIP_THEMES = ["kwan", "kwan-linkedin", "latex", "elite"];

// =============================================================================
// CONFIG
// =============================================================================

export interface Config {
  name: string;
  resumeFile: string;
  coverLetterFile: string;
  outputDir: string;
  exportHtml: boolean;
  exportPdf: boolean;
  exportTypst: boolean;
  includeCoverLetter: boolean;
  useCache: boolean;
  parallel: number;
  verbose: boolean;
}

export function getConfig(): Config {
  // Load .env if exists
  const env: Record<string, string> = {};
  const envPath = path.join(PROJECT_ROOT, ".env");

  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const [key, ...valueParts] = trimmed.split("=");
        const value = valueParts
          .join("=")
          .trim()
          .replace(/^["']|["']$/g, "");
        env[key.trim()] = value;
      }
    }
  }

  return {
    name: env["NAME"] || process.env["NAME"] || "keith",
    resumeFile:
      env["RESUME_FILE"] || process.env["RESUME_FILE"] || RESUME_JSON_PATH,
    coverLetterFile:
      env["COVER_LETTER_FILE"] ||
      process.env["COVER_LETTER_FILE"] ||
      COVER_LETTER_JSON_PATH,
    outputDir: env["OUTPUT_DIR"] || process.env["OUTPUT_DIR"] || "resumes",
    exportHtml: (env["EXPORT_HTML"] || "true") === "true",
    exportPdf: (env["EXPORT_PDF"] || "true") === "true",
    exportTypst: (env["EXPORT_TYPST"] || "false") === "true",
    includeCoverLetter: (env["INCLUDE_COVER_LETTER"] || "false") === "true",
    useCache: (env["USE_CACHE"] || "true") === "true",
    parallel: parseInt(env["PARALLEL"] || process.env["PARALLEL"] || "4", 10),
    verbose: (env["VERBOSE"] || "false") === "true",
  };
}

// =============================================================================
// VALIDATION
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateResume(): ValidationResult {
  const errors: string[] = [];

  if (!fs.existsSync(RESUME_JSON_PATH)) {
    errors.push("resume.json not found");
    return { valid: false, errors };
  }

  try {
    const content = fs.readFileSync(RESUME_JSON_PATH, "utf-8");
    const data = JSON.parse(content);

    if (!data.basics) {
      errors.push("Missing 'basics' section");
    } else {
      if (!data.basics.name) {
        errors.push("Missing 'basics.name'");
      }
      if (!data.basics.email) {
        errors.push("Missing 'basics.email'");
      }
    }
  } catch (e) {
    errors.push(`Invalid JSON: ${(e as Error).message}`);
  }

  return { valid: errors.length === 0, errors };
}

export function validateCoverLetter(): CoverLetterValidationResult {
  const errors: string[] = [];

  if (!fs.existsSync(COVER_LETTER_JSON_PATH)) {
    return { valid: true, errors: [] }; // Optional file
  }

  try {
    const content = fs.readFileSync(COVER_LETTER_JSON_PATH, "utf-8");
    const data: CoverLetterData = JSON.parse(content);

    if (!data.recipient) {
      errors.push("Missing 'recipient' section");
    } else {
      if (!data.recipient.name) {
        errors.push("Missing 'recipient.name'");
      }
      if (!data.recipient.company) {
        errors.push("Missing 'recipient.company'");
      }
    }

    if (!data.sender) {
      errors.push("Missing 'sender' section");
    } else {
      if (!data.sender.name) {
        errors.push("Missing 'sender.name'");
      }
      if (!data.sender.email) {
        errors.push("Missing 'sender.email'");
      }
    }

    if (!data.opening || data.opening.trim() === "") {
      errors.push("Missing 'opening' paragraph");
    }
  } catch (e) {
    errors.push(`Invalid JSON: ${(e as Error).message}`);
  }

  return { valid: errors.length === 0, errors };
}

// =============================================================================
// CACHING
// =============================================================================

export function getResumeHash(): string {
  if (!fs.existsSync(RESUME_JSON_PATH)) {
    return "";
  }
  const content = fs.readFileSync(RESUME_JSON_PATH, "utf-8");
  const crypto = require("node:crypto");
  return crypto.createHash("sha256").update(content).digest("hex");
}

export function getCachedHash(): string {
  if (!fs.existsSync(CACHE_FILE)) {
    return "";
  }
  return fs.readFileSync(CACHE_FILE, "utf-8").trim();
}

export function saveCache(hash: string): void {
  fs.writeFileSync(CACHE_FILE, hash);
}

// =============================================================================
// THEME MANAGEMENT
// =============================================================================

export function isThemeInstalled(themeName: string): boolean {
  const themePath = path.join(NODE_MODULES, `jsonresume-theme-${themeName}`);
  return fs.existsSync(themePath);
}

export function getInstalledThemes(): Set<string> {
  const themes = new Set<string>();

  if (!fs.existsSync(NODE_MODULES)) {
    return themes;
  }

  try {
    for (const item of fs.readdirSync(NODE_MODULES)) {
      if (item.startsWith("jsonresume-theme-")) {
        themes.add(item.replace("jsonresume-theme-", ""));
      }
    }
  } catch {
    // Directory might not be accessible
  }

  return themes;
}

export function getPackageJsonThemes(): Set<string> {
  const themes = new Set<string>();

  if (!fs.existsSync(PACKAGE_JSON_PATH)) {
    return themes;
  }

  try {
    const content = fs.readFileSync(PACKAGE_JSON_PATH, "utf-8");
    const pkg = JSON.parse(content);

    for (const dep of [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.devDependencies || {}),
    ]) {
      if (dep.startsWith("jsonresume-theme-")) {
        themes.add(dep.replace("jsonresume-theme-", ""));
      }
    }
  } catch {
    // Ignore parse errors
  }

  return themes;
}

// =============================================================================
// FILE OPERATIONS
// =============================================================================

export function moveFiles(
  theme: string,
  name: string,
  outputDir: string,
): { html: boolean; pdf: boolean } {
  const results = { html: false, pdf: false };
  const themesDir = path.join(PROJECT_ROOT, outputDir, "themes");
  const pdfsDir = path.join(PROJECT_ROOT, outputDir, "pdfs");

  // Move HTML
  const htmlSrc = path.join(PROJECT_ROOT, `${name}-${theme}.html`);
  const htmlDst = path.join(themesDir, `${name}-${theme}.html`);
  if (fs.existsSync(htmlSrc)) {
    fs.renameSync(htmlSrc, htmlDst);
    results.html = true;
  }

  // Move PDF
  const pdfSrc = path.join(PROJECT_ROOT, `${name}-pdf-${theme}.pdf`);
  const pdfDst = path.join(pdfsDir, `${name}-pdf-${theme}.pdf`);
  if (fs.existsSync(pdfSrc)) {
    fs.renameSync(pdfSrc, pdfDst);
    results.pdf = true;
  }

  return results;
}

// =============================================================================
// EXPORT TYPES
// =============================================================================

export type ExportFormat = "html" | "pdf" | "both";

export interface ExportMessage {
  theme: string;
  name: string;
  resumeFile: string;
  outputDir: string;
  format: ExportFormat;
}

export interface ExportResult {
  theme: string;
  format: string;
  success: boolean;
  error?: string;
}

export interface GenerateResult {
  theme: string;
  success: boolean;
  html?: boolean;
  pdf?: boolean;
  error?: string;
}

// =============================================================================
// LOGGER
// =============================================================================

export function log(
  message: string,
  color: keyof typeof colors = "fgWhite",
): void {
  console.log(
    `${colors[color as keyof typeof colors]}${message}${colors.reset}`,
  );
}

export function logSuccess(message: string): void {
  log(`${icons.check} ${message}`, "fgGreen");
}

export function logError(message: string): void {
  log(`${icons.cross} ${message}`, "fgRed");
}

export function logWarning(message: string): void {
  log(`${icons.warning} ${message}`, "fgYellow");
}

export function logInfo(message: string): void {
  log(`${icons.info} ${message}`, "fgCyan");
}

export function logHeader(message: string): void {
  console.log(
    `\n${colors.fgMagenta}${colors.bright}${message}${colors.reset}\n`,
  );
}

export function logSection(message: string): void {
  console.log(`\n${colors.fgYellow}${colors.bright}${message}${colors.reset}`);
}
