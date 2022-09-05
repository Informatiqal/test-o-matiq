import { IGroupResult, IScalar, ITestResponse } from "../interface/Specs";
import { EventsBus } from "../util/EventBus";

export class Scalar {
  private app: EngineAPI.IApp;
  private scalars: IScalar[];
  private emitter: EventsBus;
  private failedTests: number;
  private isFailedGroup: boolean;
  private startTime: Date;
  private endTime: Date;
  private elapsedTime: number;

  constructor(scalars: IScalar[], app: EngineAPI.IApp) {
    this.scalars = scalars;
    this.app = app;
    this.emitter = new EventsBus();
    this.failedTests = 0;
    this.isFailedGroup = false;
  }

  async run(): Promise<IGroupResult> {
    this.startTime = new Date();

    const evaluationResults: ITestResponse[] = await Promise.all(
      this.scalars.map(async (s) => {
        /// evaluate expression
        const evaluateResult = await this.app.evaluate(s.expression);

        // compare the evaluated result with the expected
        const evaluateResultStatus =
          evaluateResult == s.result.toString() ? true : false;

        // if there is no match emit error event
        if (!evaluateResultStatus) {
          this.failedTests++;
          this.isFailedGroup = true;
          this.emitter.emit("testError", {
            group: "Scalar",
            name: s.name,
            reason: `Result value and expected do not match. Expected "${s.result}, received "${evaluateResult}"`,
          });
        }

        return {
          name: s.name,
          status: evaluateResultStatus,
          message: !evaluateResultStatus
            ? `Result value and expected do not match. Expected "${s.result}, received "${evaluateResult}"`
            : "Passed: Result value and expected are matching",
        };
      })
    );

    this.endTime = new Date();
    this.elapsedTime = this.endTime.getTime() - this.startTime.getTime();

    return {
      status: !this.isFailedGroup,
      group: "Scalar",
      totalTests: this.scalars.length,
      failedTests: this.failedTests,
      startTime: this.startTime,
      endTime: this.endTime,
      elapsedTime: this.elapsedTime,
      testResults: evaluationResults,
    };
  }
}
