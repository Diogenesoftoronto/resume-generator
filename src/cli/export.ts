// =============================================================================
// EXPORT MODULE - Worker thread based parallel exports
// =============================================================================

import type { ExportMessage, ExportResult, GenerateResult } from "./types";
import {
  paths,
  colors,
  icons,
  isThemeInstalled,
  moveFiles,
  getConfig,
  CURATED_THEMES,
  SKIP_THEMES,
  validateResume,
  getResumeHash,
  getCachedHash,
  saveCache,
  logError,
  logSuccess,
  log,
  logSection,
} from "./types";
import {
  workerData,
  parentPort,
  isMainThread,
  Worker,
} from "node:worker_threads";
import * as path from "node:path";
import * as fs from "node:fs";

// =============================================================================
// WORKER THREAD - Handle individual theme export
// =============================================================================

if (!isMainThread && workerData) {
  const { theme, name, resumeFile, outputDir, format } =
    workerData as ExportMessage;
  const results: ExportResult[] = [];

  async function exportToFormat(formatType: "html" | "pdf"): Promise<void> {
    const ext = formatType;
    const outputPath = path.join(
      paths.projectRoot,
      `${name}-${ext}-${theme}.${ext}`,
    );

    // Clean up existing file
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    const binPath = path.join(paths.nodeModules, ".bin", "resume");

    try {
      const proc = Bun.spawn({
        cmd: [
          binPath,
          "export",
          `${name}-${ext}-${theme}.${ext}`,
          "-r",
          resumeFile,
          "-f",
          ext,
          "-t",
          theme,
        ],
        cwd: paths.projectRoot,
      });

      await proc.exited;

      if (proc.success && fs.existsSync(outputPath)) {
        results.push({
          theme,
          format: formatType,
          success: true,
          outputPath,
        });
      } else {
        const stderr = await new Response(proc.stderr).text();
        results.push({
          theme,
          format: formatType,
          success: false,
          error: stderr.split("\n")[0] || "export failed",
        });
      }
    } catch (e) {
      results.push({
        theme,
        format: formatType,
        success: false,
        error: (e as Error).message,
      });
    }
  }

  // Run exports
  (async () => {
    parentPort?.postMessage({ type: "ready" });

    if (format === "both" || format === "pdf") {
      await exportToFormat("pdf");
    }
    if (format === "both" || format === "html") {
      await exportToFormat("html");
    }

    parentPort?.postMessage({ type: "result", theme, results });
  })();
}

// =============================================================================
// TYPST EXPORT
// =============================================================================

/**
 * Generate Typst PDF from resume data using typst CLI or typst.ts
 */
export async function exportTypstResume(
  name: string,
  resumeFile: string,
  outputDir: string,
): Promise<boolean> {
  const templatePath = path.join(paths.projectRoot, "src/templates/resume.typ");
  const outputPath = path.join(
    paths.projectRoot,
    outputDir,
    `${name}-typst.pdf`,
  );

  // Check if template exists
  if (!fs.existsSync(templatePath)) {
    console.log(
      `${colors.fgYellow}${icons.warning}${colors.reset} Typst template not found at ${templatePath}`,
    );
    return false;
  }

  // Read resume data
  if (!fs.existsSync(resumeFile)) {
    logError(`Resume file not found: ${resumeFile}`);
    return false;
  }

  const resumeData = fs.readFileSync(resumeFile, "utf-8");

  // Try typst CLI first, then typst.ts
  const typstPath = path.join(paths.projectRoot, "node_modules/.bin/typst");

  try {
    // Method 1: Use typst CLI with stdin
    if (fs.existsSync(typstPath)) {
      // Write resume data to temp file for typst to read
      const tempJsonPath = path.join(
        paths.projectRoot,
        "temp-resume-data.json",
      );
      fs.writeFileSync(tempJsonPath, resumeData);

      const proc = Bun.spawn({
        cmd: [
          typstPath,
          "compile",
          "--input",
          tempJsonPath,
          templatePath,
          outputPath,
        ],
        cwd: paths.projectRoot,
      });

      await proc.exited;

      // Cleanup temp file
      if (fs.existsSync(tempJsonPath)) {
        fs.unlinkSync(tempJsonPath);
      }

      if (proc.success && fs.existsSync(outputPath)) {
        return true;
      }
    }

    // Method 2: Use typst.ts or just warn that typst needs to be installed
    console.log(
      `${colors.fgYellow}${icons.warning}${colors.reset} Typst not found or compilation failed`,
    );
    console.log(
      `${colors.fgCyan}${icons.info}${colors.reset} To enable Typst export, install with: bun add @myriaddreamin/typst.ts`,
    );
    return false;
  } catch (error) {
    console.log(
      `${colors.fgRed}${icons.cross}${colors.reset} Typst export failed: ${(error as Error).message}`,
    );
    return false;
  }
}

