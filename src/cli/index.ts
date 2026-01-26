#!/usr/bin/env bun

/**
 * Resume Generator - Main CLI Entry Point
 *
 * A comprehensive tool for generating resumes from JSON Resume schema
 * with support for 40+ themes, parallel processing, and interactive controls.
 *
 * Usage: ./bin/resume-gen [command]
 *
 * Commands:
 *   generate   Generate all themes (default - auto-installs missing)
 *   list       List available themes from npm
 *   validate   Validate resume.json
 *   switch     Switch active theme preview
 *   install    Install missing curated themes
 *   prerun     Add curated themes to package.json
 *   clean      Clean generated files
 *   help       Show help message
 */

import {
  intro,
  outro,
  select,
  confirm,
  cancel,
  isCancel,
  spinner,
} from "@clack/prompts";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import {
  workerData,
  parentPort,
  isMainThread,
  Worker,
} from "node:worker_threads";

// Import from sibling modules
import * as types from "./types";
import { fetchRegistryThemes, addThemeToPackageJson } from "./registry";
import {
  exportThemeWithWorker,
  ensureOutputDirs,
  generateThemes,
  printResults,
} from "./export";

// =============================================================================
// PATH SETUP
// =============================================================================

const __filename = fileURLToPath(import.meta.url);
const __scriptDir = path.dirname(__filename);
const argv1 = process.argv[1] || "";
const isBunBinary = argv1.includes("bunfs") || argv1.includes(".bun");

let PROJECT_ROOT: string;

if (isBunBinary) {
  PROJECT_ROOT = process.cwd();
} else {
  PROJECT_ROOT = path.resolve(__scriptDir, "../..");
}

// =============================================================================
// COMMAND: LIST THEMES
// =============================================================================

async function cmdList(): Promise<void> {
  console.log();
  types.log("Fetching themes from npm registry...", "fgCyan");

  const npmThemes = await fetchRegistryThemes();

  if (npmThemes.length > 0) {
    const sortedThemes = [...npmThemes].sort(
      (a, b) => b.downloads - a.downloads,
    );
    const topThemes = sortedThemes.slice(0, 25);

    console.log();
    types.log(
      `${types.icons.globe} ${npmThemes.length} jsonresume-theme packages on npm`,
      "fgCyan",
    );
    types.log(
      `${types.icons.star} Top ${topThemes.length} themes by downloads:\n`,
      "fgGreen",
    );

    for (const theme of topThemes) {
      const downloads = theme.downloads.toLocaleString();
      console.log(
        `  ${types.icons.bullet} ${types.colors.fgWhite}${theme.name.padEnd(25)}${types.colors.reset} ${types.colors.dim}${downloads} weekly downloads${types.colors.reset}`,
      );
    }

    if (npmThemes.length > 25) {
      console.log(
        `\n${types.icons.info} And ${npmThemes.length - 25} more themes...`,
      );
    }
  } else {
    // Fallback to curated themes
    console.log();
    types.log(
      `${types.icons.bullet} Available curated themes (${types.CURATED_THEMES.length}):`,
      "fgGreen",
    );
    console.log();

    for (const theme of types.CURATED_THEMES) {
      const installed = types.isThemeInstalled(theme.name);
      console.log(
        `  ${installed ? types.colors.fgGreen + types.icons.check : types.colors.fgYellow + types.icons.warning}${types.colors.reset} ${types.colors.fgWhite}${theme.name.padEnd(20)}${types.colors.reset} ${types.colors.dim}${theme.description}${types.colors.reset}`,
      );
    }
  }

  console.log();
}

// =============================================================================
// COMMAND: VALIDATE
// =============================================================================

async function cmdValidate(): Promise<void> {
  const { valid, errors } = types.validateResume();

  console.log();
  if (valid) {
    types.logSuccess("resume.json is valid!");
    console.log(`\n${types.icons.file} File: ${types.paths.resumeJson}`);
  } else {
    types.logError("resume.json has issues:");
    for (const error of errors) {
      console.log(`  ${types.icons.cross} ${error}`);
    }
  }
  console.log();
}

// =============================================================================
// COMMAND: SWITCH THEME
// =============================================================================

