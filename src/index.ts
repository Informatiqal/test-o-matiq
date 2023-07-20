import Ajv from "ajv";
import {
  // IGroupResult,
  // IScalar,
  // TestEvaluationResult,
  IData,
  IPropsSelectionArray,
  IPropsSelections,
  ISelection,
  Runbook,
  TestCase,
  TestSuiteResult,
} from "./interface/Specs";
import { Selection, SelectionValidation } from "./modules/Selections";
import { EventsBus } from "./util/EventBus";
import { TestSuite } from "./modules/DataTests";
import { Meta } from "./modules/MetaTests";
// import { Scalar } from "./modules/DataTests/Scalar";
// import { List } from "./modules/DataTests/List";
// import { Table } from "./modules/Table";

import { IAppMixin } from "./interface/Mixin";
import * as schema from "./schema/schema.json" assert { type: "json" };

import draft from "ajv/dist/refs/json-schema-draft-06.json" assert { type: "json" };

// export namespace TestOMatiq {
export class TestOMatiq {
  specs: Runbook;
  emitter: EventsBus;
  testResults: { [k: string]: TestSuiteResult };
  qlikApp: IAppMixin;
  // testGroups: string[];
  // qlik: Qlik;

  constructor(specs: Runbook, qlikApp: IAppMixin) {
    this.specs = specs;
    this.qlikApp = qlikApp;
    this.emitter = new EventsBus();
    this.testResults = {};

    const selectionsProps = this.specs.props?.selections
      ? this.propSelectionsToArray()
      : [];
    // setup the selections class
    let selections = Selection.getInstance(this.qlikApp);
    selections.setPropsSelections(selectionsProps as IPropsSelectionArray[]);
    // selections.setDebug(this.specs.debug ? this.specs.debug : false);

    // this.testGroups = Object.entries(specs.spec).map((value) =>
    //   value[0].toString()
    // );

    const ajv = new Ajv({
      strict: true,
      allowUnionTypes: true,
      allErrors: true,
    });
    ajv.addMetaSchema(draft);

    const isValidSpec = ajv.validate(schema, specs);

    // if (isValidSpec == false)
    //   throw {
    //     message: "Error(s) while validating the input",
    //     errors: ajv.errors,
    //   };
  }

  //TODO: filter testSuites based on the provided option (if any. if not - all testSuites are active)
  async run(options?: {
    testSuites?: string[];
  }): Promise<{ [k: string]: TestSuiteResult }> {
    // check if test suites have to be filtered first
    if (options.testSuites.length > 0)
      this.specs.spec.data = Object.fromEntries(
        options.testSuites.map((k) => [k, this.specs.spec.data[k]])
      );

    await this.validateSelections();

    if (this.specs.spec.meta) await this.processMeta();

    if (this.specs.spec.data) {
      for (let [testSuiteName, testSuiteDefinition] of Object.entries(
        this.specs.spec.data
      )) {
        const testSuite = new TestSuite(testSuiteDefinition, this.qlikApp);

        const testResults = await testSuite.performTests();

        // if at least one if the tests is false then the overall status
        // of the test suite is false as well
        this.testResults[testSuiteName] = {
          status:
            testResults.map((t) => t.status).some((s) => s == false) == false
              ? true
              : false,
          totalTests: testSuiteDefinition.tests.length,
          failedTests: testResults.filter((t) => t.status == false).length,
          totalElapsedTime: parseFloat(
            testResults
              .reduce((acc, testResult) => acc + testResult.timings.elapsed, 0)
              .toFixed(2)
          ),
          tests: testResults,
        };

        // for (let test of testSuite.tests) {
        // if (test.type == "scalar") this.processScalar(test);
        // }
        // if (dataTest.Selections) {
        //   // TODO: emit selections
        //   const selection = new Selection(dataTest.Selections, this.qlikApp);
        //   const makeSelections = await selection.makeSelections();
        // }
        // if (dataTest.Tests.Scalar) await this.processScalar(dataTest);
        // if (dataTest.Tests.List) await this.processList(dataTest);
      }
    }

    // return this.testResults.flat();
    return this.testResults;
  }

  private async processMeta() {
    this.emitter.emit("group", {
      group: "Meta",
      message: `Starting Meta tests ...`,
      isFinished: false,
      status: true,
      elapsedTime: -1,
      totalTests: -1,
      failedTests: -1,
    });
    const meta = new Meta(this.specs.spec.meta || undefined, this.qlikApp);
    const metaResult = await meta.run();
    // this.emitter.emit("group", {
    //   group: "Meta",
    //   message: `Meta tests finished`,
    //   isFinished: true,
    //   status: metaResult.status,
    //   elapsedTime: metaResult.elapsedTime,
    //   totalTests: metaResult.totalTests,
    //   failedTests: metaResult.failedTests,
    // });
    this.emitter.emit("group:result", metaResult);
    this.testResults["Meta"] = metaResult;
  }

