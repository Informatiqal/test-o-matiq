import { ITestMetaResult } from "../../interface/Specs";
import { EventsBus } from "../../util/EventBus";
import { Timing, concatResults } from "../../util/common";

export class QObject {
  private app: EngineAPI.IApp;
  private qObjects: string[];
  private emitter: EventsBus;
  private timing: Timing;

  constructor(qObjects: string[], app: EngineAPI.IApp) {
    this.qObjects = qObjects;
    this.app = app;
    this.emitter = new EventsBus();
    this.timing = new Timing();
  }

  /**
   * Check if the provided objects exists in the app
   */
  async run(): Promise<ITestMetaResult[]> {
    this.timing.start();

    const notFoundObjects: string[] = await this.app
      .getAllInfos()
      .then((allObjects) => {
        this.timing.stop();

        const allObjectIds = allObjects.map((o) => o.qId);
        return this.qObjects.filter((x) => !allObjectIds.includes(x));
      });

    const result: ITestMetaResult = {
      name: "Meta -> Field",
      status: notFoundObjects.length > 0 ? false : true,
      message:
        notFoundObjects.length > 0
          ? `Object(s) not found: ${concatResults(notFoundObjects)}`
          : `All objects are present`,
      type: "meta",
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
