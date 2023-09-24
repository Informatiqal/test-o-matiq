export type IScalarOperator =
  | "<"
  | ">"
  | ">="
  | "<="
  | "=="
  | "!="
  | "="
  | "<>";

export type IListOperator = "present" | "missing";

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
  operator?: IScalarOperator;
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
  operator?: IScalarOperator;
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
  /**
   * List of data connections that should exists
   */
  DataConnections?: string[];
}

export interface ScalarOptions {
  /**
   * What is the allowed tolerance/deviation between the expression and the result.
   *
   * Even when "operator" property is "=" the tolerance will be respected.
   *
   * For example: +- 100, +- 5%, 20%, -3%
   */
  tolerance?: string;
  /**
   * What format to be applied for the expression or the result before comparison is made
   *
   * This section is optional. Formatting can be applied directly to the expression and result code
   */
  // formatting?: {
  //   expression?: string;
  //   result?: string;
  // };
}

export interface TableOptions {
  blah: string;
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
  result?: string | number;
  /**
   * TBA
   */
  operator: IScalarOperator;
  // TODO: deviation/difference?
  // deviation?: string;
}

export interface IList {
  name: string;
  description?: string;
  values: string[];
  operation: IListOperator;
}

export interface Measure {
  label: string;
  calculation: string;
}

export interface Result {
  // columns: string[];
  // rows: any[][];
}

export interface ITableTestCase {
  dimensions: string[];
  // measures: Measure[];
  measures: string[];
  result: any[][];
  // options?: {
  // sort?: string[];
  // };
}

export type ISelection =
  | {
      /**
       * Clear all selections (perform `clearAll()`)
       */
      clearAll: boolean;
      field?: undefined;
      values?: undefined;
      bookmark?: undefined;
      byName?: undefined;
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
      values: (string | number)[];
      clearAll?: undefined;
      bookmark?: undefined;
      byName?: undefined;
    }
  | {
      /**
       * NAME of the bookmark to be applied
       */
      bookmark: string;
      clearAll?: undefined;
      field?: undefined;
      values?: undefined;
      byName?: undefined;
    }
  | {
      /**
       * NAME of the bookmark to be applied
       */
      byName: string[];
      bookmark?: undefined;
      clearAll?: undefined;
      field?: undefined;
      values?: undefined;
    };
// | {
//     /**
//      * Clear all selected values from provided fields list
//      */
//     clear: string[];
//   };

export interface TestCase {
  /**
   * Name of the test case
   */
  name: string;
  /**
   * Longer text that describe the purpose of the test case
   */
  description?: string;
  /**
   * What is the type of the test  case
   */
  type: "scalar" | "list"; //| "table";
  /**
   * What selections to be applied before running the test
   *
   * WARNING: these selections will be applied AFTER the test group selections are applied (if any)
   */
  selections?: ISelection[];
  /**
   * If true the test will not be performed
   */
  skip?: boolean;
  details: IScalar | IList | ITableTestCase;
  options?: {
    /**
     * In which state the expression to be made. The default option is $
     */
    state?: string;
  } & (ScalarOptions | TableOptions);
}

export interface TestSuiteDefinition {
  /**
   * Descriptions of the tests
   */
  description?: string;
  /**
   * What selections to be applied BEFORE running EACH test case in the group
   *
   * Selections are applied one after another in order of appearance - first defined, fist selected
   */
  selections?: ISelection[];
  /**
   * Test group specific properties
   * These properties are applied to ALL test cases inside the group
   */
  properties?: {
    clearAllBeforeEach?: boolean;
    skip?: boolean;
  };
  /**
   * List of test cases
   */
  tests: TestCase[];
}

export interface IData {
  [k: string]: TestSuiteDefinition;
}

export interface Spec {
  meta?: IMeta;
  data?: IData;
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

export interface Runbook {
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
  props?: IProps;
  /**
   * Emit debug messages
   */
  debug?: boolean;
}

export interface ITestMetaResult {
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
  testResults: ITestMetaResult[];
}

export interface TestEvaluationResult {
  status: boolean;
  name: string;
  type: "scalar" | "list" | "table";
  timings: {
    start: string;
    end: string;
    elapsed: number;
  };
  message: string;
  currentSelections: {
    selections: qSelections[];
    timings: {
      start: string;
      end: string;
      elapsed: number;
      message?: string;
    };
  };
}

export interface TestSuiteResult {
  status: boolean;
  tests: TestEvaluationResult[] | ITestMetaResult[];
  totalTests: number;
  failedTests: number;
  totalElapsedTime: number;
}

export interface IEventError {
  group: string;
  subGroup?: string;
  name: string;
  reason: string;
}

export interface IEventDebug {
  // group: string;
  // subGroup?: string;
  name: string;
  message: string;
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

// props should have ONE OF byName or field <-> name
export interface IProps {
  /**
   * Pre-define selections.
   *
   * These selections can be referenced in the tests.
   */
  selections?: IPropsSelections;
  /**
   * Define SESSION variables that can be used during the test suite execution.
   *
   * Make sure that the name of the session variables is not overlapping
   * with an existing document variable
   */
  variables?: IPropsVariables;
}

export type IPropsVariables = {
  [k: string]: string;
};

export type IPropsSelections = {
  [k: string]: IPropsSelection[];
};

export type IPropsSelection =
  | {
      // name: string;
      description?: string;
      byName?: undefined;
    }
  | (Selection | SelectionByName);

export type Selection = {
  field: string;
  values: string[];
  byName?: undefined;
  // name: string;
};

export type SelectionByName = {
  byName: string[];
  field?: undefined;
  values?: undefined;
  // name: string;
};

export type IPropsSelectionArray = {
  name: string;
  selections: (
    | {
        name: string;
        description?: string;
        byName?: undefined;
      }
    | (SelectionArray | SelectionByNameArray)
  )[];
};

export type SelectionArray = {
  field: string;
  values: string[];
  byName?: undefined;
  name: string;
};

export type SelectionByNameArray = {
  byName: string[];
  field?: undefined;
  values?: undefined;
  name: string;
};

export interface TestDetails {
  //
}

export interface qSelections {
  qTotal: number;
  qField: string;
  qSelectedCount: number;
  qSelected: string;
  qRangeInfo: [];
  qSortIndex: number;
}

export interface ICurrentSelections extends EngineAPI.IGenericBaseLayout {
  qSelectionInfo: {};
  qSelectionObject: {
    qBackCount: number;
    qForwardCount: number;
    qSelections: qSelections[];
  };
}
