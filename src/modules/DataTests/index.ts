import { Scalar } from "./Scalar";
import { Selection } from "../Selections";
import {
  // IPropsSelections,
  // IScalar,
  // ISelection,
  TestCase,
  TestEvaluationResult,
  TestSuiteDefinition,
} from "../../interface/Specs";
import { IAppMixin } from "../../index.doc";

export class TestSuite {
  testSuite: TestSuiteDefinition;
  testsResults: TestEvaluationResult[];
  private qlikApp: IAppMixin;
  private selections: Selection;

  constructor(
    testSuite: TestSuiteDefinition,
    qlikApp: IAppMixin,
    // propsSelections: IPropsSelections
  ) {
    this.testSuite = testSuite;
    this.qlikApp = qlikApp;
    this.selections = Selection.getInstance();
    this.testsResults = [];
  }

  async performTests(): Promise<TestEvaluationResult[]> {
    // clear all selections (including the locked fields)
    // before perform the test
    await this.qlikApp.clearAll(true);

    await this.runTests();

    return this.testsResults;
  }

  private async applySelections() {
    if (this.testSuite.selections)
      return await this.selections.makeSelections(this.testSuite.selections);

    return [];
  }

  private async runTests() {
    for (let test of this.testSuite.tests) {
      const testResult: TestEvaluationResult = await this.runTest(test);

      this.testsResults.push(testResult);
    }
  }

  private async runTest(test: TestCase) {
    // and make the test suite specific selections
    const currentSelections = await this.applySelections();

    if (test.type == "scalar") {
      const scalar = new Scalar(test, this.qlikApp);

      return await scalar.run();
    }

    if (test.type == "list") {
      //TODO: implementation here
    }

    if (test.type == "table") {
      //TODO: implementation here
    }
  }
}
