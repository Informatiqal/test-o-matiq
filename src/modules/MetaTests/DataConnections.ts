import { ITestMetaResult } from "../../interface/Specs";
import { EventsBus } from "../../util/EventBus";
import { Timing, concatResults } from "../../util/common";

export class DataConnections {
  private app: EngineAPI.IApp;
  private qDataConnections: string[];
  private emitter: EventsBus;
  private timing: Timing;

  constructor(qDataConnections: string[], app: EngineAPI.IApp) {
    this.qDataConnections = qDataConnections;
    this.app = app;
    this.emitter = new EventsBus();
    this.timing = new Timing();
  }

  /**
   * Check if the provided data connections exists from the app
   */
  async process(): Promise<ITestMetaResult[]> {
    this.timing.start();

    const notFoundDataConnections: string[] = await this.app
      .getConnections()
      .then((allDataConnections) => {
        this.timing.stop();

        const allDataConnectionNames = allDataConnections.map((o) => o.qName);
        return this.qDataConnections.filter(
          (x) => !allDataConnectionNames.includes(x)
        );
      });

    const result: ITestMetaResult = {
      name: "Meta -> DataConnections",
      status: notFoundDataConnections.length > 0 ? false : true,
      message:
        notFoundDataConnections.length > 0
          ? `Data connection(s) not found: ${concatResults(
              notFoundDataConnections
            )}`
          : `All data connections are present`,
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
