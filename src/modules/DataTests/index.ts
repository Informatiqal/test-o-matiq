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
import { Table } from "./Table";

export class TestSuite {
  testSuite: TestSuiteDefinition;
  testsResults: TestEvaluationResult[];
  private qlikApp: IAppMixin;
  private selections: Selection;

  constructor(
    testSuite: TestSuiteDefinition,
    qlikApp: IAppMixin
    // propsSelections: IPropsSelections
  ) {
    this.testSuite = testSuite;
    this.qlikApp = qlikApp;
    this.selections = Selection.getInstance();
    this.testsResults = [];
  }

  async performTests(): Promise<TestEvaluationResult[]> {
    // do not run the tests in the whole suite
    if (
      this.testSuite.properties?.skip &&
      this.testSuite.properties?.skip == true
    ) {
      // TODO: emit something here to indicate that the whole suite was skipped
      return [];
    }

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
      // do not run the test if skip == true
      if (test.skip && test.skip == true) {
        // TODO: emit something here to indicate that this test was skipped
        return;
      }

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

    // Table will be disabled at the moment https://github.com/Informatiqal/test-o-matiq/issues/145
    if (test.type == "table") {
      // const table = new Table(test, this.qlikApp);
      // return await table.run();
    }
  }
}
