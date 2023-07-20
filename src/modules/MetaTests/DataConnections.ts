import { IGroupResult, ITestMetaResult } from "../../interface/Specs";
import { EventsBus } from "../../util/EventBus";
import { concatResults } from "../../util/common";

export class DataConnections {
  private app: EngineAPI.IApp;
  private qDataConnections: string[];
  private emitter: EventsBus;
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
  }

  /**
   * Check if the provided data connections exists from the app
   */
  async run(): Promise<ITestMetaResult[]> {
    this.startTime = new Date();

    const dataConnectionsResult: ITestMetaResult = await this.app
      .getConnections()
      .then((allDataConnections) => {
        const allDataConnectionNames = allDataConnections.map((o) => o.qName);
        const notFound = this.qDataConnections.filter(
          (x) => !allDataConnectionNames.includes(x)
        );

        if (notFound.length > 0) {
          this.failedTests = notFound.length;
          this.isFailedGroup = true;

          // this.emitter.emit("testError", {
          //   group: "Objects",
          //   name: "Objects",
          //   reason: `Object(s) not found: ${concatResults(notFound)}`,
          // });

          return {
            status: false,
            // type: "meta",
            name: "DataConnections",
            message: `Data connection(s) not found: ${concatResults(notFound)}`,
          };
        }

        return {
          status: true,
          name: "DataConnections",
          message: `Passed: All data connections are present`,
        };
      });

    return [dataConnectionsResult];

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