/**
 * Generate cover letter using Typst template
 */
export async function generateCoverLetter(name: string): Promise<boolean> {
  const templatePath = path.join(
    paths.projectRoot,
    "src/templates/cover-letter.typ",
  );
  const coverLetterPath = path.join(paths.srcDir, "cover-letter.json");
  const outputDir = getConfig().outputDir;
  const outputPath = path.join(
    paths.projectRoot,
    outputDir,
    `${name}-cover-letter.pdf`,
  );

  // Check if cover letter JSON exists
  if (!fs.existsSync(coverLetterPath)) {
    logError(
      "cover-letter.json not found. Run './bin/resume-gen cover' to create one.",
    );
    return false;
  }

  // Check if template exists
  if (!fs.existsSync(templatePath)) {
    logError(`Cover letter template not found at ${templatePath}`);
    return false;
  }

  // Read cover letter data
  const letterData = fs.readFileSync(coverLetterPath, "utf-8");

  // Try typst CLI
  const typstPath = path.join(paths.projectRoot, "node_modules/.bin/typst");

  try {
    if (fs.existsSync(typstPath)) {
      // Write data to temp file
      const tempJsonPath = path.join(paths.projectRoot, "temp-cover-data.json");
      fs.writeFileSync(tempJsonPath, letterData);

      const proc = Bun.spawn({
        cmd: [
          typstPath,
          "compile",
          "--input",
          tempJsonPath,
          templatePath,
          outputPath,
        ],
        cwd: paths.projectRoot,
      });

      await proc.exited;

      // Cleanup temp file
      if (fs.existsSync(tempJsonPath)) {
        fs.unlinkSync(tempJsonPath);
      }

      if (proc.success && fs.existsSync(outputPath)) {
        return true;
      }
    }

    console.log(
      `${colors.fgYellow}${icons.warning}${colors.reset} Typst not found. Cover letter generation requires typst CLI.`,
    );
    console.log(
      `${colors.fgCyan}${icons.info}${colors.reset} Install: bun install typst`,
    );
    return false;
  } catch (error) {
    logError(`Cover letter generation failed: ${(error as Error).message}`);
    return false;
  }
}

// =============================================================================
// EXPORT FUNCTIONS
// =============================================================================

/**
 * Export a single theme using worker thread
 */
export async function exportThemeWithWorker(
  theme: string,
  name: string,
  resumeFile: string,
  outputDir: string,
  format: "html" | "pdf" | "both",
  timeoutMs: number = 120000,
): Promise<ExportResult[]> {
  return new Promise((resolve) => {
    const worker = new Worker(import.meta.filename, {
      workerData: {
        theme,
        name,
        resumeFile,
        outputDir,
        format,
      } as ExportMessage,
    });

    const timeout = setTimeout(() => {
      worker.terminate();
      resolve([
        { theme, format: "both", success: false, error: "Worker timeout" },
      ]);
    }, timeoutMs);

    worker.on("message", (msg: any) => {
      if (msg.type === "ready") return;
      clearTimeout(timeout);
      worker.terminate();
      resolve(msg.results || []);
    });

    worker.on("error", (err) => {
      clearTimeout(timeout);
      worker.terminate();
      resolve([{ theme, format: "both", success: false, error: err.message }]);
    });
  });
}

/**
 * Ensure output directories exist
 */
export function ensureOutputDirs(outputDir: string): void {
  const themesDir = path.join(paths.projectRoot, outputDir, "themes");
  const pdfsDir = path.join(paths.projectRoot, outputDir, "pdfs");

  fs.mkdirSync(themesDir, { recursive: true });
  fs.mkdirSync(pdfsDir, { recursive: true });
}

/**
 * Generate all themes with parallel worker threads
 */
