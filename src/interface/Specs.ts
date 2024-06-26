export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> &
  U[keyof U];

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
  VizObject?: string[];
  /**
   * List of data connections that should exists
   */
  DataConnections?: string[];
  MasterItems?: AtLeastOne<{
    dimensions: string[];
    measures: string[];
    visualizations: string[];
  }>;
}

export interface ScalarOptions {
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
  // blah: string;
}

export interface IScalar {
  /**
   * Name of the test
   */
  // name?: string;
  /**
   * Short description
   */
  description?: string;
  /**
   * Qlik expression
   */
  expression: string;
  results: {
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
    value: string | number;
    operator?: IScalarOperator;
    /**
     * What is the accepted variation between the expression and the result. For example:
     *
     * - +-5
     * - +-0.5%
     * - 12 (will assume +12)
     * - -3
     * - etc
     */
    variation?: string;
    app?: string;
  }[];
  // result?: string | number;
  /**
   * TBA
   */
  // operator: IScalarOperator;
  // TODO: deviation/difference?
  // deviation?: string;
  state?: string;
}

export interface IList {
  // name?: string;
  fieldName: string;
  description?: string;
  values: string[];
  operation: IListOperator;
  state?: string;
}

export interface Measure {
  label: string;
  calculation: string;
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
      /**
       * In which app the selection should be made
       */
      app?: string;
      state?: undefined;
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
      state?: string;
      /**
       * In which app the selection should be made
       */
      app?: string;
      clearAll?: undefined;
      bookmark?: undefined;
      byName?: undefined;
    }
  | {
      /**
       * NAME of the bookmark to be applied
       */
      bookmark: string;
      /**
       * In which app the selection should be made
       */
      app?: string;
      state?: undefined;
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
      state?: string;
      /**
       * In which app the selection should be made
       */
      app?: string;
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
     * In which state the test to be ran. The state is  applied to the expressions and selections.
     *
     * The default option is $
     */
    //   state?: string;
    // } & (ScalarOptions | TableOptions);
    clearBeforeEach?: boolean;
  };
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
  options?: {
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

export interface App {
  /**
   * Might not be the app real name.
   * This name will be used in the tests to reference the app
   */
  // name: string;
  /**
   * The real app id
   */
  id: string;
  /**
   * Only one app should have this property as true
   * If not app is referenced in the tests then this app will be the default one
   *
   * If only one app is defined then this property might not be set (it will be set by default)
   */
  // isMain?: boolean;
  // app: IAppMixin;
}

export type Apps = { [k: string]: App };

export interface EnvironmentDesktop {
  host: string;
  // apps: App[];
  port?: number;
  apps: Apps;
  mainApp: string;
  edition: "desktop";
}

export interface EnvironmentSaaS {
  host: string;
  port?: number;
  // apps: Apps[];
  mainApp: string;
  apps: Apps;
  edition: "saas";
  authentication?: {
    apiKey: string;
  };
}

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
  environment: EnvironmentDesktop | EnvironmentSaaS;
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

export interface Timings {
  start: string;
  end: string;
  elapsed: number;
  message?: string;
}

export interface ITestMetaResult {
  status: boolean;
  name: string;
  message: string;
  timings: Timings;
  type: "scalar" | "list" | "table" | "meta";
}

export interface CurrentSelections {
  selections: { state: string; selections: qSelections[] }[];
  timings: Timings;
}

export interface ITestDataResult extends ITestMetaResult {
  currentSelections: CurrentSelections;
}

// export interface TestMetaResult {}

export interface TestEvaluationResult extends ITestMetaResult {
  // status: boolean;
  // name: string;
  // message: string;
  // timings: Timings;
  currentSelections: CurrentSelections;
}

export interface TestSuiteResult {
  status: boolean;
  tests: TestEvaluationResult[] | ITestMetaResult[];
  // totalTests: number;
  // failedTests: number;
  totalElapsedTime: number;
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
  [k: string]: string | { expression: string; app: string };
};

export type IPropsSelections = {
  [k: string]: IPropsSelection[];
};

export type IPropsSelection =
  // | {
  //     // name: string;
  //     description?: string;
  //     byName?: undefined;
  //   }
  | (Selection | SelectionByName);

export type Selection = {
  field: string;
  values: string[] | number[];
  description?: string;
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

export type EngineVersion = string;
