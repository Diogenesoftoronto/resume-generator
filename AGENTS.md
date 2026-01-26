# AI/Agent Context for Resume Generator

This document provides context and guidelines for AI assistants working on this project.

## Project Overview

A script-based resume generator that transforms structured JSON data into multiple professional resume formats using JSON Resume themes. The project generates 45+ resume themes in both HTML and PDF formats from a single `resume.json` file.

**Key Problem Solved**: Avoids GUI-based resume tools that require re-entering data and often become obsolete. Keeps resume data in structured JSON format for longevity and machine readability.

## Technology Stack

- **Runtime**: Node.js v18+
- **Package Manager**: npm (Bun also supported)
- **Build Tool**: Bash scripts
- **Resume Format**: JSON Resume schema
- **CLI Tool**: resume-cli v3.0.8
- **Themes**: 45+ jsonresume-theme-* packages

## Critical Architecture Decisions

### 1. Root-Level node_modules

Dependencies (all themes + resume-cli) are installed at the project **root** level, NOT in `src/node_modules`. This is intentional to allow scripts to reference themes consistently from anywhere.

```
resume-generator/
├── node_modules/           # All packages here (root level)
├── src/
│   └── node_modules/       # DO NOT USE - symlink or removal recommended
```

**Why**: Using `npx` or `bunx` runs commands from a temporary directory and cannot find locally installed themes. Scripts must use `./node_modules/.bin/resume` (relative to project root) instead.

### 2. Package.json at Root

The root `package.json` contains all theme dependencies to ensure they're installed at the correct level.

```bash
# Always install from project root
cd resume-generator
npm install

# DO NOT run npm install from src/ directory
```

### 3. Invalid Dependencies to Avoid

**NEVER use these patterns in package.json**:
- `"resume": "link:"` - Invalid npm protocol (empty link)
- `"link:./some/path"` without valid target

## Project Structure

```
resume-generator/
├── package.json              # Root dependencies (CRITICAL)
├── node_modules/             # All installed packages
├── src/
│   ├── resume.json           # Main resume data (JSON Resume schema)
│   ├── index.html            # Active theme preview
│   ├── scripts/
│   │   ├── create_themes.sh     # Original generation script
│   │   ├── better_create_themes.sh  # Optimized with caching
│   │   └── set_theme.sh         # Switch active theme
│   ├── public/
│   │   ├── themes/           # Generated HTML resumes
│   │   ├── pdfs/             # Generated PDF resumes
│   │   └── Data/             # Theme history
│   ├── .resume_hash_cache    # Auto-generated (SHA256 of resume.json)
│   └── node_modules/         # DO NOT USE - symlink to root recommended
└── README.md
```

## Common Commands

```bash
# From project root

# Install dependencies
npm install

# Generate all themes (better script with caching)
bash src/scripts/better_create_themes.sh

# Force regeneration (clear cache first)
rm -f src/.resume_hash_cache && bash src/scripts/better_create_themes.sh

# Generate without caching
bash src/scripts/create_themes.sh

# Switch active theme for preview
cd src && bash scripts/set_theme.sh -t actual

# Validate resume.json
./node_modules/.bin/resume validate src/resume.json

# Generate single theme manually
./node_modules/.bin/resume export output.html -r src/resume.json -f html -t jsonresume-theme-actual

# Symlink node_modules for src/ convenience
cd src && ln -s ../node_modules node_modules
```

## Known Issues and Workarounds

### Issue: "theme path could not be resolved"

**Cause**: Using `npx` or `bunx` which run from `/tmp/` directory
**Fix**: Always use `./node_modules/.bin/resume` (absolute or project-root relative path)

### Issue: npm error "Unsupported URL Type link:"

**Cause**: Invalid `"resume": "link:"` in package.json
**Fix**: Remove the line from package.json, run `npm install`

### Issue: Some themes fail to export

**Cause**: Third-party theme bugs (Handlebars errors, missing dependencies)
**Behavior**: Script continues processing other themes; failed themes skip to next
**Workaround**: Remove problematic themes from `theme_list` array in scripts

### Issue: jsonresume-theme-even PDF export fails

**Cause**: Theme requires special installation path
**Fix**: Theme still generates HTML successfully

### Issue: jsonresume-theme-elite Handlebars error

