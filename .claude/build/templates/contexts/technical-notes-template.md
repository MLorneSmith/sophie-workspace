# Technical Notes: {{STORY_TITLE}}

## Architecture Overview

### System Design

{{HIGH_LEVEL_ARCHITECTURE_APPROACH}}

### Component Architecture

{{COMPONENT_STRUCTURE_AND_RELATIONSHIPS}}

### Data Flow

{{DATA_FLOW_THROUGH_SYSTEM}}

### Integration Points

{{EXTERNAL_SYSTEM_INTEGRATIONS}}

## Technical Approach

### Implementation Strategy

{{CHOSEN_TECHNICAL_APPROACH}}

### Design Patterns Used

- **{{PATTERN_NAME}}**: {{PATTERN_DESCRIPTION_AND_RATIONALE}}

### SlideHeroes Patterns Applied

- **{{SLIDEHEROES_PATTERN}}**: {{HOW_PATTERN_APPLIED}}

### Technology Choices

- **Frontend**: {{FRONTEND_TECH_DECISIONS}}
- **Backend**: {{BACKEND_TECH_DECISIONS}}
- **Database**: {{DATABASE_TECH_DECISIONS}}
- **AI Integration**: {{AI_TECH_DECISIONS}}

## Implementation Details

### Key Components

#### {{COMPONENT_NAME}}

- **Purpose**: {{COMPONENT_FUNCTION}}
- **Location**: `{{FILE_PATH}}`
- **Dependencies**: {{COMPONENT_DEPENDENCIES}}
- **Interface**: {{PUBLIC_API_DESCRIPTION}}
- **Implementation Notes**: {{TECHNICAL_DETAILS}}

### Database Schema Changes

#### {{TABLE_NAME}}

```sql
{{SCHEMA_DEFINITION}}
```

- **Purpose**: {{TABLE_PURPOSE}}
- **Relationships**: {{FOREIGN_KEY_RELATIONSHIPS}}
- **Indexes**: {{INDEX_DEFINITIONS}}
- **RLS Policies**: {{SECURITY_POLICIES}}

### API Design

#### {{ENDPOINT_NAME}}

- **Path**: `{{API_PATH}}`
- **Method**: {{HTTP_METHOD}}
- **Input Schema**: {{INPUT_VALIDATION}}
- **Output Format**: {{RESPONSE_FORMAT}}
- **Error Handling**: {{ERROR_SCENARIOS}}

### Server Actions

#### {{ACTION_NAME}}

```typescript
{
  {
    ACTION_SIGNATURE;
  }
}
```

- **Purpose**: {{ACTION_FUNCTION}}
- **Validation**: {{ZOD_SCHEMA_REFERENCE}}
- **Security**: {{RLS_AND_AUTH_CHECKS}}
- **Error Handling**: {{ERROR_HANDLING_STRATEGY}}

## SlideHeroes Integration

### Existing System Integration

{{HOW_FEATURE_INTEGRATES_WITH_EXISTING}}

### Component Reuse

- **Reused Components**: {{EXISTING_COMPONENTS_USED}}
- **New Components**: {{NEW_COMPONENTS_CREATED}}
- **Modified Components**: {{EXISTING_COMPONENTS_MODIFIED}}

### Data Model Integration

{{HOW_DATA_MODELS_INTEGRATE}}

### AI Integration (if applicable)

- **Portkey Configuration**: {{AI_GATEWAY_SETUP}}
- **Prompt Strategy**: {{PROMPT_ENGINEERING_NOTES}}
- **Usage Tracking**: {{BILLING_INTEGRATION}}
- **Error Handling**: {{AI_FAILURE_SCENARIOS}}

## Security Considerations

### Authentication & Authorization

{{AUTH_REQUIREMENTS_AND_IMPLEMENTATION}}

### Row Level Security

{{RLS_POLICIES_AND_RATIONALE}}

### Data Validation

{{INPUT_VALIDATION_STRATEGY}}

### API Security

{{API_SECURITY_MEASURES}}

## Performance Considerations

### Query Optimization

{{DATABASE_PERFORMANCE_NOTES}}

### Frontend Performance

{{UI_PERFORMANCE_OPTIMIZATIONS}}

### Caching Strategy

{{CACHING_APPROACH_IF_APPLICABLE}}

### AI Performance (if applicable)

{{AI_REQUEST_OPTIMIZATION}}

## Testing Strategy

### Unit Testing

- **Test Files**: {{TEST_FILE_LOCATIONS}}
- **Coverage Goals**: {{COVERAGE_TARGETS}}
- **Mock Strategy**: {{MOCKING_APPROACH}}

### Integration Testing

- **Test Scenarios**: {{INTEGRATION_TEST_CASES}}
- **Data Setup**: {{TEST_DATA_REQUIREMENTS}}
- **Environment**: {{TEST_ENVIRONMENT_NEEDS}}

### E2E Testing

- **User Flows**: {{CRITICAL_USER_PATHS}}
- **Test Tools**: {{E2E_TESTING_TOOLS}}

## Error Handling

### Error Categories

- **Validation Errors**: {{INPUT_VALIDATION_ERRORS}}
- **Business Logic Errors**: {{BUSINESS_RULE_VIOLATIONS}}
- **System Errors**: {{INFRASTRUCTURE_FAILURES}}
- **AI Errors**: {{AI_SERVICE_FAILURES}}

### Error Response Strategy

{{ERROR_MESSAGE_AND_RECOVERY_STRATEGY}}

### User Experience

{{ERROR_STATE_UI_AND_MESSAGING}}

## Configuration

### Environment Variables

```
{{REQUIRED_ENV_VARS}}
```

### Feature Flags

{{FEATURE_FLAG_CONFIGURATION}}

### Third-Party Services

{{EXTERNAL_SERVICE_CONFIGURATION}}

## Deployment Considerations

### Database Migrations

{{MIGRATION_STRATEGY_AND_SCRIPTS}}

### Environment Updates

{{PRODUCTION_DEPLOYMENT_REQUIREMENTS}}

### Monitoring

{{MONITORING_AND_ALERTING_SETUP}}

## Known Limitations

### Current Constraints

{{TECHNICAL_LIMITATIONS}}

### Future Improvements

{{PLANNED_ENHANCEMENTS}}

### Technical Debt

{{DEBT_INCURRED_AND_REPAYMENT_PLAN}}

## References

### Documentation

- {{RELEVANT_DOCUMENTATION_LINKS}}

### Similar Implementations

- **{{FEATURE_NAME}}**: `{{FILE_PATH}}` - {{SIMILARITY_NOTES}}

### External Resources

- {{EXTERNAL_API_DOCS}}
- {{LIBRARY_DOCUMENTATION}}
- {{TECHNICAL_ARTICLES}}

---

**Created**: {{CREATION_DATE}}
**Last Updated**: {{LAST_UPDATE_DATE}}
**Technical Lead**: {{DEVELOPER_NAME}}
**Review Status**: {{REVIEW_STATUS}}
