#!/bin/bash

echo "Started creating themes"
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
# # make sure they have a json file with the right schema
# resume validate resume.json
# # check if resume-cli, package-json, and nodemodules exist if not install them
for theme in ${theme_list[@]};
do
    echo $theme
    echo "moving $theme"
    mv keith-$theme.html ./public/themes/keith-$theme.html
    mv keith-pdf-$theme.pdf ./public/pdfs/keith-pdf-$theme.pdf
    echo "move of $theme complete"
done
echo "Finished moving html and pdfs"
echo "🥳🕺🎉 All your files are ready for you! 🎉💃🥳"

# assume you are in src folder for execution