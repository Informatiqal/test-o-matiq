import { IGroupResult, ITable2, ITestMetaResult } from "../../interface/Specs";
import { EventsBus } from "../../util/EventBus";

export class Table {
  private app: EngineAPI.IApp;
  private table: ITable2[];
  private emitter: EventsBus;
  private failedTests: number;
  private isFailedGroup: boolean;
  private startTime: Date;
  private endTime: Date;
  private elapsedTime: number;

  constructor(table: ITable2[], app: EngineAPI.IApp) {
    this.table = table;
    this.app = app;
    this.emitter = new EventsBus();
    this.failedTests = 0;
    this.isFailedGroup = false;
  }

  async run(): Promise<IGroupResult> {
    this.startTime = new Date();

    const tableResult: ITestMetaResult[] = await Promise.all(
      this.table.map((t) => {
        const tableRowsConcat = t.result.Rows.map((r) => r.join(""));
        const objProps = this.generateObjProps(t.dimensions, t.measures);
        let qlikObject: EngineAPI.IGenericObject;

        return this.app
          .createSessionObject(objProps)
          .then((o) => {
            qlikObject = o;
            return o.getLayout();
          })
          .then((o) => {
            const arrayData = this.hyperCubeToArray(
              (o as any).qHyperCube.qDataPages
            );

            const arrayDataConcat = arrayData.map((b) => b.join(""));

            if (arrayData.length != t.result.Rows.length) {
              this.failedTests++;
              this.isFailedGroup = true;
              this.emitter.emit("testError", {
                group: "Table",
                name: t.name,
                reason: `Expected ${t.result.Rows} but received ${arrayData.length}`,
              });

              return this.app.destroySessionObject(qlikObject.id).then((_) => ({
                name: t.name,
                status: false,
                message: `Expected ${t.result.Rows} but received ${arrayData.length}`,
              }));
            }

            const notFound = tableRowsConcat.filter(
              (c) => !arrayDataConcat.includes(c)
            );

            const tableResultStatus = notFound.length > 0 ? false : true;

            if (!tableResultStatus) {
              this.failedTests++;
              this.isFailedGroup = true;
              this.emitter.emit("testError", {
                group: "Table",
                name: t.name,
                reason: `${notFound.length} row(s) not found: ${notFound.join(
                  ", "
                )}`,
              });
            }

            return this.app.destroySessionObject(qlikObject.id).then((_) => ({
              name: t.name,
              status: tableResultStatus,
              message: !tableResultStatus
                ? `${notFound.length} row(s) not found: ${notFound.join(", ")}`
                : `Passed: All rows and values are present`,
            }));
          });
      })
    );

    this.endTime = new Date();
    this.elapsedTime = this.endTime.getTime() - this.startTime.getTime();

    return {
      status: !this.isFailedGroup,
      group: "Table",
      totalTests: this.table.length,
      failedTests: this.failedTests,
      startTime: this.startTime,
      endTime: this.endTime,
      elapsedTime: this.elapsedTime,
      testResults: tableResult,
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

  private extractObjectCompleteData() {}
}
