#!/bin/env bash

export_pdf_and_html() {
    theme=$1
    resume_file=$2
    src_dir=$3
    public_dir=$4
    name=$5

    echo "Exporting and moving $theme..."

    echo "Exporting $theme to pdf"
    bunx resume-cli export keith-pdf-"$theme".pdf -r "$resume_file" -f pdf -t "$theme"

    echo "Exporting $theme to html..."
    bunx resume-cli export keith-"$theme".html -r "$resume_file" -f html -t "$theme"

    echo "Moving $theme"
    mv $name-"$theme".html ./"$public_dir"/themes/$name-"$theme".html
    mv $name-pdf-"$theme".pdf ./"$public_dir"/pdfs/$name-pdf-"$theme".pdf

    echo "Move of $theme complete"
}

# Define required directories and files
src_dir="src"
public_dir="public"
resume_file="resume.json"
cache_file=".resume_hash_cache"

# Define your themes here
theme_list=(
    jsonresume-theme-actual
    jsonresume-theme-apage
    jsonresume-theme-autumn
    jsonresume-theme-caffeine
    jsonresume-theme-class
    jsonresume-theme-classy
    jsonresume-theme-cora
    jsonresume-theme-dave
    jsonresume-theme-elegant
    jsonresume-theme-elite
    jsonresume-theme-eloquent
    jsonresume-theme-even
    jsonresume-theme-flat
    jsonresume-theme-flat-fr
    jsonresume-theme-full
    jsonresume-theme-github
    jsonresume-theme-jacrys
    # jsonresume-theme-kards
    jsonresume-theme-keloran
    jsonresume-theme-kendall
    jsonresume-theme-kwan
    jsonresume-theme-kwan-linkedin
    jsonresume-theme-latex
    jsonresume-theme-macchiato
    jsonresume-theme-mantra
    jsonresume-theme-mocha-responsive
    jsonresume-theme-modern
    jsonresume-theme-msresume
    jsonresume-theme-onepage
    jsonresume-theme-onepageresume
    jsonresume-theme-orbit
    jsonresume-theme-paper
    jsonresume-theme-paper-plus-plus
    jsonresume-theme-papirus
    jsonresume-theme-pumpkin
    jsonresume-theme-rocketspacer
    jsonresume-theme-short
    jsonresume-theme-simple-red
    jsonresume-theme-slick
    jsonresume-theme-srt
    jsonresume-theme-spartan
    jsonresume-theme-stackoverflow
    jsonresume-theme-standard-resume
    jsonresume-theme-tachyons-clean
    jsonresume-theme-tan-responsive
    jsonresume-theme-techlead
    jsonresume-theme-verbum
    jsonresume-theme-wraypro
)

# Check if resume.json exists
if [ ! -f "$resume_file" ]; then
    echo "Error: resume.json not found."
    exit 1
fi

# Validate resume.json
bunx resume-cli validate resume.json

# Ensure resume-cli is installed
# if ! command -v resume &> /dev/null; then
#     echo "Error: resume-cli not found. Installing..."
#     npm install resume-cli
# fi

# Calculate the hash of the current resume.json
current_hash=$(sha256sum resume.json | awk '{ print $1 }')

# Read the previous hash from the cache file
if [ -f "$cache_file" ]; then
    previous_hash=$(cat "$cache_file")
else
    previous_hash=""
fi

# Check if the hashes are different
if [ "$current_hash" != "$previous_hash" ]; then
    echo "Changes detected in resume.json. Updating exports..."

    # Save the current hash to the cache file
    echo "$current_hash" > "$cache_file"

    for theme in "${theme_list[@]}";
    do
        directory=$(pwd)
        if [[ $directory == *$src_dir ]]; then
            echo "$theme"

            # Check if the theme is installed, if not, install the theme
            if [ ! -d "node_modules/$theme" ]; then
                echo "installing $theme..."
                npm install "$theme"
                echo "installation of $theme complete!"
            fi

            # Export and move files in parallel
            export_pdf_and_html "$theme" $resume_file $src_dir $public_dir $name &

        else
            cd ..
        fi
    done

    # Wait for all background jobs to complete
    wait

    echo "All exports completed."
    echo "Finished exporting html"
    echo "🥳🕺🎉 All your themes are ready for you 🎉💃🥳"
    echo "🥳🕺🎉 All your files are ready for you! 🎉💃🥳"


else
    echo "No changes detected in resume.json. Skipping exports."
fi
