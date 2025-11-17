# Claude Code Settings Configuration

## Security Architecture

This directory contains split configuration files to address security concern ISSUE-310.
The configuration is separated by concern to reduce security risks and improve maintainability.

## Configuration Files

### Core Settings (Version Controlled)

- `mcp.json` - MCP server configurations (non-sensitive)
- `environment.json` - Default environment variables (non-sensitive)

### Sensitive Settings (Git Ignored)

- `permissions.json` - Security permissions and access controls
- `secrets.json` - API keys and tokens (if needed)

## Security Measures

1. **Separation of Concerns**: Sensitive and non-sensitive settings are isolated
2. **Git Ignore**: Sensitive files are excluded from version control
3. **Template Files**: Example configurations provided for team setup
4. **Build Process**: Automated merging maintains compatibility

## Usage

### Initial Setup

```bash
# Copy templates to create your local configuration
cp permissions.example.json permissions.json
cp environment.example.json environment.json

# Build the merged configuration
node ..scripts/build-settings.js
```

### Security Best Practices

1. **Never commit** `permissions.json` or any file containing sensitive data
2. **Use environment variables** for API keys and tokens when possible
3. **Review permissions** regularly to ensure least privilege access
4. **Audit changes** to permission patterns before deployment

## Configuration Hierarchy

```
.claude/
├── settings.json           # Global settings (version controlled)
├── settings.local.json     # Generated merged file (git ignored)
└── settings/
    ├── README.md           # This file
    ├── permissions.json    # Security settings (git ignored)
    ├── environment.json    # Environment variables (git ignored)
    └── mcp.json           # MCP configurations (can be shared)
```

## Security Benefits

- **Reduced Blast Radius**: Compromise of one file doesn't expose all settings
- **Granular Access Control**: Different files can have different permissions
- **Version Control Safety**: Non-sensitive configs can be safely shared
- **Audit Trail**: Changes to security settings are isolated and trackable

## Migration from Monolithic Configuration

If migrating from a single `settings.local.json`:

1. Run the build script to generate split files
2. Review and validate each generated file
3. Remove sensitive data from version control history if needed
4. Update team documentation with new setup process

## Troubleshooting

If Claude Code doesn't recognize settings:

1. Ensure `settings.local.json` exists (run build script)
2. Verify JSON syntax in all configuration files
3. Check file permissions are readable by Claude Code
4. Review logs for configuration loading errors
