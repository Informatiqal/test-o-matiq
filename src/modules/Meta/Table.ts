import { ITable, ITestResponse } from "../../interface/Specs";
import { EventsBus } from "../../util/EventBus";
import { operations } from "../../util/common";

export class TableCounts {
  private app: EngineAPI.IApp;
  private tables: ITable[];
  private emitter: EventsBus;

  constructor(tables: ITable[], app: EngineAPI.IApp) {
    this.tables = tables;
    this.app = app;
    this.emitter = new EventsBus();
  }

  async process(): Promise<ITestResponse[]> {
    const { qtr } = await this.app.getTablesAndKeys(
      {} as EngineAPI.ISize,
      {} as EngineAPI.ISize,
      0,
      true,
      false
    );

    return this.tables.map((t) => {
      const tableDetails = qtr.filter((t1) => t1.qName == t.name)[0];

      if (!tableDetails) {
        this.emitter.emit("testError", {
          group: "Meta",
          subGroup: "Table row counts",
          name: t.name,
          reason: `Table "${t.name}" do not exists`,
        });

        return {
          status: false,
          name: "Table row counts",
          message: `Table "${t.name}" do not exists`,
        };
      }

      const tableDetailsStatus = operations[t.operator ? t.operator : "=="](
        tableDetails.qNoOfRows,
        t.count
      );

      if (!tableDetailsStatus) {
        this.emitter.emit("testError", {
          group: "Meta",
          subGroup: "Table row counts",
          name: t.name,
          reason: `Result value and expected do not match. Expected "${t.count}, received "${tableDetails.qNoOfRows}"`,
        });
      }

      return {
        status: tableDetailsStatus,
        name: "Table row counts",
        message: !tableDetailsStatus
          ? `table "${t.name}" have ${tableDetails.qNoOfRows} rows. Expected ${t.count}`
          : `Passed: ${t.name} have ${t.count} rows`,
      };
    });
  }
}
