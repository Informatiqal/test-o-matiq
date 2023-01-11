import { IGroupResult, IScalar, ITestResponse } from "../interface/Specs";
import { operations } from "../util/common";
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
        s.expression = s.expression.trim();
        const evaluateResult = await this.app
          .evaluateEx(
            s.expression.startsWith("=") ? s.expression : `= ${s.expression}`
          )
          .then((r) => (r.qIsNumeric ? r.qNumber : r.qText));

        const compareWith = (s.result as string).startsWith("=")
          ? await this.app
              .evaluateEx(s.result as string)
              .then((r) => (r.qIsNumeric ? r.qNumber : r.qText))
          : s.result;

        // compare the evaluated result with the expected
        const evaluateResultStatus = operations[s.operator ? s.operator : "=="](
          evaluateResult,
          compareWith
        );

        // if there is no match emit error event
        if (!evaluateResultStatus) {
          this.failedTests++;
          this.isFailedGroup = true;
          this.emitter.emit("testError", {
            group: "Scalar",
            name: s.name,
            reason: `Failed: ${evaluateResult} ${s.operator} ${compareWith}`,
          });
        }

        return {
          name: s.name,
          status: evaluateResultStatus,
          message: !evaluateResultStatus
            ? `Failed: ${evaluateResult} ${s.operator} ${compareWith}`
            : `Passed: ${evaluateResult} ${s.operator} ${compareWith}`,
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
