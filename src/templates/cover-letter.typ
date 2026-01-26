// Typst Cover Letter Template
// Takes JSON data and generates a professional cover letter

// Parse JSON data from stdin
#let letter-data = json("/dev/stdin")

// Helper to safely get nested values
#let get(data, key, default: "") = {
  if type(data) == dict {
    if key in data { data.at(key) } else { default }
  } else { default }
}

// Extract sender information
#let sender = get(letter-data, "sender", default: {})
#let sender-name = get(sender, "name", default: "Your Name")
#let sender-address = get(sender, "address", default: "")
#let sender-city = get(sender, "city", default: "")
#let sender-state = get(sender, "state", default: "")
#let sender-zip = get(sender, "zip", default: "")
#let sender-email = get(sender, "email", default: "")
#let sender-phone = get(sender, "phone", default: "")

// Extract recipient information
#let recipient = get(letter-data, "recipient", default: {})
#let recipient-name = get(recipient, "name", default: "")
#let recipient-title = get(recipient, "title", default: "")
#let recipient-company = get(recipient, "company", default: "")
#let recipient-address = get(recipient, "address", default: "")
#let recipient-city = get(recipient, "city", default: "")
#let recipient-state = get(recipient, "state", default: "")
#let recipient-zip = get(recipient, "zip", default: "")

// Letter content
#let subject = get(letter-data, "subject", default: "Application for Position")
#let opening = get(letter-data, "opening", default: "")
#let body-paragraphs = get(letter-data, "body", default: ())
#let closing = get(letter-data, "closing", default: "")
#let sign-off = get(letter-data, "sign-off", default: "Sincerely,")

// Document setup
#set document(
  title: "Cover Letter - " + sender-name,
  author: sender-name,
)

#set page(
  paper: "us-letter",
  margin: (x: 1in, y: 1in),
)

// Format sender address
#let format-address(addr, city, state, zip) = {
  let parts = ()
  if addr != "" { parts.push(addr) }
  if city != "" { parts.push(city) }
  if state != "" and zip != "" { parts.push(state + " " + zip) }
  else if state != "" { parts.push(state) }
  else if zip != "" { parts.push(zip) }
  parts.join(", ")
}

// Sender info (aligned right)
#align(right)[
  #text(weight: "bold", sender-name) \
  #if sender-address != "" or sender-city != "" { format-address(sender-address, sender-city, sender-state, sender-zip) }
  #if sender-email != "" { sender-email }
  #if sender-phone != "" { sender-phone }
]

#v(2em)

// Date (aligned right)
#align(right)[
  #text(size: 10pt, fill: gray, datetime.today().display())
]

#v(2em)

// Recipient info
#if recipient-name != "" or recipient-company != "" {
  #if recipient-name != "" { text(weight: "bold", recipient-name) }
  #if recipient-title != "" { text(recipient-title) }
  #if recipient-company != "" { text(recipient-company) }
  #if recipient-address != "" or recipient-city != "" {
    format-address(recipient-address, recipient-city, recipient-state, recipient-zip)
  }
}

#v(2em)

// Salutation
#if recipient-name != "" {
  text("Dear " + recipient-name + ",")
} else {
  text("Dear Hiring Manager,")
}

#v(1em)

// Opening paragraph
#if opening != "" {
  text(opening)
  #v(1em)
}

// Body paragraphs
#if body-paragraphs.len() > 0 {
  for para in body-paragraphs {
    text(para)
    #v(1em)
  }
}

// Closing paragraph
#if closing != "" {
  text(closing)
  #v(2em)
}

// Signature
text(sign-off)

#v(1.5em)

// Typed name
text(sender-name)
