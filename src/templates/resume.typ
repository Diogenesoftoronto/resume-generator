// Typst Resume Template
// Based on JSON Resume schema

// Helper function to parse JSON data
#let resume-data = json("/dev/stdin")

// Helper to safely get nested values
#let get(data, key, default: "") = {
  if type(data) == dict {
    if key in data { data.at(key) } else { default }
  } else { default }
}

// Helper to format location
#let format-location(loc) = {
  if type(loc) == dict {
    let parts = ()
    if "city" in loc { parts.push(loc.city) }
    if "region" in loc { parts.push(loc.region) }
    if "countryCode" in loc { parts.push(loc.countryCode) }
    parts.join(", ")
  } else { loc }
}

// Get data sections
#let basics = get(resume-data, "basics", default: {})
#let name = get(basics, "name", default: "Your Name")
#let label = get(basics, "label", default: "")
#let email = get(basics, "email", default: "")
#let phone = get(basics, "phone", default: "")
#let url = get(basics, "url", default: "")
#let summary = get(basics, "summary", default: "")
#let location = format-location(get(basics, "location", default: ""))
#let profiles = get(basics, "profiles", default: ())

#let work = get(resume-data, "work", default: ())
#let education = get(resume-data, "education", default: ())
#let skills = get(resume-data, "skills", default: ())
#let projects = get(resume-data, "projects", default: ())
#let awards = get(resume-data, "awards", default: ())
#let interests = get(resume-data, "interests", default: ())

// Document configuration
#set document(
  title: name,
  author: name,
  keywords: (label, "resume", "CV"),
)

#set page(
  paper: "us-letter",
  margin: (x: 0.75in, y: 0.75in),
  footer: context {
    let page-num = counter(page).get().first()
    text(size: 9pt, fill: gray, align(center, if page-num > 1 { "Page " + str(page-num) } else { "" }))
  }
)

#set text(
  font: "Inter",
  size: 10pt,
  fallback-font: ("Linux Libertine", "Times New Roman"),
)

#set par(justify: true)

// Header with name and contact info
#align(center)[
  #text(size: 28pt, weight: "bold", name) \
  #if label != "" { text(size: 14pt, style: "italic", fill: gray, label + [  ]) }

  #if location != "" or email != "" or phone != "" or url != "" {
    text(size: 10pt, {
      let parts = ()
      if email != "" { parts.push(email) }
      if url != "" { parts.push(url) }
      if phone != "" { parts.push(phone) }
      if location != "" { parts.push(location) }
      parts.join("  •  ")
    })
  }
]

// Social profiles
#if profiles.len() > 0 {
  align(center)[
    #text(size: 9pt, {
      let network-links = profiles.map(p => {
        let network = get(p, "network", default: "")
        let url = get(p, "url", default: "")
        if network != "" and url != "" {
          "[" + network + "](" + url + ")"
        }
      }).filter(x => x != "").join("  •  ")
      network-links
    })
  ]
}

// Sections spacing
#let section-spacing = 12pt

// Helper for section header
#let section-header(title) = {
  text(size: 12pt, weight: "bold", fill: rgb"#2c3e50", title)
  line(length: 100%, stroke: rgb"#3498db", thickness: 1pt)
  v(section-spacing)
}

// Summary
#if summary != "" {
  section-header("Summary")
  text(summary)
  v(section-spacing)
}

// Work experience
#if work.len() > 0 {
  section-header("Experience")

  for job in work {
    let company = get(job, "name", default: "")
    let position = get(job, "position", default: "")
    let start-date = get(job, "startDate", default: "")
    let end-date = get(job, "endDate", default: "Present")
    let summary = get(job, "summary", default: "")
    let highlights = get(job, "highlights", default: ())

    // Job header
    if position != "" or company != "" {
      text(weight: "bold", if position != "" and company != "" { position + " at " + company } else { position + company })
    }

    // Date
    if start-date != "" {
      text(style: "italic", fill: gray, if end-date != "" { start-date + " – " + end-date } else { start-date })
    }

    // Summary
    if summary != "" {
      v(4pt)
      text(summary)
    }

    // Highlights as bullet points
    if highlights.len() > 0 {
      v(4pt)
      for highlight in highlights {
        list(marker: "•", text(size: 9pt, highlight))
      }
    }

    v(section-spacing)
  }
}

// Education
#if education.len() > 0 {
  section-header("Education")

  for edu in education {
    let institution = get(edu, "institution", default: "")
    let study-type = get(edu, "studyType", default: "")
    let area = get(edu, "area", default: "")
    let start-date = get(edu, "startDate", default: "")
    let end-date = get(edu, "endDate", default: "")
    let gpa = get(edu, "gpa", default: "")
    let courses = get(edu, "courses", default: ())

    if institution != "" or study-type != "" or area != "" {
      text(weight: "bold", if study-type != "" and area != "" { study-type + " in " + area } else { study-type + area + institution })
    }

    if institution != "" and (study-type == "" and area == "") {
      text(weight: "bold", institution)
    }

    if start-date != "" {
      text(style: "italic", fill: gray, if end-date != "" { start-date + " – " + end-date } else { start-date })
    }

    if gpa != "" {
      v(4pt)
      text("GPA: " + gpa)
    }

    if courses.len() > 0 {
      v(4pt)
      text(size: 9pt, "Relevant coursework: " + courses.join(", "))
    }

    v(section-spacing)
  }
}

// Skills
#if skills.len() > 0 {
  section-header("Skills")

  let skill-groups = skills.map(s => {
    let name = get(s, "name", default: "")
    let keywords = get(s, "keywords", default: ())
    (name, keywords)
  }).filter(g => g.at(0) != "")

  if skill-groups.len() > 0 {
    for (category, items) in skill-groups {
      text(weight: "bold", category + ": ")
      text(join(items, ", "))
      v(2pt)
    }
  }
  v(section-spacing)
}

// Projects
#if projects.len() > 0 {
  section-header("Projects")

  for proj in projects {
    let name = get(proj, "name", default: "")
    let description = get(proj, "description", default: "")
    let start-date = get(proj, "startDate", default: "")
    let end-date = get(proj, "endDate", default: "")
    let url = get(proj, "url", default: "")
    let highlights = get(proj, "highlights", default: ())

    if name != "" {
      text(weight: "bold", if url != "" { name + [" ](] + url + ")}" else { name })
    }

    if start-date != "" {
      text(style: "italic", fill: gray, if end-date != "" { start-date + " – " + end-date } else { start-date })
    }

    if description != "" {
      v(4pt)
      text(description)
    }

    if highlights.len() > 0 {
      v(4pt)
      for highlight in highlights {
        list(marker: "•", text(size: 9pt, highlight))
      }
    }

    v(section-spacing)
  }
}

// Awards
#if awards.len() > 0 {
  section-header("Awards")

  for award in awards {
    let title = get(award, "title", default: "")
    let date = get(award, "date", default: "")
    let awarder = get(award, "awarder", default: "")
    let summary = get(award, "summary", default: "")

    if title != "" {
      text(weight: "bold", title)
    }

    if date != "" or awarder != "" {
      text(style: "italic", fill: gray, if date != "" and awarder != "" { date + " – " + awarder } else { date + awarder })
    }

    if summary != "" {
      v(4pt)
      text(summary)
    }

    v(section-spacing)
  }
}

// Interests
#if interests.len() > 0 {
  section-header("Interests")
  text(", ".join(interests))
}
