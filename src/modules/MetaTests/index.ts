import { IAppMixin } from "../../interface/Mixin";
import {
  IGroupResult,
  IMeta,
  ITestMetaResult,
  TestSuiteResult,
} from "../../interface/Specs";
import { DataModel } from "./DataModel/index";
import { FieldCounts } from "./Field";
import { TableCounts } from "./Table";
import { VariablesExists } from "./Variable";
import { QObject } from "./Object";
import { DataConnections } from "./DataConnections";

export class Meta {
  meta: IMeta;
  app: IAppMixin;
  private failedTests: number;
  private isFailedGroup: boolean;
  private startTime: Date;
  private endTime: Date;
  private elapsedTime: number;
  private totalTests: number;
  private testResults: ITestMetaResult[];
  // private qObject: QObject;

  constructor(meta: IMeta, app: IAppMixin) {
    this.meta = meta;
    this.app = app;
    this.failedTests = 0;
    this.isFailedGroup = false;
    this.totalTests = 0;
  }

  async run(): Promise<TestSuiteResult> {
    this.startTime = new Date();

    // let promises: ITestResponse[] = [];
    let promises = [] as Promise<ITestMetaResult[]>[];

    if (this.meta.DataModel) {
      const dm = new DataModel(this.meta.DataModel, this.app);
      this.totalTests += Object.entries(this.meta.DataModel).length;
      promises.push(dm.process());
    }

    if (this.meta.Field) {
      const fc = new FieldCounts(this.meta.Field, this.app);
      this.totalTests += this.meta.Field.length;
      promises.push(fc.process());
    }

    if (this.meta.Table) {
      const tc = new TableCounts(this.meta.Table, this.app);
      this.totalTests += this.meta.Table.length;
      promises.push(tc.process());
    }

    if (this.meta.Variable) {
      const ve = new VariablesExists(this.meta.Variable, this.app);
      this.totalTests +=
        (this.meta.Variable.DoNotExists?.length || 0) +
        (this.meta.Variable.Exists?.length || 0);
      promises.push(ve.process());
    }

    if (this.meta.Object) {
      const qObject = new QObject(this.meta.Object, this.app);
      this.totalTests += this.meta.Object.length;
      promises.push(qObject.run());
    }

    if (this.meta.DataConnections) {
      const dataConnections = new DataConnections(
        this.meta.DataConnections,
        this.app
      );
      this.totalTests += this.meta.DataConnections.length;
      promises.push(dataConnections.run());
    }

    const results = await (await Promise.all(promises)).flat();

    results.map((r) => {
      if (r.status == false) {
        this.isFailedGroup = true;
        this.failedTests++;
      }
    });

    this.endTime = new Date();
    this.elapsedTime = this.endTime.getTime() - this.startTime.getTime();

    return {
      status: !this.isFailedGroup,
      // group: "Meta",
      totalTests: this.totalTests,
      failedTests: this.failedTests,
      // startTime: this.startTime,
      // endTime: this.endTime,
      totalElapsedTime: Math.abs(this.elapsedTime / 1000),
      tests: results,
    };
  }
}
