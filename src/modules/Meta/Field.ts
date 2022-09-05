import { Field, ITestResponse } from "../../interface/Specs";
import { EventsBus } from "../../util/EventBus";

export class FieldCounts {
  private app: EngineAPI.IApp;
  private fields: Field[];
  private emitter: EventsBus;

  constructor(fields: Field[], app: EngineAPI.IApp) {
    this.fields = fields;
    this.app = app;
    this.emitter = new EventsBus();
  }

  async process(): Promise<ITestResponse[]> {
    return await Promise.all(
      this.fields.map(async (f) => {
        try {
          const cardinal = await this.getFieldCounts(f.name);

          const countStatus = cardinal != f.count ? false : true;

          if (!countStatus) {
            this.emitter.emit("testError", {
              group: "Meta",
              subGroup: "Field counts",
              name: f.name,
              reason: `Result value and expected do not match. Expected ${f.count}. Received ${cardinal} `,
            });
          }

          return {
            status: countStatus,
            name: "Field distinct counts",
            message: !countStatus
              ? `Field "${f.name}" have ${cardinal} values. Expected ${f.count}`
              : `Passed: Field "${f.name}" have ${cardinal} values`,
          };
        } catch (e) {
          return {
            status: false,
            name: f.name,
            message: e.message,
          };
        }
      })
    );
  }

  private async getFieldCounts(fieldName: string) {
    try {
      const f = await this.app.getField(fieldName);
      return await f.getCardinal();
    } catch (e) {
      throw new Error(`Field "${fieldName}" not found`);
    }
  }
}
