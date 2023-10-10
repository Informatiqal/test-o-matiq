import { IGroupResult, ITestMetaResult } from "../../interface/Specs";
import { EventsBus } from "../../util/EventBus";
import { concatResults } from "../../util/common";

export class QObject {
  private app: EngineAPI.IApp;
  private qObjects: string[];
  private emitter: EventsBus;
  private failedTests: number;
  private isFailedGroup: boolean;
  private startTime: Date;
  private endTime: Date;
  private elapsedTime: number;

  constructor(qObjects: string[], app: EngineAPI.IApp) {
    this.qObjects = qObjects;
    this.app = app;
    this.emitter = new EventsBus();
    this.failedTests = 0;
    this.isFailedGroup = false;
  }

  /**
   * Check if the provided objects exists in the app
   */
  async run(): Promise<ITestMetaResult[]> {
    this.startTime = new Date();

    const objectsResult: ITestMetaResult = await this.app
      .getAllInfos()
      .then((allObjects) => {
        const allObjectIds = allObjects.map((o) => o.qId);
        const notFound = this.qObjects.filter((x) => !allObjectIds.includes(x));

        if (notFound.length > 0) {
          this.failedTests = notFound.length;
          this.isFailedGroup = true;

          // this.emitter.emit("testError", {
          //   group: "Objects",
          //   name: "Objects",
          //   reason: `Object(s) not found: ${concatResults(notFound)}`,
          // });

          return {
            name: "Meta -> VizObject",
            status: false,
            message: `Object(s) not found: ${concatResults(notFound)}`,
          };
        }

        return {
          name: "Meta -> VizObject",
          status: true,
          message: `Passed: All objects are present`,
        };
      });

    return [objectsResult];

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
