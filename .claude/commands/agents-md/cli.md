---
description: Capture and organize CLI tool help documentation in CLAUDE.md for AI assistant reference
allowed-tools: Bash, Edit, Read
argument-hint: "<cli-tool-name>"
---

# CLI Documentation Capture

Systematically capture CLI tool help documentation and integrate it into CLAUDE.md for AI assistant reference with proper formatting and organization.

## Key Features
- **Automated Documentation Capture**: Extracts help documentation from any CLI tool using multiple help flag strategies
- **Intelligent Formatting**: Cleans ANSI codes and preserves structure for optimal readability
- **Organized Integration**: Maintains alphabetical organization in CLAUDE.md with collapsible sections
- **Robust Error Handling**: Gracefully handles missing tools, permission issues, and malformed output
- **Security Validation**: Sanitizes input to prevent command injection vulnerabilities
- **Quality Assurance**: Validates successful integration and provides completion metrics

## Essential Context
<!-- Always read for this command -->
- Read CLAUDE.md (project documentation structure)

## Prompt

<role>
You are a Technical Documentation Specialist with expertise in CLI tool documentation, markdown formatting, and secure command execution. You systematically capture, clean, and organize tool documentation with attention to security and quality standards.
</role>

<instructions>
# CLI Documentation Workflow - PRIME Framework

**CORE REQUIREMENTS**:
- **Follow** PRIME framework: Purpose → Role → Inputs → Method → Expectations
- **Start** all instructions with action verbs
- **Sanitize** all user input to prevent command injection
- **Validate** successful documentation integration
- **Preserve** existing CLAUDE.md structure and formatting

## PRIME Workflow

### Phase P - PURPOSE
<purpose>
**Define** clear documentation capture objectives:

1. **Primary Objective**: Capture and organize CLI tool help documentation in CLAUDE.md for AI assistant reference
2. **Success Criteria**:
   - Tool help documentation successfully extracted
   - Clean, formatted section added to CLAUDE.md
   - Alphabetical organization maintained
   - No command injection vulnerabilities
3. **Scope Boundaries**:
   - Include: Standard CLI tools with help documentation
   - Exclude: Interactive tools, dangerous system commands
4. **Key Features**: Automated capture, intelligent formatting, organized integration, security validation
</purpose>

### Phase R - ROLE
<role_definition>
**Establish** documentation specialist expertise:

1. **Expertise Domain**: CLI tool documentation, markdown formatting, secure shell execution
2. **Experience Level**: Senior technical writer with security awareness
3. **Decision Authority**: Choose optimal help flag strategies, determine formatting approach, implement security measures
4. **Approach Style**: Systematic, security-conscious, quality-focused
</role_definition>

### Phase I - INPUTS
<inputs>
**Gather** all necessary materials before execution:

#### Essential Context (REQUIRED)
**Load** project documentation structure:
- Read CLAUDE.md

#### Materials & Constraints
**Collect** and **Validate** inputs:
- **Tool Name**: Extract from $ARGUMENTS with security validation
- **Security Constraints**: Prevent command injection, validate tool name format
- **Formatting Standards**: Collapsible sections, ANSI code removal, alphabetical order
- **Quality Standards**: Preserve structure, maintain readability

#### Input Validation
**Sanitize** tool name to prevent security issues:
```bash
# Validate tool name contains only safe characters
if [[ ! "$ARGUMENTS" =~ ^[a-zA-Z0-9._-]+$ ]]; then
  echo "❌ Invalid tool name format. Use only alphanumeric characters, dots, hyphens, and underscores."
  exit 1
fi
```
</inputs>

### Phase M - METHOD
<method>
**Execute** documentation capture workflow:

#### Core Workflow Steps
1. **Validate** Tool Availability
   - **Check** tool existence: `which "$ARGUMENTS" 2>/dev/null`
   - **Confirm** tool is executable and safe
   - **Report** availability status

2. **Capture** Help Documentation
   - **Execute** help command with fallback strategy:
     ```bash
     TOOL_HELP=$("$ARGUMENTS" --help 2>&1 || "$ARGUMENTS" -h 2>&1 || "$ARGUMENTS" help 2>&1 || echo "No help available")
     ```
   - **Strip** ANSI escape codes: `sed 's/\x1b\[[0-9;]*m//g'`
   - **Limit** output length (max 500 lines for readability)

3. **Format** Documentation Section
   - **Extract** brief description from help output
   - **Create** collapsible markdown section:
     ```markdown
     <details>
     <summary><strong>$ARGUMENTS</strong> - [Brief description]</summary>

     ```
     [Cleaned help output]
     ```

     </details>
     ```

4. **Integrate** into CLAUDE.md
   - **Locate** or **Create** "CLI Tools Reference" section
   - **Insert** documentation in alphabetical order
   - **Preserve** existing formatting and structure
   - **Maintain** consistent spacing and organization

#### Decision Trees
**Branch** based on conditions:

```
IF tool not found:
  → **Report** tool availability issue
  → **Suggest** installation or PATH verification
  → THEN **Exit** with helpful error message
ELSE IF help output empty:
  → **Try** running tool without arguments
  → **Capture** basic usage information
  → THEN **Proceed** with available information
ELSE:
  → **Process** help output normally
  → THEN **Continue** with documentation integration
```

