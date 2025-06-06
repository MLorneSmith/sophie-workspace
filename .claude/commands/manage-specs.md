# Manage Specifications Command

Usage: `/manage-specs [action] [spec_name]`

This command helps manage feature specifications through their lifecycle from draft to approved to archived.

## Available Actions

### List Specifications
```
/manage-specs list
/manage-specs list draft
/manage-specs list approved  
/manage-specs list archived
```

### Move Specifications
```
/manage-specs approve [spec_name]     # draft → approved
/manage-specs archive [spec_name]     # approved → archived
/manage-specs draft [spec_name]       # approved → draft (rollback)
```

### Status Check
```
/manage-specs status [spec_name]      # Find spec location and show status
/manage-specs status                  # Show all specs with status
```

## Command Implementation

### 1. Parse Action and Spec Name
```typescript
const action = commandArgs[0];
const specName = commandArgs[1];

if (!action) {
  console.log("Usage: /manage-specs [action] [spec_name]");
  console.log("Actions: list, approve, archive, draft, status");
  return;
}
```

### 2. List Specifications
```typescript
async function listSpecs(folder = 'all') {
  const folders = folder === 'all' ? ['draft', 'approved', 'archived'] : [folder];
  
  for (const folderName of folders) {
    console.log(`\n📁 ${folderName.toUpperCase()} SPECS:`);
    
    try {
      const specs = await LS({
        path: `/home/msmith/projects/2025slideheroes/.claude/specs/features/${folderName}`
      });
      
      if (specs.length === 0) {
        console.log("  (no specs found)");
      } else {
        specs.forEach(spec => {
          if (spec.endsWith('.md')) {
            const name = spec.replace('.md', '');
            console.log(`  - ${name}`);
          }
        });
      }
    } catch (error) {
      console.log(`  (folder not found)`);
    }
  }
}
```

