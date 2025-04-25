/**
 * Shared types for UUID table management
 */

export interface UuidTable {
  name: string;
  schema: string;
  existsInDatabase: boolean;
  columns: ColumnInfo[];
}

export interface ColumnInfo {
  name: string;
  dataType: string;
  isNullable: boolean;
  exists: boolean;
}

export interface RepairOptions {
  addMissingColumns: boolean;
  createMonitoring: boolean;
  verifyAfterRepair: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface RepairResult {
  tablesScanned: number;
  tablesFixed: number;
  columnsAdded: { [tableName: string]: string[] };
  errors: { [tableName: string]: string };
  monitoringEnabled: boolean;
}
