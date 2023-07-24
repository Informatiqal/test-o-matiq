import { IScalar, TestCase, TestEvaluationResult } from "../../interface/Specs";
import { operations } from "../../util/common";
import { EventsBus } from "../../util/EventBus";
import { Timing } from "../../util/common";
import { Selection } from "../Selections";
import { IAppMixin } from "../../index.doc";
import { ScalarTableObject } from "../../util/Engine";

export class Scalar {
  private app: EngineAPI.IApp;
  private scalar: IScalar;
  private test: TestCase;
  private selections: Selection;
  private emitter: EventsBus;
  private timing: Timing;

  constructor(test: TestCase, app: IAppMixin) {
    this.test = test;
    this.scalar = test.details as IScalar;
    this.app = app;
    this.emitter = new EventsBus();
    this.selections = Selection.getInstance();

    this.timing = new Timing();
  }

  async run(): Promise<TestEvaluationResult> {
    this.timing.start();

    // apply the required selections
    const currentSelections = await this.applySelections();

    // calculate the expression (left side)
    const leftSide = await this.evaluateExpression(this.scalar.expression);

    // calculate the expected result (right side)
    const rightSide = (this.scalar.result as string).toString().startsWith("=")
      ? await this.evaluateExpression(this.scalar.result as string)
      : this.scalar.result;

    // compare the evaluated result with the expected
    const testStatus = operations[
      this.scalar.operator ? this.scalar.operator : "=="
    ](leftSide, rightSide);

    this.timing.stop();

    //TODO: emit the result here
    // if there is no match emit error event
    // if (!evaluateResultStatus) {
    // this.failedTests++;
    // this.isFailedGroup = true;
    // this.emitter.emit("testError", {
    //   group: "Scalar",
    //   name: this.scalar.name,
    //   reason: `Failed: ${leftSide} ${this.scalar.operator} ${rightSide}`,
    // });
    // }

    // this.endTime = new Date();
    // this.elapsedTime = this.endTime.getTime() - this.startTime.getTime();

    return {
      status: testStatus,
      name: this.test.name,
      type: "scalar",
      timings: {
        start: this.timing.startTime,
        end: this.timing.endTime,
        elapsed: this.timing.elapsedTime,
      },
      message: !testStatus
        ? `Failed: ${leftSide} ${this.scalar.operator || "=="} ${rightSide}`
        : `Passed: ${leftSide} ${this.scalar.operator || "=="} ${rightSide}`,
      currentSelections: currentSelections,
    };
  }

  private async evaluateExpression(expression: string) {
    const scalarTable = new ScalarTableObject(this.app);
    const result = await scalarTable.evaluate(expression);

    // try and destroy the session object
    // its not a big deal if this operation fails for some reason
    // the result is the important one here
    // and its a session object. It will be destroyed anyway when the
    // connection is closed
    try {
      await scalarTable.destroy();
    } catch (e) {}

    return result;
    // return await this.app
    //   .evaluateEx(expression.startsWith("=") ? expression : `= ${expression}`)
    //   .then((r) => (r.qIsNumeric ? r.qNumber : r.qText));
  }

  private async applySelections() {
    if (this.test.selections)
      return await this.selections.makeSelections(this.test.selections);

    const currentSelections = await this.selections.getCurrentSelections();

    return {
      selections: currentSelections,
      timings: {
        start: "n/a",
        end: "n/a",
        elapsed: 0,
        message:
          "No timings to be captured. No selections to be made. Returning the currently active selections",
      },
    };
  }
}
