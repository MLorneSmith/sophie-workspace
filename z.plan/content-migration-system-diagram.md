# Content Migration System Architecture

The following diagram illustrates the architecture and data flow of the content migration system.

```mermaid
flowchart TD
    %% Main phases
    subgraph Setup["1. SETUP PHASE"]
        ResetDB["Reset Supabase Database"]
        InitSchema["Initialize Schema"]
        PayloadMigrations["Apply Payload Migrations"]
    end

    subgraph Processing["2. PROCESSING PHASE"]
        RawData["Raw Data\n(YAML, Markdown, HTML)"]
        ProcessRaw["Process Raw Data"]
        GenerateSQL["Generate SQL Files"]
        ValidateData["Validate Processed Data"]
    end

    subgraph Loading["3. LOADING PHASE"]
        ExecuteSQL["Execute SQL Seed Files"]
        MigrateContent["Migrate Complex Content"]
        ImportDownloads["Import Downloads"]
        FixRelationships["Fix Relationships"]
    end

    subgraph Verification["4. VERIFICATION PHASE"]
        VerifyContent["Verify Content Integrity"]
        VerifyRelationships["Verify Relationships"]
        VerifySchema["Verify Schema Structure"]
    end

    %% Data stores
    subgraph DataStores["Data Stores"]
        RawContent["Raw Content Directory"]
        ProcessedContent["Processed Content Directory"]
        SQLFiles["SQL Seed Files"]
        Database["PostgreSQL Database"]
        R2Storage["R2 Storage Bucket"]
    end

    %% Utility modules
    subgraph Utilities["Utility Modules"]
        DBUtils["Database Utilities"]
        FileUtils["File System Utilities"]
        PayloadUtils["Payload CMS Utilities"]
    end

    %% Connections - Setup Phase
    ResetDB --> InitSchema
    InitSchema --> PayloadMigrations

    %% Connections - Processing Phase
    RawContent --> RawData
    RawData --> ProcessRaw
    ProcessRaw --> ProcessedContent
    ProcessedContent --> GenerateSQL
    GenerateSQL --> SQLFiles
    ProcessedContent --> ValidateData

    %% Connections - Loading Phase
    SQLFiles --> ExecuteSQL
    ExecuteSQL --> Database
    ProcessedContent --> MigrateContent
    MigrateContent --> Database
    R2Storage --> ImportDownloads
    ImportDownloads --> Database
    Database --> FixRelationships
    FixRelationships --> Database

    %% Connections - Verification Phase
    Database --> VerifyContent
    Database --> VerifyRelationships
    Database --> VerifySchema

    %% Utility connections
    DBUtils -.-> ExecuteSQL
    DBUtils -.-> MigrateContent
    DBUtils -.-> FixRelationships
    DBUtils -.-> VerifyContent
    DBUtils -.-> VerifyRelationships
    DBUtils -.-> VerifySchema

    FileUtils -.-> ProcessRaw
    FileUtils -.-> GenerateSQL
    FileUtils -.-> ExecuteSQL

    PayloadUtils -.-> MigrateContent
    PayloadUtils -.-> ImportDownloads
    PayloadUtils -.-> FixRelationships

    %% Phase connections
    Setup --> Processing
    Processing --> Loading
    Loading --> Verification

    %% Add style
    classDef phase fill:#f9f9f9,stroke:#333,stroke-width:2px;
    classDef store fill:#e1f5fe,stroke:#0288d1,stroke-width:1px;
    classDef util fill:#f1f8e9,stroke:#558b2f,stroke-width:1px;
    classDef process fill:#fff8e1,stroke:#ffa000,stroke-width:1px;

    class Setup,Processing,Loading,Verification phase;
    class DataStores,RawContent,ProcessedContent,SQLFiles,Database,R2Storage store;
    class Utilities,DBUtils,FileUtils,PayloadUtils util;
    class ResetDB,InitSchema,PayloadMigrations,ProcessRaw,GenerateSQL,ValidateData,ExecuteSQL,MigrateContent,ImportDownloads,FixRelationships,VerifyContent,VerifyRelationships,VerifySchema process;
```

## Key Components

### Data Stores

- **Raw Content Directory**: Contains original content in various formats (Markdown, YAML, HTML)
- **Processed Content Directory**: Contains transformed content ready for database import
- **SQL Seed Files**: Generated SQL files that populate the database
- **PostgreSQL Database**: The Payload CMS database with all content tables
- **R2 Storage Bucket**: External storage for downloadable files

### Utility Modules

- **Database Utilities**: Functions for executing SQL and managing database connections
- **File System Utilities**: Functions for reading and writing files
- **Payload CMS Utilities**: Functions for interacting with the Payload CMS API

### Main Process Phases

1. **Setup Phase**: Prepares the database environment
2. **Processing Phase**: Transforms raw content into a format suitable for import
3. **Loading Phase**: Populates the database with content
4. **Verification Phase**: Ensures content integrity and relationships

## Data Flow

1. Raw content is processed into structured formats
2. SQL seed files are generated from processed content
3. SQL seed files are executed to populate the database
4. Complex content is migrated using direct API calls
5. Relationships between content items are established
6. Content integrity is verified
