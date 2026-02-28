declare module 'sql.js' {
  export type SqlValue = number | string | Uint8Array | null;
  export type BindParams = SqlValue[] | Record<string, SqlValue> | null;
  export type ParamsObject = Record<string, SqlValue>;

  export interface QueryExecResult {
    columns: string[];
    values: SqlValue[][];
  }

  export interface SqlJsConfig {
    locateFile?: (filename: string) => string;
    wasmBinary?: ArrayLike<number>;
  }

  export class Database {
    constructor(data?: ArrayLike<number> | Buffer | null);
    run(sql: string, params?: BindParams): Database;
    exec(sql: string, params?: BindParams): QueryExecResult[];
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
    getRowsModified(): number;
  }

  export class Statement {
    bind(params?: BindParams): boolean;
    step(): boolean;
    getAsObject(params?: BindParams): ParamsObject;
    free(): boolean;
    reset(): void;
  }

  export interface SqlJsStatic {
    Database: typeof Database;
    Statement: typeof Statement;
  }

  export default function initSqlJs(config?: SqlJsConfig): Promise<SqlJsStatic>;
}