### 3. Move Specifications
```typescript
async function moveSpec(specName, fromFolder, toFolder, actionName) {
  const fromPath = `.claude/specs/features/${fromFolder}/${specName}.md`;
  const toPath = `.claude/specs/features/${toFolder}/${specName}.md`;
  
  // Check if source file exists
  try {
    await Read({ file_path: fromPath });
  } catch (error) {
    console.log(`❌ Spec '${specName}' not found in ${fromFolder}/`);
    console.log(`\n💡 Available specs in ${fromFolder}/:`);
    await listSpecs(fromFolder);
    return;
  }
  
  // Create destination directory if needed
  await Bash({
    command: `mkdir -p .claude/specs/features/${toFolder}`,
    description: `Create ${toFolder} directory`
  });
  
  // Move the file
  await Bash({
    command: `mv "${fromPath}" "${toPath}"`,
    description: `${actionName} ${specName}`
  });
  
  // Update status in the spec file
  await updateSpecStatus(toPath, getStatusFromFolder(toFolder));
  
  console.log(`✅ Successfully ${actionName.toLowerCase()}d '${specName}'`);
  console.log(`📁 Moved from ${fromFolder}/ to ${toFolder}/`);
}

function getStatusFromFolder(folder) {
  const statusMap = {
    'draft': 'Draft',
    'approved': 'Approved', 
    'archived': 'Archived'
  };
  return statusMap[folder] || 'Unknown';
}

async function updateSpecStatus(filePath, newStatus) {
  try {
    const content = await Read({ file_path: filePath });
    const updatedContent = content.replace(
      /(\| \*\*Status\*\* \| `)[^`]+(`)/,
      `$1${newStatus}$2`
    );
    
    await Write({ 
      file_path: filePath, 
      content: updatedContent 
    });
  } catch (error) {
    console.log(`⚠️ Could not update status field in spec file`);
  }
}
```

### 4. Approve Specification
```typescript
async function approveSpec(specName) {
  console.log(`🔍 Approving spec: ${specName}`);
  
  // Check if spec is ready for approval
  const draftPath = `.claude/specs/features/draft/${specName}.md`;
  
  try {
    const content = await Read({ file_path: draftPath });
    
    // Basic validation
    const hasUserStories = content.includes('## User Experience Specifications');
    const hasTechnicalSpecs = content.includes('## Technical Specifications');
    const hasSecuritySpecs = content.includes('## Security & Compliance');
    
    if (!hasUserStories || !hasTechnicalSpecs || !hasSecuritySpecs) {
      console.log(`⚠️ Spec appears incomplete. Missing sections:`);
      if (!hasUserStories) console.log(`  - User Experience Specifications`);
      if (!hasTechnicalSpecs) console.log(`  - Technical Specifications`);
      if (!hasSecuritySpecs) console.log(`  - Security & Compliance`);
      
      const proceed = confirm(`Continue with approval anyway?`);
      if (!proceed) return;
    }
    
    await moveSpec(specName, 'draft', 'approved', 'Approved');
    
    console.log(`\n🚀 Next steps:`);
    console.log(`1. Review the approved spec one final time`);
    console.log(`2. Run: /build-feature ${specName}`);
    
  } catch (error) {
    console.log(`❌ Draft spec '${specName}' not found`);
    await listSpecs('draft');
  }
}
```

### 5. Archive Specification
```typescript
async function archiveSpec(specName) {
  console.log(`📦 Archiving spec: ${specName}`);
  
  await moveSpec(specName, 'approved', 'archived', 'Archived');
  
  console.log(`\n✅ Spec archived successfully`);
  console.log(`💡 The spec is now stored for reference and lessons learned`);
}
```

### 6. Check Specification Status
```typescript
async function checkStatus(specName) {
  if (!specName) {
    // Show all specs with status
    await listSpecs('all');
    return;
  }
  
  const folders = ['draft', 'approved', 'archived'];
  let found = false;
  
  for (const folder of folders) {
    const path = `.claude/specs/features/${folder}/${specName}.md`;
    
    try {
      const content = await Read({ file_path: path });
      found = true;
      
      console.log(`📍 SPEC LOCATION: ${folder}/`);
      console.log(`📄 File: ${path}`);
      
      // Extract metadata from spec
      const statusMatch = content.match(/\| \*\*Status\*\* \| `([^`]+)`/);
      const authorMatch = content.match(/\| \*\*Author\(s\)\*\* \| `([^`]+)`/);
      const versionMatch = content.match(/\| \*\*Document Version\*\* \| `([^`]+)`/);
      
      if (statusMatch) console.log(`📊 Status: ${statusMatch[1]}`);
      if (authorMatch) console.log(`👤 Author: ${authorMatch[1]}`);
      if (versionMatch) console.log(`🔢 Version: ${versionMatch[1]}`);
      
      // Show next actions
      console.log(`\n🎯 NEXT ACTIONS:`);
      if (folder === 'draft') {
        console.log(`  - Review and refine spec`);
        console.log(`  - Run: /manage-specs approve ${specName}`);
      } else if (folder === 'approved') {
        console.log(`  - Run: /build-feature ${specName}`);
        console.log(`  - Or archive when complete: /manage-specs archive ${specName}`);
      } else if (folder === 'archived') {
        console.log(`  - Spec is complete and archived`);
        console.log(`  - Available for reference`);
      }
      
      break;
    } catch (error) {
      // File doesn't exist in this folder, continue checking
    }
  }
  
  if (!found) {
    console.log(`❌ Spec '${specName}' not found in any folder`);
    console.log(`\n💡 To create a new spec:`);
    console.log(`/write-feature-spec ${specName}`);
  }
}
```

### 7. Main Command Router
```typescript
switch (action.toLowerCase()) {
  case 'list':
    await listSpecs(specName);
    break;
    
  case 'approve':
    if (!specName) {
      console.log("Usage: /manage-specs approve [spec_name]");
      await listSpecs('draft');
      return;
    }
    await approveSpec(specName);
    break;
    
  case 'archive':
    if (!specName) {
      console.log("Usage: /manage-specs archive [spec_name]");
      await listSpecs('approved');
      return;
    }
    await archiveSpec(specName);
    break;
    
  case 'draft':
    if (!specName) {
      console.log("Usage: /manage-specs draft [spec_name]");
      await listSpecs('approved');
      return;
    }
    await moveSpec(specName, 'approved', 'draft', 'Moved to draft');
    break;
    
  case 'status':
    await checkStatus(specName);
    break;
    
  default:
    console.log(`❌ Unknown action: ${action}`);
    console.log("Available actions: list, approve, archive, draft, status");
}
```

## Usage Examples

### Daily Workflow
```bash
# See what specs are available
/manage-specs list

# Check status of a specific spec
/manage-specs status user-onboarding

# Approve a draft spec for implementation
/manage-specs approve user-onboarding

# Archive a completed spec
/manage-specs archive user-authentication
```

### Quick Status Check
```bash
# See all specs across all folders
/manage-specs status

# List only draft specs
/manage-specs list draft
```

## Integration with Other Commands

### With write-feature-spec
1. `/write-feature-spec feature-name` creates spec in `draft/`
2. `/manage-specs approve feature-name` moves to `approved/`
3. `/build-feature feature-name` implements from `approved/`

### Quality Gates
- **Draft**: Basic requirements captured
- **Approved**: Ready for implementation (validated)
- **Archived**: Implementation complete

## Error Handling

### File Not Found
```
❌ Spec 'user-dashboard' not found in approved/

💡 Available specs in approved/:
  - user-authentication-flow
  - presentation-builder

📝 Available specs in draft/:
  - user-dashboard (found here - run: /manage-specs approve user-dashboard)
```

### Incomplete Spec
```
⚠️ Spec appears incomplete. Missing sections:
  - Technical Specifications
  - Security & Compliance

Continue with approval anyway? (y/n)
```

## Best Practices

### For Spec Management
- Keep draft specs under active development
- Only approve specs that are implementation-ready
- Archive specs promptly after implementation
- Use descriptive spec names

### For Team Workflow
- Regular review of draft specs
- Clear approval criteria
- Prompt archival of completed work
- Use status command for team visibility