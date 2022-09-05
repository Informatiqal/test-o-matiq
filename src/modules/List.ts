import { IGroupResult, IList, ITestResponse } from "../interface/Specs";
import { EventsBus } from "../util/EventBus";
import { concatResults } from "../util/common";
import { IAppMixin } from "../interface/Mixin";

export class List {
  private app: IAppMixin;
  private lists: IList[];
  private emitter: EventsBus;
  private failedTests: number;
  private isFailedGroup: boolean;
  private startTime: Date;
  private endTime: Date;
  private elapsedTime: number;

  constructor(lists: IList[], app: IAppMixin) {
    this.lists = lists;
    this.app = app;
    this.emitter = new EventsBus();
    this.failedTests = 0;
    this.isFailedGroup = false;
  }

  async run(): Promise<IGroupResult> {
    this.startTime = new Date();

    const listResults: ITestResponse[] = await Promise.all(
      this.lists.map((s) => {
        return this.app
          .mCreateSessionListbox(s.name, {
            destroyOnComplete: true,
            getAllData: true,
          })
          .then((res) => res.flattenData().map((f) => f.qText))
          .then((values) => {
            const notFound = s.values.filter((x) => !values.includes(x));

            const listResultStatus = notFound.length > 0 ? false : true;

            if (!listResultStatus) {
              this.failedTests++;
              this.isFailedGroup = true;
              this.emitter.emit("testError", {
                group: "List",
                name: s.name,
                reason: `Values not found: ${concatResults(notFound)}`,
              });

              return {
                name: s.name,
                status: listResultStatus,
                message: `Values not found: ${concatResults(notFound)}`,
              };
            }

            return {
              name: s.name,
              status: listResultStatus,
              message:
                "Passed: Field exists and all expected values are present",
            };
          });
      })
    );

    this.endTime = new Date();
    this.elapsedTime = this.endTime.getTime() - this.startTime.getTime();

    return {
      status: !this.isFailedGroup,
      group: "List",
      totalTests: this.lists.length,
      failedTests: this.failedTests,
      startTime: this.startTime,
      endTime: this.endTime,
      elapsedTime: this.elapsedTime,
      testResults: listResults,
    };
  }
}
