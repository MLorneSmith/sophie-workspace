/**
 * SQL utilities for content migrations
 * Provides SQL templating and helper functions
 */
/**
 * SQL template literal tag for creating SQL queries
 * Allows for interpolation while protecting against injection
 *
 * @param {TemplateStringsArray} strings - Template literal string parts
 * @param {...any} values - Values to interpolate
 * @returns {SqlQuery} SQL query object
 */
export function sql(strings, ...values) {
    return {
        text: strings.reduce((result, str, i) => {
            const value = i < values.length ? formatValue(values[i]) : '';
            return result + str + value;
        }, ''),
        values: values.filter((val) => typeof val !== 'undefined'),
    };
}
/**
 * Format a value for use in a SQL query
 *
 * @param {any} value - Value to format
 * @returns {string} Formatted value
 */
function formatValue(value) {
    if (value === null) {
        return 'NULL';
    }
    if (Array.isArray(value)) {
        return `ARRAY[${value.map(formatValue).join(', ')}]`;
    }
    if (typeof value === 'object' && value !== null) {
        if ('type' in value && value.type === 'RAW') {
            return value.value;
        }
        if (value instanceof Date) {
            return `'${value.toISOString()}'`;
        }
        return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
    }
    if (typeof value === 'string') {
        return `'${value.replace(/'/g, "''")}'`;
    }
    if (typeof value === 'boolean') {
        return value ? 'TRUE' : 'FALSE';
    }
    return value.toString();
}
/**
 * Create a raw SQL fragment that won't be escaped
 *
 * @param {string} value - Raw SQL value
 * @returns {RawSql} Raw SQL object
 */
export function raw(value) {
    return {
        type: 'RAW',
        value,
    };
}
/**
 * Generate an INSERT SQL statement
 *
 * @param {string} table - Table name
 * @param {Record<string, any>} data - Data to insert
 * @returns {SqlQuery} SQL query object
 */
export function insert(table, data) {
    const columns = Object.keys(data);
    const values = columns.map((col) => data[col]);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    return {
        text: `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
        values,
    };
}
/**
 * Generate an UPDATE SQL statement
 *
 * @param {string} table - Table name
 * @param {Record<string, any>} data - Data to update
 * @param {string} condition - WHERE condition
 * @param {any[]} conditionValues - Values for the condition
 * @returns {SqlQuery} SQL query object
 */
export function update(table, data, condition, conditionValues = []) {
    const columns = Object.keys(data);
    const values = columns.map((col) => data[col]);
    const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
    return {
        text: `UPDATE ${table} SET ${setClause} WHERE ${condition}`,
        values: [...values, ...conditionValues],
    };
}
/**
 * Generate a SELECT SQL statement
 *
 * @param {string|string[]} columns - Columns to select
 * @param {string} table - Table name
 * @param {string} condition - WHERE condition (optional)
 * @param {any[]} values - Values for the condition (optional)
 * @returns {SqlQuery} SQL query object
 */
export function select(columns, table, condition = '', values = []) {
    const columnStr = Array.isArray(columns) ? columns.join(', ') : columns;
    const whereClause = condition ? ` WHERE ${condition}` : '';
    return {
        text: `SELECT ${columnStr} FROM ${table}${whereClause}`,
        values,
    };
}
