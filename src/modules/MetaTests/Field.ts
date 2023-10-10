import { Field, ITestMetaResult, ITestResult } from "../../interface/Specs";
import { EventsBus } from "../../util/EventBus";
import { operations } from "../../util/common";

export class FieldCounts {
  private app: EngineAPI.IApp;
  private fields: Field[];
  private emitter: EventsBus;

  constructor(fields: Field[], app: EngineAPI.IApp) {
    this.fields = fields;
    this.app = app;
    this.emitter = new EventsBus();
  }

  async process(): Promise<ITestResult[]> {
    let overallStatus = true;

    return await Promise.all(
      this.fields.map(async (f) => {
        try {
          const cardinal = await this.getFieldCounts(f.name);

          const countStatus = operations[f.operator ? f.operator : "=="](
            cardinal,
            f.count
          );

          if (!countStatus) overallStatus = countStatus;

          const fieldResult: ITestResult = {
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
      const fieldResult = {
        name: "Meta -> Field",
        status: overallStatus,
        message: testResults.map((r) => r.message).join("\n"),
      };

      this.emitter.emit("testResult", fieldResult);

      return [fieldResult];
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
