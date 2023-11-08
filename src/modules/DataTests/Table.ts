import {
  ITableTestCase,
  ITestMetaResult,
  TestCase,
  TestEvaluationResult,
} from "../../interface/Specs";
import { EventsBus } from "../../util/EventBus";
import { Timing } from "../../util/common";
import { Selection } from "../Selections";
import { TableObject } from "../../util/Engine";

export class Table {
  private app: EngineAPI.IApp;
  private table: ITableTestCase;
  private test: TestCase;
  private selections: Selection;
  private emitter: EventsBus;
  private timing: Timing;

  constructor(test: TestCase, app: EngineAPI.IApp) {
    this.test = test;
    this.table = test.details as ITableTestCase;
    this.app = app;
    this.emitter = new EventsBus();
    this.selections = Selection.getInstance({});

    this.timing = new Timing();
  }

  async run(): Promise<TestEvaluationResult> {
    this.timing.start();

    // apply the required selections
    const currentSelections = await this.applySelections();

    const leftSite = await this.evaluate();

    let a = 1;

    // const tableResult: ITestMetaResult[] = await Promise.all(
    // this.table.map((t) => {
    // const tableRowsConcat = this.table.result.rows.map((r) => r.join(""));
    // const objProps = this.generateObjProps(
    //   this.table.dimensions,
    //   this.table.measures
    // );
    // let qlikObject: EngineAPI.IGenericObject;

    // this.app
    //   .createSessionObject(objProps)
    //   .then((o) => {
    //     qlikObject = o;
    //     return o.getLayout();
    //   })
    //   .then((o) => {
    //     const arrayData = this.hyperCubeToArray(
    //       (o as any).qHyperCube.qDataPages
    //     );

    //     const arrayDataConcat = arrayData.map((b) => b.join(""));

    //     if (arrayData.length != this.table.result.rows.length) {
    //       // this.failedTests++;
    //       // this.isFailedGroup = true;
    //       this.emitter.emit("testError", {
    //         group: "Table",
    //         name: this.test.name,
    //         reason: `Expected ${this.table.result.rows} but received ${arrayData.length}`,
    //       });

    //       return this.app.destroySessionObject(qlikObject.id).then((_) => ({
    //         name: this.test.name,
    //         status: false,
    //         message: `Expected ${this.table.result.rows} but received ${arrayData.length}`,
    //       }));
    //     }

    //     const notFound = tableRowsConcat.filter(
    //       (c) => !arrayDataConcat.includes(c)
    //     );

    //     const tableResultStatus = notFound.length > 0 ? false : true;

    //     // if (!tableResultStatus) {
    //     //   this.failedTests++;
    //     //   this.isFailedGroup = true;
    //     //   this.emitter.emit("testError", {
    //     //     group: "Table",
    //     //     name: t.name,
    //     //     reason: `${notFound.length} row(s) not found: ${notFound.join(
    //     //       ", "
    //     //     )}`,
    //     //   });
    //     // }

    //     return this.app.destroySessionObject(qlikObject.id).then((_) => ({
    //       name: this.test.name,
    //       status: tableResultStatus,
    //       message: !tableResultStatus
    //         ? `${notFound.length} row(s) not found: ${notFound.join(", ")}`
    //         : `All rows and values are present`,
    //     }));
    //   });

    return {
      status: true,
      name: this.test.name,
      type: "scalar",
      timings: {
        start: this.timing.startTime,
        end: this.timing.endTime,
        elapsed: this.timing.elapsedTime,
      },
      message: "N/A",
      currentSelections: currentSelections,
    };
  }

  private generateObjProps(dimensions: string[], measures: string[]) {
    const totalColumns = dimensions.length + measures.length;

    return {
      qInfo: {
        qType: "straight-table-testing",
      },
      qHyperCubeDef: {
        qStateName: "$",
        qDimensions: dimensions.map((d) => ({
          qDef: {
            qFieldDefs: [d],
          },
        })),
        qMeasures: measures.map((m) => ({
          qDef: {
            qDef: m,
          },
        })),
        qInitialDataFetch: [
          {
            qWidth: totalColumns,
            qHeight: Math.floor(10000 / totalColumns),
          },
        ],
      },
    };
  }

  private hyperCubeToArray(cubeData: any) {
    return cubeData
      .map((dataPage) => {
        return dataPage.qMatrix.map((matrix) => matrix.map((m) => m.qText));
      })
      .flat();
  }

  private async applySelections() {
    if (this.test.selections)
      return await this.selections.makeSelections(this.test.selections, "");

    const currentSelections = await this.selections.getCurrentSelections();

    return {
      selections: currentSelections,
      timings: {
        start: "n/a",
        end: "n/a",
        elapsed: 0,
        message:
          "No timings to be captured. No selections to be made. Returning the currently active selections",
      },
    };
  }

  private async evaluate() {
    const tableObject = new TableObject(this.app);
    const result = await tableObject.evaluate(
      this.table.dimensions,
      this.table.measures,
      this.test.options?.state
    );

    // try and destroy the session object
    // its not a big deal if this operation fails for some reason
    // the result is the important one here
    // and its a session object. It will be destroyed anyway when the
    // connection is closed
    try {
      await tableObject.destroy();
    } catch (e) {}

    return result;
  }
}
