# Column check utility functions

function Column-Exists {
    param (
        [string]$schema,
        [string]$table,
        [string]$column
    )

    $result = Invoke-RemoteSql "
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = '$schema'
        AND table_name = '$table'
        AND column_name = '$column'
    );"

    return $result -match "t"
}

function Safe-Fix-Lexical-Format {
    param (
        [string]$collection,
        [string]$field = "content"
    )

    if (Column-Exists -schema "payload" -table $collection -column $field) {
        Log-Message "Fixing Lexical format for $collection.$field" "Yellow"
        Exec-Command -command "pnpm --filter @kit/content-migrations run fix:lexical-format -- --collection $collection --field $field" -description "Fixing Lexical format"
    } else {
        Log-Warning "Column $field does not exist in payload.$collection, skipping Lexical format fix"
    }
}
