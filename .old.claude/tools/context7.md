# Context7 MCP - Up-to-date Code Docs For Any Prompt

[Website badges and links]

## ❌ Without Context7

LLMs rely on outdated or generic information about the libraries you use. You get:

- ❌ Code examples are outdated and based on year-old training data
- ❌ Hallucinated APIs don't even exist
- ❌ Generic answers for old package versions

## ✅ With Context7

Context7 MCP pulls up-to-date, version-specific documentation and code examples straight from the source — and places them directly into your prompt.

Add `use context7` to your prompt in Cursor:

```
Create a basic Next.js project with app router. use context7
```

Context7 fetches up-to-date code examples and documentation right into your LLM's context.

1️⃣ Write your prompt naturally
2️⃣ Tell the LLM to `use context7`
3️⃣ Get working code answers

No tab-switching, no hallucinated APIs that don't exist, no outdated code generations.

## 📚 Adding Projects

Check out our [project addition guide](docs/adding-projects.md) to learn how to add (or update) your favorite libraries to Context7.

## 🛠️ Installation

### Requirements

- Node.js >= v18.0.0
- Cursor, Windsurf, Claude Desktop or another MCP Client

[Detailed installation instructions for various platforms and tools]

## 🔨 Available Tools

Context7 MCP provides the following tools that LLMs can use:

- `resolve-library-id`: Resolves a general library name into a Context7-compatible library ID
- `get-library-docs`: Fetches documentation for a library using a Context7-compatible library ID

## 💻 Development

[Development setup and CLI instructions]
