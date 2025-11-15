# Installation Instructions

## Prerequisites

The Perplexity API integration requires the following Python packages:

- `requests` >= 2.31.0 (HTTP client)
- `pydantic` >= 2.0.0 (Data validation)
- `python-dotenv` >= 1.0.0 (Environment variables)

## Installation Methods

### Option 1: Using pip (Recommended)

```bash
pip install -r .ai/tools/perplexity/requirements.txt
```

### Option 2: Using uv

```bash
uv pip install --system requests pydantic python-dotenv
```

### Option 3: Individual packages

```bash
pip install requests pydantic python-dotenv
```

## Verification

Verify installation:

```bash
python3 -c "import sys; sys.path.insert(0, '.ai/tools'); from perplexity import PerplexityClient; print('✓ Setup complete')"
```

## Configuration

1. Copy the sample environment file:

   ```bash
   cp .ai/.env.sample .ai/.env
   ```

2. Add your Perplexity API key to `.ai/.env`:

   ```
   PERPLEXITY_API_KEY=your-api-key-here
   ```

3. Get your API key from: <https://www.perplexity.ai/settings/api>

## Testing Installation

Run the CLI tools:

```bash
# Test search (will fail without valid API key, but should not have import errors)
uv run .ai/tools/perplexity/cli_search.py "test" 2>&1 | head -5

# Test chat
uv run .ai/tools/perplexity/cli_chat.py "test" 2>&1 | head -5
```

Run tests:

```bash
pytest .ai/tools/perplexity/tests/ -v
```

## Troubleshooting

### ModuleNotFoundError: No module named 'pydantic'

Install pydantic:

```bash
pip install pydantic
```

### ModuleNotFoundError: No module named 'requests'

Install requests:

```bash
pip install requests
```

### ImportError: cannot import name 'BaseModel' from 'pydantic'

You may have pydantic v1 installed. Upgrade to v2:

```bash
pip install --upgrade pydantic>=2.0.0
```

### API Key Not Found

Ensure `PERPLEXITY_API_KEY` is set in `.ai/.env`:

```bash
echo "PERPLEXITY_API_KEY=your-key" >> .ai/.env
```

## Development Setup

For development and testing:

```bash
# Install with test dependencies
pip install -r .ai/tools/perplexity/requirements.txt
pip install pytest pytest-cov

# Run tests
pytest .ai/tools/perplexity/tests/ -v --cov=perplexity
```

## Notes

- This integration is designed for AI agent tooling and development
- It does not affect the production SlideHeroes application
- All dependencies are Python-only and lightweight
- No database or infrastructure changes required
