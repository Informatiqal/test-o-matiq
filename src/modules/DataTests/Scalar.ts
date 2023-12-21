import {
  IScalar,
  ITestDataResult,
  TestCase,
  TestEvaluationResult,
} from "../../interface/Specs";
import { compareWithVariance, inRange, operations } from "../../util/common";
import { EventsBus } from "../../util/EventBus";
import { Timing } from "../../util/common";
import { Selection } from "../Selections";
import { IAppMixin } from "../../index.doc";
import { ScalarTableObject } from "../../util/Engine";
import { DataTestsBase } from "./BaseClass";

export class Scalar extends DataTestsBase {
  private app: EngineAPI.IApp;
  private testDetails: IScalar;
  test: TestCase;
  selections: Selection;
  private emitter: EventsBus;
  private timing: Timing;
  // private state: string;

  constructor(test: TestCase, app: IAppMixin) {
    super();

    this.test = test;
    this.selections = Selection.getInstance({});
    this.testDetails = test.details as IScalar;
    this.app = app;
    this.emitter = new EventsBus();
    this.timing = new Timing();
  }

  async process(): Promise<ITestDataResult> {
    this.timing.start();
    this.emitter.emit("testStart", this.test.name);

    // apply the required selections
    const currentSelections = await this.applySelections();

    // calculate the expression (left side)
    const leftSide = await this.evaluate(
      this.testDetails.expression,
      this.testDetails.state
    );

    let testStatus = true;

    const comparisonResults = await Promise.all(
      this.testDetails.results.map((result) => {
        if (result.value.toString().startsWith("=")) {
          return this.evaluate(
            result.value as string,
            this.testDetails.state
          ).then((evaluateResult: number) => {
            // if there is a variation specified then compare the result against it
            if (result.variation) {
              let { upperLimit, lowerLimit } = compareWithVariance(
                result.variation,
                leftSide as number
              );

              return inRange(evaluateResult, lowerLimit, upperLimit);
            }

            // if no variation then proceed with compare the result
            // with the specified operator (default operator is ==)
            return operations[result.operator ? result.operator : "=="](
              leftSide,
              evaluateResult
            );
          });
        }

        return operations[result.operator ? result.operator : "=="](
          leftSide,
          result.value
        );
      })
    ).then((results) => {
      // if at least one of the results is failing then fail the whole test
      testStatus = !results.includes(false);

      return results;
    });

    const messages = comparisonResults.map((result, i) => {
      const variationMessage = this.testDetails.results[i].variation
        ? ` (${this.testDetails.results[i].variation})`
        : "";
      return `${result ? "PASS" : "FAIL"} ${leftSide} ${
        this.testDetails.results[i].operator || "=="
      } ${this.testDetails.results[i].value}${variationMessage}`;
    });

    this.timing.stop();

    const result: ITestDataResult = {
      name: this.test.name,
      status: testStatus,
      type: "scalar",
      timings: {
        start: this.timing.startTime,
        end: this.timing.endTime,
        elapsed: this.timing.elapsedTime,
      },
      // message: `${leftSide} ${this.testDetails.operator || "=="} ${rightSide}`,
      message: messages.join("\n"),
      currentSelections: currentSelections,
    };

    this.emitter.emit("testResult", result);

    return result;
  }

  private async evaluate(expression: string, state?: string) {
    const scalarTable = new ScalarTableObject(this.app);
    const result = await scalarTable.evaluate(expression, state ?? "$");

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
}
