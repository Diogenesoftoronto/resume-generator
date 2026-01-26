# Resume Generator

A powerful, script-based resume generator built with **Bun** + **Clack** that transforms structured JSON data into multiple professional resume formats using [JSON Resume](https://jsonresume.org/) themes.

## Features

- **40+ Curated Themes** - Tested themes with parallel worker thread processing
- **Single Unified CLI** - All commands through one modular tool
- **npm Registry Integration** - Dynamically discover 100+ available themes
- **Bun-Native** - Uses `bun add` for all package management (no npm)
- **Auto-Install** - `generate` command automatically installs missing themes
- **Smart Caching** - Regenerates only when `resume.json` changes
- **Worker Thread Parallelism** - Fast concurrent theme exports

## Requirements

- [Bun](https://bun.sh/) v1.0+ (required - npm is not used)

## Installation

```bash
# Navigate to project
cd resume-generator

# Install all dependencies (resume-cli + 40+ themes)
bun install
```

## Quick Start

```bash
# Generate all themes (auto-installs missing themes, parallel processing)
./bin/resume-gen generate

# List themes from npm registry
./bin/resume-gen list

# Validate your resume.json
./bin/resume-gen validate

# Switch preview theme interactively
./bin/resume-gen switch

# Clean generated files
./bin/resume-gen clean
```

## Editing Your Resume

Edit `src/resume.json` following the [JSON Resume schema](https://jsonresume.org/schema/):

```json
{
  "basics": {
    "name": "Your Name",
    "label": "Software Engineer",
    "email": "you@example.com",
    "url": "https://yourwebsite.com",
    "summary": "A brief summary of yourself",
    "location": {
      "city": "San Francisco",
      "countryCode": "US"
    }
  },
  "work": [
    {
      "name": "Company Name",
      "position": "Your Position",
      "startDate": "2020-01",
      "endDate": "Present",
      "summary": "What you did"
    }
  ],
  "education": [],
  "skills": [],
  "projects": []
}
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `generate` | Generate all themes (default, auto-installs missing) |
| `list` | List themes from npm registry |
| `validate` | Validate resume.json file |
| `switch` | Interactive theme switcher for preview |
| `install` | Install missing curated themes |
| `prerun` | Add curated themes to package.json |
| `clean` | Clean generated files |
| `help` | Show help message |

## Options

| Flag | Description |
|------|-------------|
| `--force` | Force regeneration (ignore cache) |
| `--verbose` | Show detailed output |

## Examples

```bash
# Generate all themes
./bin/resume-gen generate

# Force regenerate all themes (ignores cache)
./bin/resume-gen generate --force

# List themes from npm
./bin/resume-gen list

# Validate resume.json
./bin/resume-gen validate

# Switch theme preview
./bin/resume-gen switch

# Clean generated files
./bin/resume-gen clean

# Show help
./bin/resume-gen help
```

## Configuration

Create a `.env` file in the project root to customize settings:

```bash
# Output file prefix
NAME=keith

# Output directory (default: resumes)
OUTPUT_DIR=resumes

# Parallel theme processing (default: 4)
PARALLEL=4

# Export formats
EXPORT_HTML=true
EXPORT_PDF=true

# Use hash caching
USE_CACHE=true

# Verbose output
VERBOSE=false
```

## Output Locations

After generating, your resumes will be:

| Format | Location |
|--------|----------|
| HTML Themes | `resumes/themes/keith-{theme}.html` |
| PDF Versions | `resumes/pdfs/keith-pdf-{theme}.pdf` |
| Active Preview | `src/index.html` |
| Cache | `src/.resume_hash_cache` |

## Project Structure

```
resume-generator/
├── bin/
│   └── resume-gen              # CLI wrapper (bash)
├── src/
│   ├── cli/                    # CLI modules
│   │   ├── index.ts            # Main entry point
│   │   ├── types.ts            # Types, constants, utilities
│   │   ├── registry.ts         # npm registry integration
│   │   └── export.ts           # Export logic with worker threads
│   ├── resume.json             # Your resume data
│   ├── index.html              # Preview of active theme
│   └── .resume_hash_cache      # Auto-generated cache
├── resumes/                    # Generated output
├── node_modules/               # Themes (project root)
├── package.json                # Dependencies
└── README.md                   # This file
```

## Curated Themes

The CLI includes 40+ tested themes:

- actual, apage, autumn, caffeine, class, classy, cora, dave
- elegant, eloquent, even, flat, flat-fr, full, github, jacrys
- kards, keloran, kendall, macchiato, mantra, mocha-responsive
- modern, msresume, onepage, onepageresume, orbit, paper
- paper-plus-plus, papirus, pumpkin, rocketspacer, short
- simple-red, slick, spartan, srt, stackoverflow
- standard-resume, tachyons-clean, tan-responsive, techlead
- verbum, wraypro

### Skipped Themes

These themes have known issues and are excluded:
- `kwan`, `kwan-linkedin`, `latex`, `elite`

## npm Registry

Query npm to discover all 100+ jsonresume themes:

```bash
./bin/resume-gen list
```

Shows themes sorted by weekly downloads.

## How It Works

### Generate Command (Default)

The `generate` command does everything automatically:

1. **Validates** - Checks resume.json is valid
2. **Auto-Installs** - Installs any missing curated themes via `bun add`
3. **Checks Cache** - Compares SHA256 hash of resume.json
4. **Exports Themes** - Runs 40+ exports in parallel using worker threads
5. **Moves Files** - Organizes HTML/PDF to `resumes/` folders
6. **Updates Cache** - Saves hash for next run

### Worker Thread Parallelism

Each theme export runs in its own worker thread for maximum speed:

```typescript
// From export.ts
const results = await Promise.all(
  validThemes.map(async (theme) => {
    const workerResults = await exportThemeWithWorker(
      theme.name,
      config.name,
      config.resumeFile,
      config.outputDir,
      exportFormat,
    );
    // ...
  })
);
```

## Build Binary

Compile the CLI to a standalone binary:

```bash
bun run build
```

This creates `bin/resume-gen` executable.

## Alternative npm Scripts

```bash
bun run gen        # Generate themes
bun run list       # List themes
bun run validate   # Validate resume.json
bun run switch     # Switch theme
bun run install    # Install missing themes
bun run prerun     # Add themes to package.json
bun run clean      # Clean generated files
bun run build      # Build binary
bun run help       # Show help
```

## Troubleshooting

### Theme export fails

```bash
# Ensure theme is installed
./bin/resume-gen install

# Or manually install
bun add jsonresume-theme-{theme-name}
```

### resume.json validation fails

```bash
# Check syntax
./bin/resume-gen validate

# Verify against schema
# https://jsonresume.org/schema/
```

### Cache issues

```bash
# Force regeneration
./bin/resume-gen generate --force

# Or clear cache manually
rm src/.resume_hash_cache
```

### bun: command not found

Install Bun: https://bun.sh/docs/installation

## License

MIT