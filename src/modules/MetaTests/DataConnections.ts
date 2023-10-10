import { IGroupResult, ITestMetaResult } from "../../interface/Specs";
import { EventsBus } from "../../util/EventBus";
import { Timing, concatResults } from "../../util/common";

export class DataConnections {
  private app: EngineAPI.IApp;
  private qDataConnections: string[];
  private emitter: EventsBus;
  private timing: Timing;
  private failedTests: number;
  private isFailedGroup: boolean;
  private startTime: Date;
  private endTime: Date;
  private elapsedTime: number;

  constructor(qDataConnections: string[], app: EngineAPI.IApp) {
    this.qDataConnections = qDataConnections;
    this.app = app;
    this.emitter = new EventsBus();
    this.failedTests = 0;
    this.isFailedGroup = false;
    this.timing = new Timing();
  }

  /**
   * Check if the provided data connections exists from the app
   */
  async run(): Promise<ITestMetaResult[]> {
    this.timing.start();

    const notFoundDataConnections: string[] = await this.app
      .getConnections()
      .then((allDataConnections) => {
        this.timing.stop();

        const allDataConnectionNames = allDataConnections.map((o) => o.qName);
        return this.qDataConnections.filter(
          (x) => !allDataConnectionNames.includes(x)
        );

        // return notFound;
        // if (notFound.length > 0) {
        //   overallStatus = false;
        //   this.failedTests = notFound.length;
        //   this.isFailedGroup = true;

        //   return {
        //     name: "Meta -> DataConnections",
        //     status: false,
        //     message: `Data connection(s) not found: ${concatResults(notFound)}`,
        //     type: "meta",
        //     timings: {
        //       start: this.timing.startTime,
        //       end: this.timing.endTime,
        //       elapsed: this.timing.elapsedTime,
        //     },
        //   };
        // }

        // return {
        //   name: "Meta -> DataConnections",
        //   status: overallStatus,
        //   message: `Passed: All data connections are present`,
        //   type: "meta",
        //   timings: {
        //     start: this.timing.startTime,
        //     end: this.timing.endTime,
        //     elapsed: this.timing.elapsedTime,
        //   },
        // };
      });

    const result: ITestMetaResult = {
      name: "Meta -> DataConnections",
      status: notFoundDataConnections.length > 0 ? false : true,
      message:
        notFoundDataConnections.length > 0
          ? `Data connection(s) not found: ${concatResults(
              notFoundDataConnections
            )}`
          : `Passed: All data connections are present`,
      type: "meta",
      timings: {
        start: this.timing.startTime,
        end: this.timing.endTime,
        elapsed: this.timing.elapsedTime,
      },
    };

    this.emitter.emit("testResult", result);

    return [result];

    // this.endTime = new Date();
    // this.elapsedTime = this.endTime.getTime() - this.startTime.getTime();

    // return {
    //   status: !this.isFailedGroup,
    //   group: "Object",
    //   totalTests: this.qObjects.length,
    //   failedTests: this.failedTests,
    //   startTime: this.startTime,
    //   endTime: this.endTime,
    //   elapsedTime: this.elapsedTime,
    //   testResults: [objectsResult],
    // };
  }
}