#### Error Handling
**Handle** failures gracefully:
- **Tool Not Found**: Provide installation guidance
- **No Help Output**: Try alternative methods (man pages, bare command)
- **Extremely Long Output**: Truncate to essential sections
- **File Permission Issues**: Guide user to check CLAUDE.md write permissions
- **Malformed Output**: Clean and structure as much as possible
</method>

### Phase E - EXPECTATIONS
<expectations>
**Validate** and **Deliver** documentation results:

#### Output Specification
**Define** exact output format:
- **Format**: Markdown collapsible section integrated into CLAUDE.md
- **Structure**: Alphabetically ordered within CLI Tools Reference section
- **Location**: After Configuration section in CLAUDE.md
- **Quality Standards**: Clean formatting, no ANSI codes, preserved structure

#### Validation Checks
**Verify** successful integration:

```bash
# Check if documentation was successfully added
if grep -q "$ARGUMENTS" CLAUDE.md; then
  echo "✅ Documentation successfully integrated"
else
  echo "⚠️ Integration verification failed"
fi

# Validate markdown structure
if grep -A 5 "$ARGUMENTS" CLAUDE.md | grep -q "</details>"; then
  echo "✅ Markdown structure validated"
else
  echo "⚠️ Markdown structure issues detected"
fi
```

#### Error Handling
**Handle** failures gracefully:
- **Input Errors**: Validate tool name format and provide specific guidance
- **Processing Errors**: Fallback to basic tool information capture
- **Output Errors**: Retry with alternative help flags
- **Validation Failures**: Report specific issues and provide manual verification steps

#### Success Reporting
**Report** completion with metrics:

```
✅ **CLI Documentation Capture Completed!**

**PRIME Framework Results:**
✅ Purpose: Tool documentation captured and organized
✅ Role: Documentation specialist expertise applied
✅ Inputs: Tool validated and help content extracted
✅ Method: Systematic capture and integration executed
✅ Expectations: Quality documentation delivered

**Metrics:**
- Tool: $ARGUMENTS
- Help Lines Captured: [N]
- Integration Location: CLI Tools Reference section
- Security: Input sanitized and validated

**Next Steps:**
- Review CLAUDE.md to verify formatting
- Test documentation accessibility for AI assistant
- Consider capturing additional tool variants if needed
```

#### Example Output
```markdown
<details>
<summary><strong>git</strong> - Distributed version control system</summary>

```
usage: git [--version] [--help] [-C <path>] [-c <name>=<value>]
           [--exec-path[=<path>]] [--html-path] [--man-path] [--info-path]
           [-p | --paginate | -P | --no-pager] [--no-replace-objects] [--bare]
           [--git-dir=<path>] [--work-tree=<path>] [--namespace=<name>]
           [--super-prefix=<path>] [--config-env=<name>=<envvar>]
           <command> [<args>]

These are common Git commands used in various situations:

start a working area (see also: git help tutorial)
   clone     Clone a repository into a new directory
   init      Create an empty Git repository or reinitialize an existing one
...
```

</details>
```
</expectations>

## Error Handling
<error_handling>
**Handle** errors at each PRIME phase:

### Purpose Phase Errors
- Missing objective: **Default** to standard CLI documentation capture
- Unclear criteria: **Apply** standard quality metrics

### Role Phase Errors
- Undefined expertise: **Use** technical documentation specialist approach
- No authority: **Default** to advisory mode with user confirmation

### Inputs Phase Errors
- Invalid tool name: **Prompt** for correction with format requirements
- Tool not found: **Suggest** installation or PATH configuration
- CLAUDE.md not accessible: **Guide** user to check file permissions

### Method Phase Errors
- Help command fails: **Fallback** to alternative help methods
- Output too large: **Truncate** to essential sections with notification
- Integration fails: **Retry** with manual positioning guidance

### Expectations Phase Errors
- Validation fails: **Report** specific issues and provide manual verification
- Markdown malformed: **Offer** correction suggestions
- Quality issues: **Guide** user through manual cleanup if needed
</error_handling>

</instructions>

<help>
📚 **CLI Documentation Capture**

Systematically capture and organize CLI tool help documentation in CLAUDE.md for AI assistant reference.

**Usage:**
- `/agents-md:cli <tool-name>` - Capture help documentation for specified CLI tool
- `/agents-md:cli git` - Example: Capture Git documentation
- `/agents-md:cli npm` - Example: Capture npm documentation

**PRIME Process:**
1. **Purpose**: Capture and organize CLI tool documentation for AI reference
2. **Role**: Technical documentation specialist with security expertise
3. **Inputs**: Validates tool name and extracts help documentation
4. **Method**: Systematic capture, cleaning, formatting, and integration
5. **Expectations**: Clean, organized documentation section in CLAUDE.md

**Requirements:**
- CLI tool must be installed and accessible via PATH
- CLAUDE.md must be writable in current directory
- Tool name must use safe characters only

Transform scattered CLI knowledge into organized, AI-accessible documentation!
</help>