async function cmdSwitch(): Promise<void> {
  const config = types.getConfig();
  const themesDir = path.join(PROJECT_ROOT, config.outputDir, "themes");

  if (!fs.existsSync(themesDir)) {
    types.logError(`No generated themes found. Run 'generate' first.`);
    return;
  }

  const files = fs.readdirSync(themesDir).filter((f) => f.endsWith(".html"));
  const availableThemes = [
    ...new Set(files.map((f) => f.replace(/^keith-|\.html$/g, ""))),
  ];

  if (availableThemes.length === 0) {
    types.logError("No themes available. Generate themes first.");
    return;
  }

  const selected = await select({
    message: "Choose a theme to activate:",
    options: availableThemes.map((theme) => ({
      value: theme,
      label: theme,
    })),
  });

  if (isCancel(selected) || !selected) {
    cancel("Cancelled");
    return;
  }

  const srcPath = path.join(themesDir, `keith-${selected}.html`);
  const dstPath = path.join(types.paths.srcDir, "index.html");

  // Backup old index
  if (fs.existsSync(dstPath)) {
    const backupDir = path.join(types.paths.srcDir, "old_builds");
    fs.mkdirSync(backupDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    fs.renameSync(dstPath, path.join(backupDir, `index-${timestamp}.html`));
  }

  fs.copyFileSync(srcPath, dstPath);
  types.logSuccess(`Switched to ${selected}`);
  console.log(`\n${types.icons.eye} Preview: ${dstPath}`);
}

// =============================================================================
// COMMAND: CLEAN
// =============================================================================

async function cmdClean(): Promise<void> {
  const config = types.getConfig();
  const themesDir = path.join(PROJECT_ROOT, config.outputDir, "themes");
  const pdfsDir = path.join(PROJECT_ROOT, config.outputDir, "pdfs");

  let count = 0;

  if (fs.existsSync(themesDir)) {
    const files = fs
      .readdirSync(themesDir)
      .filter((f) => f.startsWith("keith-"));
    for (const file of files) {
      fs.unlinkSync(path.join(themesDir, file));
      count++;
    }
  }

  if (fs.existsSync(pdfsDir)) {
    const files = fs.readdirSync(pdfsDir).filter((f) => f.startsWith("keith-"));
    for (const file of files) {
      fs.unlinkSync(path.join(pdfsDir, file));
      count++;
    }
  }

  // Clean cache
  if (fs.existsSync(types.paths.cacheFile)) {
    fs.unlinkSync(types.paths.cacheFile);
    count++;
  }

  console.log();
  if (count > 0) {
    types.logSuccess(`Cleaned ${count} files`);
  } else {
    types.logInfo("No files to clean");
  }
}

// =============================================================================
// COMMAND: INSTALL MISSING THEMES
// =============================================================================

async function cmdInstall(): Promise<void> {
  const installed = types.getInstalledThemes();
  const packageThemes = types.getPackageJsonThemes();

  // All curated themes that should be installed
  const allCurated = new Set(types.CURATED_THEMES.map((t) => t.name));

  // Find missing themes
  const missing = [...allCurated].filter(
    (t) =>
      !installed.has(t) &&
      !packageThemes.has(t) &&
      !types.SKIP_THEMES.includes(t),
  );

  if (missing.length === 0) {
    console.log();
    types.logSuccess("All curated themes are installed!");
    console.log(`\n${types.icons.bullet} Installed: ${installed.size}`);
    console.log(`${types.icons.bullet} In package.json: ${packageThemes.size}`);
    return;
  }

  console.log();
  types.logInfo(`Found ${missing.length} themes not installed`);

  const confirmed = await confirm({
    message: `Install ${missing.length} missing themes?`,
    active: "Yes, install all",
    inactive: "No, cancel",
  });

  if (isCancel(confirmed) || !confirmed) {
    cancel("Cancelled");
    return;
  }

  let installedCount = 0;
  const spin = spinner();
  spin.start("Installing themes...");

  for (const theme of missing) {
    const packageName = `jsonresume-theme-${theme}`;
    spin.message(`Installing ${packageName}...`);

    try {
      const proc = Bun.spawn({
        cmd: ["bun", "add", packageName],
        cwd: PROJECT_ROOT,
      });
      await proc.exited;

      if (proc.exitCode === 0) {
        installedCount++;
      }
    } catch {
      // Skip failed installations
    }
  }

  spin.stop(`Installed ${installedCount}/${missing.length} themes`);
}

// =============================================================================
// COMMAND: PRERUN - Add themes to package.json
// =============================================================================

async function cmdPrerun(): Promise<void> {
  console.log();
  types.log(
    `${types.icons.wrench} Adding curated themes to package.json`,
    "fgCyan",
  );

  if (!fs.existsSync(types.paths.packageJson)) {
    types.logError("package.json not found");
    return;
  }

  const content = fs.readFileSync(types.paths.packageJson, "utf-8");
  const pkg = JSON.parse(content);

  const existing = new Set<string>();
  for (const dep of Object.keys(pkg.dependencies || {})) {
    if (dep.startsWith("jsonresume-theme-")) {
      existing.add(dep.replace("jsonresume-theme-", ""));
    }
  }

  const themesToAdd = types.CURATED_THEMES.filter(
    (t) => !types.SKIP_THEMES.includes(t.name) && !existing.has(t.name),
  );

  console.log(`\n${types.icons.info} Existing: ${existing.size}`);
  console.log(`${types.icons.info} Adding: ${themesToAdd.length}`);

  if (themesToAdd.length === 0) {
    console.log();
    types.logSuccess("All curated themes are already in package.json");
    return;
  }

  console.log();
  let added = 0;

  for (const theme of themesToAdd) {
    const packageName = `jsonresume-theme-${theme.name}`;
    process.stdout.write(`  ${theme.name.padEnd(25)} `);

    try {
      const response = await fetch(
        `https://registry.npmjs.org/${packageName}/latest`,
      );
      const version = response.ok ? (await response.json()).version : "^0.0.1";

      pkg.dependencies = pkg.dependencies || {};
      pkg.dependencies[packageName] = version.startsWith("^")
        ? version
        : `^${version}`;

      console.log(`${types.icons.check}`);
      added++;
    } catch {
      console.log(`${types.icons.cross}`);
    }
  }

  const output = JSON.stringify(pkg, null, 2) + "\n";
  fs.writeFileSync(types.paths.packageJson, output, "utf-8");

  console.log(`\n${types.icons.check} Added ${added} themes to package.json`);
  console.log(`${types.icons.info} Run 'bun install' to install new themes`);
}

// =============================================================================
// COMMAND: GENERATE - Main generation with auto-install
// =============================================================================

async function cmdGenerate(force: boolean = false): Promise<void> {
  // Validate resume first
  const { valid, errors } = types.validateResume();

  console.log();
  if (!valid) {
    types.logError("resume.json is invalid:");
    for (const error of errors) {
      console.log(`  ${types.icons.cross} ${error}`);
    }
    return;
  }

  // Auto-install missing themes
  const installed = types.getInstalledThemes();
  const config = types.getConfig();
  const missingThemes = types.CURATED_THEMES.filter(
    (t) => !types.SKIP_THEMES.includes(t.name) && !installed.has(t.name),
  );

  if (missingThemes.length > 0) {
    types.logInfo(`Auto-installing ${missingThemes.length} missing themes...`);

    const spin = spinner();
    spin.start("Installing themes...");

    for (const theme of missingThemes) {
      const packageName = `jsonresume-theme-${theme.name}`;
      try {
        const proc = Bun.spawn({
          cmd: ["bun", "add", packageName],
          cwd: PROJECT_ROOT,
        });
        await proc.exited;
      } catch {
        // Skip failed installs
      }
    }

    spin.stop(`Installed ${missingThemes.length} themes`);
  }

  // Check cache if not forcing
  if (!force && config.useCache) {
    const currentHash = types.getResumeHash();
    const cachedHash = types.getCachedHash();

    if (currentHash === cachedHash) {
      types.logInfo("No changes detected in resume.json");
      console.log(
        `\n${types.icons.arrow} Use ${types.colors.fgYellow}--force${types.colors.reset} to regenerate`,
      );
      console.log(
        `${types.icons.arrow} Or delete ${types.colors.fgYellow}${types.paths.cacheFile}${types.colors.reset}`,
      );
      return;
    }
  }

  // Generate themes with worker threads
  const results = await generateThemes(force);

  // Print results
  if (results.length > 0) {
    printResults(results, config);
  }
}

// =============================================================================
// HELP
// =============================================================================

function showHelp(): void {
  const { fgMagenta, bright, fgCyan, fgWhite, reset, dim } = types.colors;
  const {
    arrow,
    check,
    cross,
    bullet,
    star,
    info,
    folder,
    pdf,
    lightning,
    eye,
  } = types.icons;

  console.log(`
${fgMagenta}${bright}
╔════════════════════════════════════════════════════════════╗
║           Resume Generator - Interactive CLI               ║
╚════════════════════════════════════════════════════════════╝
${reset}

${fgCyan}${bright}USAGE:${reset}
  ${fgWhite}./bin/resume-gen${reset} [command] [options]

${fgCyan}${bright}COMMANDS:${reset}
  ${fgWhite}generate${reset}   Generate all themes (default, auto-installs missing)
  ${fgWhite}list${reset}       List themes from npm registry
  ${fgWhite}validate${reset}   Validate resume.json file
  ${fgWhite}switch${reset}     Interactive theme switcher for preview
  ${fgWhite}install${reset}    Install missing curated themes
  ${fgWhite}prerun${reset}     Add curated themes to package.json
  ${fgWhite}clean${reset}      Clean generated files
  ${fgWhite}help${reset}       Show this help message

${fgCyan}${bright}OPTIONS:${reset}
  ${fgWhite}--force${reset}    Force regeneration (ignore cache)
  ${fgWhite}--verbose${reset}  Show detailed output

${fgCyan}${bright}CONFIGURATION (.env):${reset}
  NAME           Output file prefix (default: keith)
  OUTPUT_DIR     Output directory (default: resumes)
  PARALLEL       Parallel theme processing (default: 4)
  EXPORT_HTML    Export HTML files (true/false)
  EXPORT_PDF     Export PDF files (true/false)
  USE_CACHE      Use hash caching (true/false)

${fgCyan}${bright}EXAMPLES:${reset}
  ${fgWhite}./bin/resume-gen generate${reset}
  ${fgWhite}./bin/resume-gen generate --force${reset}
  ${fgWhite}./bin/resume-gen list${reset}
  ${fgWhite}./bin/resume-gen validate${reset}
  ${fgWhite}./bin/resume-gen switch${reset}
  ${fgWhite}./bin/resume-gen clean --force${reset}

${fgCyan}${bright}FEATURES:${reset}
  ${bullet} 40+ curated JSON Resume themes
  ${bullet} Parallel worker thread processing
  ${bullet} npm registry theme discovery
  ${bullet} Auto-installs missing themes on generate
  ${bullet} Smart caching (regenerate only on changes)
  ${bullet} Bun-native performance
`);
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const force = args.includes("--force") || args.includes("-f");
  const verbose = args.includes("--verbose") || args.includes("-v");
  const help =
    args.includes("--help") || args.includes("-h") || args[0] === "help";

  // Remove processed args
  const cleanArgs = args.filter(
    (a) =>
      !a.startsWith("--force") &&
      !a.startsWith("-f") &&
      !a.startsWith("--verbose") &&
      !a.startsWith("-v") &&
      !a.startsWith("--help") &&
      !a.startsWith("-h"),
  );

  const command = cleanArgs[0]?.toLowerCase() || "generate";

  // Show help
  if (help || command === "help") {
    showHelp();
    return;
  }

  // Check for resume.json
  if (!fs.existsSync(types.paths.resumeJson)) {
    types.logError("resume.json not found in src/");
    console.log(
      `\n${types.icons.arrow} Create src/resume.json with your resume data`,
    );
    console.log(
      `${types.icons.arrow} See ${types.colors.fgYellow}https://jsonresume.org${types.colors.reset} for schema`,
    );
    return;
  }

  // Banner
  intro(
    `${types.colors.fgMagenta}${types.colors.bright}Resume Generator${types.colors.reset} ${types.colors.dim}v1.0.0${types.colors.reset}`,
  );

  // Execute command
  switch (command) {
    case "list":
      await cmdList();
      break;
    case "validate":
      await cmdValidate();
      break;
    case "switch":
      await cmdSwitch();
      break;
    case "install":
      await cmdInstall();
      break;
    case "prerun":
      await cmdPrerun();
      break;
    case "clean":
      await cmdClean();
      break;
    case "generate":
      await cmdGenerate(force);
      break;
    default:
      console.log();
      types.logError(`Unknown command: ${command}`);
      console.log(
        `\n${types.icons.arrow} Run ${types.colors.fgWhite}./bin/resume-gen help${types.colors.reset} for usage\n`,
      );
  }

  outro(`${types.colors.dim}Done!${types.colors.reset}`);
}

// Run main
main().catch(console.error);