export async function generateThemes(
  force: boolean = false,
): Promise<GenerateResult[]> {
  const config = getConfig();
  const { valid, errors } = require("./types").validateResume();

  if (!valid) {
    console.log();
    require("./types").logError("resume.json is invalid:");
    for (const error of errors) {
      console.log(`  ${colors.fgRed}${icons.cross}${colors.reset} ${error}`);
    }
    return [];
  }

  // Check cache
  if (!force && config.useCache) {
    const currentHash = require("./types").getResumeHash();
    const cachedHash = require("./types").getCachedHash();

    if (currentHash === cachedHash) {
      console.log();
      require("./types").logInfo("No changes detected in resume.json");
      console.log(
        `\n${colors.fgCyan}${icons.arrow}${colors.reset} Use ${colors.fgYellow}--force${colors.reset} to regenerate`,
      );
      console.log(
        `${colors.fgCyan}${icons.arrow}${colors.reset} Or delete ${colors.fgYellow}${paths.cacheFile}${colors.reset}`,
      );
      return [];
    }
  }

  // Create output directories
  ensureOutputDirs(config.outputDir);

  // Get valid themes (installed + not skipped)
  const { CURATED_THEMES, SKIP_THEMES } = require("./types");
  const validThemes = CURATED_THEMES.filter(
    (t: { name: string }) =>
      !SKIP_THEMES.includes(t.name) && isThemeInstalled(t.name),
  );

  console.log();
  require("./types").log(
    `${icons.lightning} Generating ${validThemes.length} themes (parallel: ${config.parallel})`,
    "fgCyan",
  );

  // Determine export format
  const exportFormat: "html" | "pdf" | "both" =
    config.exportHtml && config.exportPdf
      ? "both"
      : config.exportHtml
        ? "html"
        : "pdf";

  // Process themes in parallel with worker threads
  const spin = (await import("@clack/prompts")).spinner();
  spin.start("Generating resumes...");

  const results = await Promise.all(
    validThemes.map(async (theme: { name: string }) => {
      // Export with worker
      const workerResults = await exportThemeWithWorker(
        theme.name,
        config.name,
        config.resumeFile,
        config.outputDir,
        exportFormat,
      );

      // Move files
      const moved = moveFiles(theme.name, config.name, config.outputDir);
      const success =
        workerResults.every((r) => r.success) && (moved.html || moved.pdf);

      return {
        theme: theme.name,
        success,
        html: moved.html,
        pdf: moved.pdf,
        error: workerResults.find((r) => !r.success)?.error,
      };
    }),
  );

  spin.stop();

  // Update cache
  if (config.useCache && results.filter((r) => r.success).length > 0) {
    require("./types").saveCache(require("./types").getResumeHash());
  }

  return results;
}

/**
 * Print generation results
 */
export function printResults(
  results: GenerateResult[],
  config?: ReturnType<typeof getConfig>,
): void {
  const cfg = config || getConfig();

  console.log();
  for (const r of results) {
    process.stdout.write(
      `${colors.fgCyan}${icons.arrow}${colors.reset} ${r.theme.padEnd(25)} `,
    );

    if (r.success) {
      console.log(
        `${colors.fgGreen}${icons.check}${colors.reset} HTML: ${cfg.exportHtml ? (r.html ? icons.check : icons.cross) : "-"} PDF: ${cfg.exportPdf ? (r.pdf ? icons.check : icons.cross) : "-"}`,
      );
    } else {
      const errorMsg = r.error?.substring(0, 30) || "failed";
      console.log(`${colors.fgRed}${icons.cross}${colors.reset} ${errorMsg}`);
    }
  }

  // Summary
  const successCount = results.filter((r) => r.success).length;
  const failCount = results.length - successCount;

  console.log();
  require("./types").logSection("Generation Complete");

  console.log(
    `${colors.fgGreen}${icons.check}${colors.reset} Success: ${successCount}`,
  );
  console.log(
    `${colors.fgRed}${icons.cross}${colors.reset} Failed: ${failCount}`,
  );
  console.log();

  console.log(
    `${colors.fgCyan}${icons.folder}${colors.reset} HTML: ${path.join(paths.projectRoot, cfg.outputDir, "themes")}/`,
  );
  console.log(
    `${colors.fgCyan}${icons.pdf}${colors.reset} PDF:  ${path.join(paths.projectRoot, cfg.outputDir, "pdfs")}/`,
  );

  if (successCount > 0) {
    console.log();
    require("./types").logSuccess(
      `${icons.sparkles} All themes generated successfully! ${icons.sparkles}`,
    );
  }
}
