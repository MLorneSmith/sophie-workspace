[![MseeP.ai Security Assessment Badge](https://camo.githubusercontent.com/c88c343e9da19b8d727e1b7becb466b44c8508784eeca139d91b5009e8ff3eef/68747470733a2f2f6d736565702e6e65742f70722f69766c61643030332d6d63702d6e657772656c69632d62616467652e706e67)](https://mseep.ai/app/ivlad003-mcp-newrelic)

# New Relic MCP Server

A simple Model Context Protocol (MCP) server for querying New Relic logs using NRQL queries. This server enables Large Language Models (LLMs) like Claude to interact with your New Relic data.

## Features

- Query New Relic logs and metrics using NRQL
- Detailed error logging
- Easy integration with Claude Desktop
- Human-readable output formatting
- Configurable New Relic account ID

## Setup Instructions

### Prerequisites

- Python 3.10 or higher
- New Relic account and API key
- Claude Desktop application

### Installation Steps

1. Install `uv` package manager:

```shell
# On macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# On Windows (PowerShell)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

2. Create and setup project:

```shell
# Create directory
mkdir newrelic-mcp
cd newrelic-mcp

# Create virtual environment
uv venv

# Activate virtual environment
source .venv/bin/activate  # On Unix/macOS
.venv\Scripts\activate     # On Windows

# Install dependencies
uv pip install "mcp[cli]" httpx
```

3. Create server file `newrelic_logs_server.py` with the provided code.

4. Configure your environment variables:

```shell
# On Unix/macOS