**Cause**: `{{lowercase}}` helper requires 1 argument
**Workaround**: HTML export fails, remove from theme_list if needed

### Issue: jsonresume-theme-latex PDF generation issues

**Cause**: PDF conversion limitations in the theme
**Workaround**: HTML works; convert via browser print if needed

### Issue: jsonresume-theme-kwan* themes not resolving

**Cause**: Theme package configuration issues
**Workaround**: Skip these themes in generation

## Scripts Reference

### better_create_themes.sh

Improved script with smart caching:
- Uses SHA256 hash of `resume.json` to detect changes
- Only regenerates themes when content changes
- Faster for iterative development
- Handles missing themes by auto-installing

**Key variables**:
```bash
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RESUME_BIN="$PROJECT_ROOT/node_modules/.bin/resume"
```

### create_themes.sh

Original script without caching:
- Regenerates all themes every run
- No hash comparison
- Simpler logic, useful for fresh installs

### set_theme.sh

Switches the active theme preview:
- Moves specified theme's HTML to `src/index.html`
- Updates theme history in `src/Data/themehistory.txt`
- Moves old index to `old_builds/`

## Coding Conventions

### Bash Scripts

1. Use `#!/usr/bin/env bash` shebang
2. Always use double quotes for variable expansion
3. Use `$()` for command substitution (not backticks)
4. Prefix project root with `PROJECT_ROOT` variable
5. Use `mkdir -p` for directory creation
6. Check file/directory existence before operations

### JSON

1. Follow JSON Resume schema (https://jsonresume.org/schema/)
2. Use consistent indentation (2 spaces)
3. No trailing commas

### NPM

1. Keep `package.json` at project root only
2. DO NOT create separate package.json in `src/`
3. Use exact versions (^ prefix acceptable for themes)
4. Remove invalid dependencies like empty `link:` protocols

## Development Workflow

### Adding a New Theme

1. Install at project root:
   ```bash
   npm install jsonresume-theme-newtheme
   ```

2. Add to `theme_list` array in `src/scripts/better_create_themes.sh`

3. Regenerate:
   ```bash
   bash src/scripts/better_create_themes.sh
   ```

### Testing a Single Theme

```bash
./node_modules/.bin/resume export test.html -r src/resume.json -f html -t jsonresume-theme-themetest
```

### Debugging Export Issues

```bash
# Validate resume.json first
./node_modules/.bin/resume validate src/resume.json

# Try single theme with verbose output
./node_modules/.bin/resume export debug.html -r src/resume.json -f html -t jsonresume-theme-specific
```

## File Locations Summary

| Purpose | Path | Notes |
|---------|------|-------|
| Resume data | `src/resume.json` | EDIT THIS |
| Active preview | `src/index.html` | Changes with set_theme.sh |
| Generated HTML | `src/public/themes/*.html` | All theme variations |
| Generated PDF | `src/public/pdfs/*.pdf` | PDF versions |
| Theme cache | `src/.resume_hash_cache` | Auto-generated |
| CLI binary | `./node_modules/.bin/resume` | Use this, NOT npx |

## Environment Variables (Optional)

| Variable | Default | Purpose |
|----------|---------|---------|
| `name` | `keith` | Prefix for output files |

## Tips for AI Assistants

1. **Always run from project root** - Scripts expect to find `node_modules/` at root level

2. **Use `./node_modules/.bin/resume`** - Never use `npx resume` or `bunx resume-cli`

3. **Check package.json** - Before adding dependencies, verify they're not already present

4. **Test single themes first** - When adding new themes, test with single export before adding to full script

5. **Handle errors gracefully** - Some themes have bugs; script should continue processing others

6. **Cache works correctly** - Don't clear `.resume_hash_cache` unless intentionally forcing regeneration

7. **Symlink node_modules** - Run `cd src && ln -s ../node_modules node_modules` for convenience when working in src/

## Useful Paths for Reference

- Project root: `/home/diogenes/Programs/resume-generator/`
- Resume file: `/home/diogenes/Programs/resume-generator/src/resume.json`
- Scripts: `/home/diogenes/Programs/resume-generator/src/scripts/`
- Output HTML: `/home/diogenes/Programs/resume-generator/src/public/themes/`
- Output PDF: `/home/diogenes/Programs/resume-generator/src/public/pdfs/`
