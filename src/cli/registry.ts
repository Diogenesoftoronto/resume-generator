// =============================================================================
// NPM REGISTRY MODULE
// =============================================================================

import type { NpmTheme } from "./types";
import { paths, logWarning } from "./types";

export interface RegistryTheme {
  name: string;
  description: string;
  downloads: number;
}

/**
 * Fetch themes from npm registry
 */
export async function fetchRegistryThemes(): Promise<RegistryTheme[]> {
  try {
    const response = await fetch(
      "https://registry.npmjs.org/-/v1/search?text=jsonresume-theme&size=100",
    );

    if (!response.ok) {
      throw new Error(`Registry returned ${response.status}`);
    }

    const data = await response.json();

    return data.objects.map((pkg: any) => ({
      name: pkg.package.name.replace("jsonresume-theme-", ""),
      description:
        pkg.package.description?.substring(0, 60) || "No description",
      downloads: pkg.downloads?.weekly || 0,
    }));
  } catch (error) {
    logWarning(`Could not fetch from npm: ${(error as Error).message}`);
    return [];
  }
}

/**
 * Get latest version of a package from npm
 */
export async function getLatestVersion(
  packageName: string,
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://registry.npmjs.org/${packageName}/latest`,
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.version || null;
  } catch {
    return null;
  }
}

/**
 * Add theme to package.json
 */
export async function addThemeToPackageJson(
  themeName: string,
): Promise<boolean> {
  const packageName = `jsonresume-theme-${themeName}`;

  try {
    const content = await Bun.file(paths.packageJson).text();
    const pkg = JSON.parse(content);

    // Skip if already exists
    if (pkg.dependencies?.[packageName]) {
      return false;
    }

    // Get latest version
    const version = await getLatestVersion(packageName);
    const versionStr = version ? `^${version}` : "^0.0.1";

    // Add to dependencies
    pkg.dependencies = pkg.dependencies || {};
    pkg.dependencies[packageName] = versionStr;

    // Write back
    await Bun.write(paths.packageJson, JSON.stringify(pkg, null, 2) + "\n");

    return true;
  } catch {
    return false;
  }
}
