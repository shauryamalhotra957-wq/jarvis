name: Bug Report
description: Report a bug or rendering issue in JARVIS UI
labels: ["bug"]
body:
  - type: markdown
    attributes:
      value: Thank you for helping improve JARVIS AI Assistant!
  - type: textarea
    id: bug-description
    attributes:
      label: Bug Description
      description: Detailed summary of what went wrong with shaders, audio, or UI.
    validations:
      required: true
  - type: textarea
    id: reproduction
    attributes:
      label: Steps to Reproduce
    validations:
      required: true
