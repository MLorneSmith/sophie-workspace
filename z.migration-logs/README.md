# Migration Logs

This directory contains logs from the database migration and seeding process.

## Log Types

Two types of log files are generated for each migration run:

1. **Transcript Logs (`migration-log-*.txt`)**

   - Contains the standard output captured by PowerShell's `Start-Transcript`
   - Shows the main steps and high-level results

2. **Detailed Logs (`migration-detailed-log-*.txt`)**
   - Contains detailed information about each command executed
   - Includes full command output (stdout and stderr)
   - Provides timestamps for each action
   - Useful for debugging issues

## Log File Naming

Log files are named with a timestamp in the format `yyyyMMdd-HHmmss` to make them easily sortable and identifiable:

- `migration-log-20250402-155606.txt`
- `migration-detailed-log-20250402-155606.txt`

## Using the Logs

When troubleshooting migration issues:

1. First check the transcript log for high-level errors
2. Then examine the detailed log for specific command outputs and error messages
3. Look for error patterns like "relation does not exist" or "DATABASE_URI environment variable is not set"

## Common Issues

- **"relation does not exist"**: Tables haven't been created by Payload migrations
- **"DATABASE_URI environment variable is not set"**: Environment variables not loaded correctly
- **Exit code errors**: Commands failed but didn't output clear error messages

## Log Analysis Tool

This directory includes a PowerShell script `analyze-logs.ps1` to help analyze migration logs:

```powershell
# Show summary of most recent log
.\analyze-logs.ps1

# Show only errors from most recent log
.\analyze-logs.ps1 -Errors

# Show everything from a specific log file
.\analyze-logs.ps1 -ListAll -LogFile migration-detailed-log-20250402-155606.txt
```

The script can extract:

- Errors and warnings
- Commands executed
- Success/failure status
- Timing information

## Retention Policy

Consider periodically archiving or removing old log files to prevent this directory from growing too large.
