import { ITable, ITestMetaResult } from "../../interface/Specs";
import { EventsBus } from "../../util/EventBus";
import { Timing, concatResults, operations } from "../../util/common";

export class TableCounts {
  private app: EngineAPI.IApp;
  private tables: ITable[];
  private emitter: EventsBus;
  private timing: Timing;

  constructor(tables: ITable[], app: EngineAPI.IApp) {
    this.tables = tables;
    this.app = app;
    this.emitter = new EventsBus();
    this.timing = new Timing();
  }

  /**
   * Compare the number of rows of each provided table name
   * with the expected row counts
   */
  async process(): Promise<ITestMetaResult[]> {
    this.timing.start();
    this.emitter.emit("testStart", "Meta -> Tables");

    const { qtr } = await this.app.getTablesAndKeys(
      {} as EngineAPI.ISize,
      {} as EngineAPI.ISize,
      0,
      true,
      false
    );

    // list of tables missing from the dataset
    const notFoundTables: string[] = this.tables
      .filter((t) => {
        const tableDetails = qtr.filter((t1) => t1.qName == t.name)[0];
        if (!tableDetails) return true;

        return false;
      })
      .map((t) => t.name);

    const notMatchingRecords = this.tables
      .filter((t) => {
        return !notFoundTables.includes(t.name);
      })
      .map((t) => {
        const tableDetails = qtr.filter((t1) => t1.qName == t.name)[0];

        return {
          status: operations[t.operator ? t.operator : "=="](
            tableDetails.qNoOfRows,
            t.count
          ),
          expectedCount: t.count,
          actualCount: tableDetails.qNoOfRows,
          name: t.name,
        };
      })
      .filter((t) => t.status == false);

    this.timing.stop();

    let message = "";
    if (notFoundTables.length > 0)
      message += `Table(s) not found: ${concatResults(notFoundTables)}`;

    if (notMatchingRecords.length > 0)
      message += `Table(s) rows count not matching: ${concatResults(
        notMatchingRecords.map((t) => t.name)
      )}`;

    const result: ITestMetaResult = {
      name: "Meta -> Tables",
      type: "meta",
      message:
        notFoundTables.length > 0 || notMatchingRecords.length > 0
          ? message
          : "All tables are present and rows counts are matching",
      status:
        notFoundTables.length > 0 || notMatchingRecords.length > 0
          ? false
          : true,
      timings: {
        start: this.timing.startTime,
        end: this.timing.endTime,
        elapsed: this.timing.elapsedTime,
      },
    };

    this.emitter.emit("testResult", result);

    return [result];
  }
}
