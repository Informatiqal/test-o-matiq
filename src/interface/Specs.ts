export interface ISelection {
  field: string;
  values: number | string[];
}

export interface IDataModel {
  Field?: string[];
  Table?: string[];
  SyntheticKeys?: boolean;
  AlwaysOneSelected?: string[];
}

export interface Field {
  name: string;
  count: number;
}

export interface ITable {
  name: string;
  count: number;
}

export interface IMeta {
  DataModel?: IDataModel;
  Field?: Field[];
  Table?: ITable[];
  Variable?: string[];
}

export interface Details {
  state: string;
}

export interface IScalar {
  name: string;
  description?: string;
  expression: string;
  result: any;
  operator?: string;
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

export interface IQObject {
  id: string;
  type: "sheet" | "visual";
}

export interface Spec {
  Meta?: IMeta;
  Scalar?: IScalar[];
  List?: IList[];
  Table?: ITable2[];
  Object?: string[];
}

export interface Root {
  author?: string;
  description?: string;
  selections?: ISelection[];
  skip?: boolean;
  spec: Spec;
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
}
