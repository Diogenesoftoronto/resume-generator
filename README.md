# Resume
A quick resume generator for people that hate GUIs and just want to work with structured data and plain text.

## Why?

Most resume tools and forms require re-entering information and often go offline or fail to work after you run them every few years when you need them. Have a resume in a structured form helps avoid that allowing you to generate resumes in an enduring format that is easily humand, machine/LLM readable.

## Getting started

You will need to fill out the resume.json file in a way that conforms to the jsonresume specification. You can learn more about jsonresume [here](https://jsonresume.org/). The following example is in bash, the scripts to run are also in bash but could easily be adapt to pwsh or fish in the future.

  NOTE: some parts of the resume-cli are somewhat broken, for example the pdf feature, which made it easy to generate resumes in pdfs automagically without downloading them yourself, this can be worked around with some html -> pdf tooling. Unfortunately no such tooling has currently been implemented.

```sh
touch resume.json # unless resume.json already exists```

You can find an example in resume.example.json.

```sh
less resume.example.json```

You can generate resume's by simply running the better-create-themes.sh script.

Understand that you will need to make the file have executable permissions.

```sh
chmod +x ./scripts/better-create-themes.sh```


Now you can easily run the script! Remember to add a name for your files!
```sh
name=myname ./scripts/better-create-themes.sh
```
  NOTE: You can permanently set a name by setting it in your environment.

DONE!

Feel free to contribute.