  private async processScalar(dataTest: TestCase) {
    // this.emitter.emit("group", {
    //   group: "Scalar",
    //   message: `Starting Scalar tests for "${dataTest.name}"`,
    //   isFinished: false,
    //   status: true,
    //   elapsedTime: -1,
    //   totalTests: -1,
    //   failedTests: -1,
    // });
    // const scalar = new Scalar(dataTest.details as IScalar, this.qlikApp);
    // const scalarResult = await scalar.run();
    // this.emitter.emit("group", {
    //   group: "Scalar",
    //   message: `Scalar tests finished`,
    //   isFinished: true,
    //   status: scalarResult.status,
    //   // elapsedTime: scalarResult.elapsedTime,
    //   // totalTests: scalarResult.totalTests,
    //   // failedTests: scalarResult.failedTests,
    // });
    // this.emitter.emit("group:result", scalarResult);
    // this.testResults.push(scalarResult);
  }

  private async processList(dataTest: IData) {
    // const list = new List(dataTest.Tests.List, this.qlikApp);
    // const listResult = await list.run();
    // this.emitter.emit("group", {
    //   group: "Scalar",
    //   message: `Scalar tests finished`,
    //   isFinished: true,
    //   status: scalarResult.status,
    //   elapsedTime: scalarResult.elapsedTime,
    //   totalTests: scalarResult.totalTests,
    //   failedTests: scalarResult.failedTests,
    // });
    // this.emitter.emit("group:result", listResult);
    // this.testResults.push(listResult);
  }

  private async processTable(dataTest: IData) {
    // if (this.specs.spec.Table) {
    //   this.emitter.emit("group", {
    //     group: "Table",
    //     message: `Starting Table tests ...`,
    //     isFinished: false,
    //     status: true,
    //     elapsedTime: -1,
    //     totalTests: -1,
    //     failedTests: -1,
    //   });
    //   const table = new Table(this.specs.spec.Table, this.qlikApp);
    //   const tableResult = await table.run();
    //   this.emitter.emit("group", {
    //     group: "Table",
    //     message: `Table tests finished`,
    //     isFinished: true,
    //     status: tableResult.status,
    //     elapsedTime: tableResult.elapsedTime,
    //     totalTests: tableResult.totalTests,
    //     failedTests: tableResult.failedTests,
    //   });
    //   this.emitter.emit("group:result", tableResult);
    //   this.testResults.push(tableResult);
    // }
  }

  private async processTestSuites() {
    //
  }

  private async validateSelections() {
    const selectionsProps = this.specs.props?.selections
      ? this.propSelectionsToArray()
      : [];

    // extract all selections from all test suite's tests
    // and combine then with the global (props) selections
    const testsSelections = Object.keys(this.specs.spec.data)
      .map((testSuite) =>
        this.specs.spec.data[testSuite].tests
          .map((test) => [
            ...test.selections,
            ...this.specs.spec.data[testSuite].selections,
          ])
          .flat()
      )
      .flat();

    const selectionValidation = new SelectionValidation(
      [...selectionsProps, ...testsSelections] as ISelection[],
      this.specs.props,
      this.qlikApp
    );

    const {
      missingBookmarks,
      missingByNameSelections,
      missingFields,
      duplicatedByName,
    } = await selectionValidation.validateFieldsAndBookmarks();

    const errorMessage = [];

    if (missingBookmarks.length > 0)
      errorMessage.push(
        `Bookmark(s) missing from the app: ${missingBookmarks.join(",")}`
      );

    if (missingFields.length > 0)
      errorMessage.push(
        `Field(s) missing from the app: ${missingFields.join(",")}`
      );

    if (missingByNameSelections.length > 0)
      errorMessage.push(
        `Custom selection(s) missing from the test suite: ${missingByNameSelections.join(
          ","
        )}`
      );

    if (duplicatedByName.length > 0)
      errorMessage.push(
        `Duplicate selection names: ${duplicatedByName.join(",")}`
      );

    if (errorMessage.length > 0) {
      throw new Error(`Initial checks error:\n${errorMessage.join("\n")}`);

      // TODO: emit the error(s) implementation
      // await this.emitter.emit()
    }

    return;
  }

  private propSelectionsToArray() {
    return Object.entries(this.specs.props?.selections).map(
      ([name, selection]) => ({
        name: name,
        selections: selection,
      })
    );
  }
}
