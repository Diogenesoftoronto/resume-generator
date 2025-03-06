#!/bin/bash
# Function to display usage information
usage() {
  echo "Usage: $0 -t theme_name [-o output_directory] [--help]"
  echo "  -t theme_name       : The name of the theme to apply."
  echo "  -o output_directory : (Optional) The directory where the generated index.html file will be saved. (Default: current directory)"
  echo "  --help              : Display this help message."
}

# Check if no arguments are provided
if [ $# -eq 0 ]; then
  usage
  exit 1
fi

# Parse command-line options using getopts
while getopts ":t:o:-:" opt; do
  case ${opt} in
    t)
      theme_name=$OPTARG
      ;;
    o)
      output_dir=$OPTARG
      ;;
    -)
      case "${OPTARG}" in
        help)
          usage
          exit 0
          ;;
        *)
          echo "Error: Unknown option --${OPTARG}"
          usage
          exit 1
          ;;
      esac
      ;;
    \?)
      echo "Error: Unknown option -${OPTARG}"
      usage
      exit 1
      ;;
    :)
      echo "Error: Option -${OPTARG} requires an argument."
      usage
      exit 1
      ;;
  esac
done

# Check if the theme name is provided
if [ -z "${theme_name}" ]; then
  echo "Error: Theme name is required."
  usage
  exit 1
fi

# Set variables
full_theme="jsonresume-theme-${theme_name}"
data_dir="./public/Data"
old_builds_dir="./old_builds"
public_themes_dir="./public/themes"
output_dir="${output_dir:-.}"  # Default to the current directory if not specified

# Check if the required directories and files exist
# case $1 in
#   $([[ ! -d "${data_dir}" ]] && echo $1) | $([[ ! -d "${old_builds_dir}" ]] && echo 1) | $([[ ! -f "${public_themes_dir}/keith-${full_theme}.html" ]] && echo 1))
#     echo "Error: Required directories or theme file do not exist."
#     exit 1
#     ;;
# esac

if [ ! -d "${data_dir}" ]; then
  echo "Error: The directory '${data_dir}' does not exist."
  exit 1
fi

# Check if the old_builds directory exists
if [ ! -d "${old_builds_dir}" ]; then
  echo "Error: The directory '${old_builds_dir}' does not exist."
  exit 1
fi

# Check if the theme file exists
if [ ! -f "${public_themes_dir}/keith-${full_theme}.html" ]; then
  echo "Error: The file '${public_themes_dir}/keith-${full_theme}.html' does not exist."
  exit 1
fi

# Create the output directory if it doesn't exist
if [ ! -d "${output_dir}" ]; then
  echo "Creating output directory: ${output_dir}"
  mkdir -p "${output_dir}"
fi

# Extract the current theme's title from index.html and append it to themehistory.txt
grep -Po "(?<=title\>)(.+)(?=\stheme)" index.html > "${data_dir}/themehistory.txt"

# Move the current index.html to the old_builds folder, and prepend 'old-' to its filename
mv index.html "${old_builds_dir}/old-${full_theme}.html"

# Move the newly generated theme's HTML file from public/themes/ to the specified output directory as index.html
mv "${public_themes_dir}/keith-${full_theme}.html" "${output_dir}/index.html"
echo "Moved the generated HTML file to the output directory: ${output_dir}"