export type IOperator = "<" | ">" | ">=" | "<=" | "==" | "!=";

export interface IDataModel {
  /**
   * List fields that should be present in the app
   */
  Field?: string[];
  /**
   * List tables that should be present in the app
   */
  Table?: string[];
  /**
   * Are synthetic keys allowed in the data model
   */
  SyntheticKeys?: boolean;
  /**
   * List of fields that should have always one selected property
   */
  AlwaysOneSelected?: string[];
}

export interface Field {
  /**
   * Name of the field
   */
  name: string;
  /**
   * Count of cardinal/distinct values to compare with
   */
  count: number;
  /**
   * Comparison operator
   *
   * @default ==
   */
  operator?: IOperator;
}

export interface ITable {
  /**
   * Name of the data table
   */
  name: string;
  /**
   * Count of rows count to compare with
   */
  count: number;
  /**
   * Comparison operator
   *
   * @default ==
   */
  operator?: IOperator;
}

export interface IMetaVariable {
  Exists?: string[];
  DoNotExists?: string[];
}

export interface IMeta {
  DataModel?: IDataModel;
  Field?: Field[];
  Table?: ITable[];
  Variable?: IMetaVariable;
  /**
   * List of object id that should exists in the app
   */
  Object?: string[];
}

export interface Details {
  state: string;
}

export interface IScalar {
  /**
   * Name of the test
   */
  name: string;
  /**
   * Short description
   */
  description?: string;
  /**
   * Qlik expression
   */
  expression: string;
  /**
   * Value to compare
   *
   * Accept string, number or expression
   *
   * To be evaluated as expressions the values should start with =
   *
   * ```
   * result: 100
   * result: "abcd"
   * result: "=sum(100)"
   * ```
   */
  result: string | number;
  /**
   * TBA
   */
  operator: IOperator;
  // TODO: deviation/difference?
  // deviation?: string;
  details?: Details;
}

export interface IList {
  name: string;
  description?: string;
  values: string[];
}

export interface Measure {
  label: string;
  calculation: string;
}

export interface Result {
  Columns: string[];
  Rows: any[][];
}

export interface ITable2 {
  name: string;
  description?: string;
  dimensions: string[];
  // measures: Measure[];
  measures: string[];
  sort?: string[];
  result: Result;
}

// export interface IQObject {
//   id: string;
//   type: "sheet" | "visual";
// }

export type ISelection =
  | {
      /**
       * Clear all selections (perform `clearAll()`)
       */
      clearAll: boolean;
    }
  | {
      /**
       * Name of the field to select into
       */
      field: string;
      /**
       * List of values to select.
       *
       * Provide all values as string (even if the actual values are in number format)!
       *
       * If the selection should be applied via expression then start the value with "=". e.g.
       * ```
       * { values: ["=Only('Test')"] }
       * ```
       */
      values: string[];
    }
  | {
      /**
       * NAME of the bookmark to be applied
       */
      bookmark: string;
    }
  | {
      /**
       * Clear all selected values from provided fields list
       */
      clear: string[];
    };

export interface IData {
  /**
   * Unique name of the tests suite
   */
  Name: string;
  /**
   * Descriptions of the tests
   */
  Description?: string;
  /**
   * What selections to be applied BEFORE running the test
   *
   * Selections are applied one after another in order of appearance - first defined, fist selected
   */
  Selections?: ISelection[];
  /**
   * List of data tests
   */
  Tests?: {
    /**
     * Single expression
     * ```
     * sum(Sales) > 100;
     * sum(Sales) != 100;
     * ```
     */
    Scalar?: IScalar[];
    /**
     * Check for specific values presence in fields (and their state)
     */
    List?: IList[];
    /**
     * TBA
     */
    Table?: ITable2[];
  };
}

export interface Spec {
  Meta?: IMeta;
  Data: IData[];
}

// export enum IQState {
//   L = "Locked",
//   S = "Selected",
//   O = "Optional",
//   D = "Deselected",
//   A = "Alternative",
//   X = "eXcluded",
//   XS = "eXcluded Selected",
//   XL = "eXcluded Locked",
// }

export interface Root {
  /**
   * Author name
   */
  author?: string;
  /**
   * Short description
   */
  description?: string;
  // /**
  //  * What selections should be applied before running the tests
  //  */
  // selections?: ISelection[];
  // /**
  //  * Skip the current tests
  //  */
  // skip?: boolean;
  /**
   * The test specification
   */
  spec: Spec;
  /**
   * version number of the document (e.g. 1, 1.1, 0.1.0, 1.2.1 etc.)
   */
  version?: string;
}

export interface ITestResponse {
  name?: string;
  status?: boolean;
  message: string;
}

export interface IGroupResult {
  status: boolean;
  group: string;
  totalTests: number;
  failedTests: number;
  startTime: Date;
  endTime: Date;
  elapsedTime: number;
  testResults: ITestResponse[];
}

export interface IEventError {
  group: string;
  subGroup?: string;
  name: string;
  reason: string;
}

export interface IEventGroupStartEnd {
  group: string;
  message: string;
  isFinished: boolean;
  status: boolean;
  elapsedTime: number;
  totalTests: number;
  failedTests: number;
}
