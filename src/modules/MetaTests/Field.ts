import { Field, ITestMetaResult } from "../../interface/Specs";
import { EventsBus } from "../../util/EventBus";
import { Timing, operations } from "../../util/common";

export class FieldCounts {
  private app: EngineAPI.IApp;
  private fields: Field[];
  private emitter: EventsBus;
  private timing: Timing;

  constructor(fields: Field[], app: EngineAPI.IApp) {
    this.fields = fields;
    this.app = app;
    this.emitter = new EventsBus();
  }

  async process(): Promise<ITestMetaResult[]> {
    let overallStatus = true;

    this.timing.start();

    return await Promise.all(
      this.fields.map(async (f) => {
        try {
          const cardinal = await this.getFieldCounts(f.name);

          const countStatus = operations[f.operator ? f.operator : "=="](
            cardinal,
            f.count
          );

          if (!countStatus) overallStatus = countStatus;

          const fieldResult = {
            status: countStatus,
            name: "Field distinct counts",
            message: !countStatus
              ? `Field "${f.name}" have ${cardinal} values. Expected ${f.count}`
              : `Passed: Field "${f.name}" have ${cardinal} values`,
          };

          return fieldResult;
        } catch (e) {
          return { name: "Meta -> Field", status: false, message: e.message };
        }
      })
    ).then((testResults) => {
      this.timing.stop();

      const result: ITestMetaResult = {
        name: "Meta -> Field",
        status: overallStatus,
        message: testResults.map((r) => r.message).join("\n"),
        type: "meta",
        timings: {
          start: this.timing.startTime,
          end: this.timing.endTime,
          elapsed: this.timing.elapsedTime,
        },
      };

      this.emitter.emit("testResult", {
        name: result.name,
        status: result.status,
        message: result.message,
      });

      return [result];
    });
  }

  /**
   * Return the cardinal values count for the provided field name
   */
  private async getFieldCounts(fieldName: string) {
    try {
      const f = await this.app.getField(fieldName);
      return await f.getCardinal();
    } catch (e) {
      throw new Error(`Field "${fieldName}" not found`);
    }
  }
}
