# Perplexity Research: Supabase CLI InBucket to Mailpit Transition

**Date**: 2025-11-28
**Agent**: perplexity-expert
**Search Type**: Search API + Chat API
**Context**: Investigation into whether Supabase CLI switched from InBucket to Mailpit for local email testing

## Query Summary

Researched whether Supabase CLI version 2.62.5 or recent versions have officially changed from InBucket to Mailpit for local email testing, to determine if the current setup using Mailpit (container: `public.ecr.aws/supabase/mailpit:v1.22.3`) is intentional from a recent Supabase update or a misconfiguration.

## Findings

### Official Transition Confirmed

**Yes, Supabase CLI has officially transitioned from InBucket to Mailpit** for local email testing. This is confirmed by multiple sources:

1. **Official Supabase Documentation** (current):
   - The latest Supabase CLI documentation explicitly states: "The Supabase CLI uses Mailpit to capture emails sent from your local machine."
   - Source: https://supabase.com/docs/guides/local-development/cli/testing-and-linting

2. **CLI Reference Documentation**:
   - The CLI reference now shows "Mailpit URL: http://127.0.0.1:54324" in the startup output
   - The `--exclude` flag for `supabase start` lists "mailpit" as one of the container names (not "inbucket")
   - Source: https://supabase.com/docs/reference/cli/introduction

3. **Community Documentation**:
   - MakerKit documentation states: "Supabase uses InBucket and Mailpit (depending on which version you're running)"
   - This confirms there was a version-dependent transition period
   - Source: https://makerkit.dev/docs/next-supabase-turbo/emails/inbucket

### Timeline Evidence

While the exact CLI version number for the transition was not found in the search results, evidence suggests the change occurred sometime in **early to mid-2025**:

1. **GitHub Pull Requests Found**:
   - PR #3609: "Update mailpit label for supabase status in terminal and other reference to inbucket" (opened May 25, 2025)
   - PR #3607: "Update default Mailpit SMTP port to 1025 and pop3 port to 1110" (opened May 25, 2025)
   - Both PRs by user "raucheacho" indicate cleanup work after the migration
   - Source: https://github.com/supabase/cli/pulls

2. **Container Image**:
   - Current Supabase CLI uses `public.ecr.aws/supabase/mailpit:v1.22.3`
   - This is the official Mailpit container hosted on Supabase's ECR repository

### Why Mailpit Over InBucket

Mailpit is a more modern and actively maintained email testing tool with advantages over InBucket:

- **Active Development**: Mailpit is actively maintained (as evidenced by v1.22.3 being used)
- **Modern UI**: More user-friendly web interface
- **Better Performance**: More efficient handling of email capture
- **Feature Parity**: Provides same core functionality (SMTP server + web UI)

### Configuration Details

**Default Ports**:
- Web UI: http://localhost:54324 (port 8025 in container, mapped to 54324)
- SMTP: Port 1025 (internal)
- POP3: Port 1110 (internal)

**Container Name**: 
- Container labeled as `supabase_inbucket_<project>` for backward compatibility
- But actually runs Mailpit image

**CLI Flags**:
- Can be excluded with: `supabase start --exclude mailpit`

## Sources & Citations

1. [Supabase Docs: Testing Auth Emails](https://supabase.com/docs/guides/local-development/cli/testing-and-linting) - Official documentation confirming Mailpit usage
2. [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction) - CLI startup output showing Mailpit URL
3. [GitHub: supabase/cli Pull Requests](https://github.com/supabase/cli/pulls) - PRs #3609 and #3607 for Mailpit label updates
4. [MakerKit: InBucket/Mailpit for Local Development](https://makerkit.dev/docs/next-supabase-turbo/emails/inbucket) - Community docs noting version-dependent usage
5. [Answer Overflow: Mailpit Docker Container](https://www.answeroverflow.com/m/1400530109273735358) - User discussion showing `public.ecr.aws/supabase/mailpit:v1.22.3`
6. [Webscope.io: Creating Email Workflow](https://www.webscope.io/blog/supabase-email-workflow) - Older article mentioning InBucket usage

## Key Takeaways

1. **Official Change**: Mailpit is now the official email testing tool for Supabase CLI (as of 2025)
2. **Your Setup is Correct**: Using `public.ecr.aws/supabase/mailpit:v1.22.3` is the current official configuration
3. **Backward Compatibility**: Container may still be named `supabase_inbucket_*` but runs Mailpit
4. **Documentation Updated**: Official Supabase docs have been updated to reference Mailpit exclusively
5. **Active Maintenance**: Mailpit is actively maintained with recent version updates (v1.22.3)

## Related Searches

- Specific CLI version number when migration occurred (not found in this research)
- Complete changelog entry for the InBucket → Mailpit migration
- Any breaking changes or configuration updates required for the migration

## Conclusion

**The current setup using Mailpit is correct and intentional**. Supabase CLI has officially migrated from InBucket to Mailpit for local email testing. The container image `public.ecr.aws/supabase/mailpit:v1.22.3` is the official email testing service for current Supabase CLI versions. This change appears to have been implemented in early-to-mid 2025 based on GitHub PR activity.
