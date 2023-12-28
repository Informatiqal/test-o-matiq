import { Scalar } from "./Scalar";
// import { Selection } from "../Engine/Selections";
import {
  ISelection,
  TestCase,
  TestEvaluationResult,
  TestSuiteDefinition,
} from "../../interface/Specs";
import { IAppMixin } from "../../index.doc";
import { List } from "./List";
import { Engine } from "../Engine";
import { groupByKey } from "../../util/common";

export class TestSuite {
  testSuite: TestSuiteDefinition;
  testsResults: TestEvaluationResult[];
  private engine: Engine;
  // private qlikApp: IAppMixin;
  // private selections: Selection;

  constructor(
    testSuite: TestSuiteDefinition,
    // qlikApp: IAppMixin
    // propsSelections: IPropsSelections
  ) {
    this.testSuite = testSuite;
    // this.qlikApp = qlikApp;
    // this.selections = Selection.getInstance({});
    this.testsResults = [];
    this.engine = Engine.getInstance();
  }

  async performTests(): Promise<TestEvaluationResult[]> {
    // do not run the tests in the whole suite
    if (this.testSuite.options?.skip && this.testSuite.options?.skip == true) {
      // TODO: emit something here to indicate that the whole suite was skipped
      return [];
    }

    // clear all selections in all apps (including the locked fields)
    // before perform the test
    await this.engine.clearAllInAll();

    await this.runTests();

    return this.testsResults;
  }

  private async applySelections() {
    // if no selections are defined then return empty array
    // no need to proceed
    if (!this.testSuite.selections) return [];

    const s = groupByKey<ISelection>(this.testSuite.selections, "app");

    // "move" the selections without specified app under the main app
    if (s["undefined"]) {
      s[this.engine.mainApp] = [...s[this.engine.mainApp], ...s["undefined"]];
      delete s["undefined"];
    }

    // make all defined selections in the respective apps
    return await Promise.all(
      Object.keys(s).map((appName) =>
        this.engine.enigmaData[appName].selection.makeSelections(s[appName])
      )
    );

    // return await this.selections.makeSelections(this.testSuite.selections);
  }

  private async runTests() {
    for (let test of this.testSuite.tests) {
      // do not run the test if skip == true
      if (!test.skip) {
        // clear all if clearAllBeforeEach is explicitly set to true
        if (this.testSuite.options?.clearAllBeforeEach == true)
          await this.engine.clearAllInAll();

        const testResult: TestEvaluationResult = await this.runTest(test);

        this.testsResults.push(testResult);
      } else {
        // TODO: emit something here to indicate that this test was skipped
      }
    }
  }

  private async runTest(test: TestCase) {
    // and make the test suite specific selections
    const currentSelections = await this.applySelections();

    if (test.type == "scalar") {
      const scalar = new Scalar(test);
      return await scalar.process();
    }

    // if (test.type == "list") {
    //   const list = new List(test, this.qlikApp);
    //   return await list.process();
    // }

    // Table will be disabled at the moment https://github.com/Informatiqal/test-o-matiq/issues/145
    // if (test.type == "table") {
    // const table = new Table(test, this.qlikApp);
    // return await table.run();
    // }
  }
}
