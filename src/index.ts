import Ajv from "ajv";
import {
  IPropsSelectionArray,
  IScalar,
  ISelection,
  ITableTestCase,
  Runbook,
  TestSuiteResult,
} from "./interface/Specs";
import { Selection, SelectionValidation } from "./modules/Selections";
import { EventsBus } from "./util/EventBus";
import { TestSuite } from "./modules/DataTests";
import { Meta } from "./modules/MetaTests";
import { Engine } from "./util/Engine";

import { IAppMixin } from "./interface/Mixin";
import * as schema from "./schema/schema.json" assert { type: "json" };

import draft from "ajv/dist/refs/json-schema-draft-06.json" assert { type: "json" };

export class TestOMatiq {
  specs: Runbook;
  emitter: EventsBus;
  testResults: { [k: string]: TestSuiteResult };
  qlikApp: IAppMixin;
  engine: Engine;

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

    this.engine = Engine.getInstance(this.qlikApp);

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

    await this.validateExpressions();
    if (this.specs.props?.selections) await this.validateSelections();
    // this.validateTaskOperatorResult();

    if (this.specs.props.variables) await this.createSessionVariables();
    if (this.specs.spec.meta) await this.processMeta();
    if (this.specs.spec.data) await this.runTestSuites();

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

  /**
   * Validate if:
   *
   * - the provided bookmarks exists in the app
   * - selections fields exists in the app
   * - byName selections exists in props section
   */
  private async validateSelections() {
    const selectionsProps = this.specs.props.selections
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

  /**
   * Once the app is open loop through the expressions and validate them
   * (for syntax and semantic errors)
   */
  private async validateExpressions(): Promise<void> {
    const _this = this;
    let failedValidations = [];

    // validate all session variables
    if (this.specs.props.variables) {
      await Promise.all(
        Object.entries(this.specs.props.variables).map(
          ([varName, varDefinition]) => {
            return _this.engine
              .checkExpression(varDefinition)
              .then((v) => null)
              .catch(
                (e) =>
                  `Session variable "${varName}" validation failed -> ${e.message}`
              );
          }
        )
      )
        .then((validations) => validations.filter((v) => v != null))
        .then((validations) => {
          failedValidations.push(...validations);
        });
    }

    // get all possible tests
    const availableTests = Object.entries(this.specs.spec.data)
      .map(([_, tsDef]) => tsDef.tests)
      .flat();

    await Promise.all(
      availableTests.map((test) => {
        // TODO: validate the possible expressions in the result property
        // validate scalar tests
        if (test.type == "scalar") {
          return _this.engine
            .checkExpression((test.details as IScalar).expression)
            .then((v) => null)
            .catch(
              (e) =>
                `Test "${test.name}" expression validation failed -> ${e.message}`
            );
        }

        // TODO: to validate the possible calculated dimensions
        // validate tables measures expressions
        // if (test.type == "table") {
        //   return Promise.all(
        //     (test.details as ITableTestCase).measures.map((m) => {
        //       return _this.engine
        //         .checkExpression(m)
        //         .then((v) => null)
        //         .catch(
        //           (e) =>
        //             `Test "${test.name}" measure validation failed -> ${e.message}`
        //         );
        //     })
        //   ).then((validations) => validations.flat().filter((v) => v != null));
        // }
      })
    )
      .then((validations) => validations.flat().filter((v) => v != null))
      .then((validations) => {
        failedValidations.push(...validations);
      });

    if (failedValidations.length > 0)
      throw new Error(
        `Failed expression validations:\n${failedValidations.join("\n")}`
      );
  }

  private propSelectionsToArray() {
    return Object.entries(this.specs.props?.selections).map(
      ([name, selection]) => ({
        name: name,
        selections: selection,
      })
    );
  }

  private async createSessionVariables() {
    for (let [varName, varDefinition] of Object.entries(
      this.specs.props.variables
    )) {
      await this.qlikApp.createSessionVariable({
        qName: varName,
        qDefinition: varDefinition,
        qIncludeInBookmark: false,
        qInfo: {
          qType: "test-o-matiq-variable",
        },
      });
    }
  }

  private async runTestSuites() {
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

  private validateTaskOperatorResult() {
    // const availableTests = Object.entries(this.specs.spec.data)
    //   .map(([tsName, tsDef]) => tsDef.tests)
    //   .flat();
    // const f = availableTests
    //   .filter((t) => t.type == "scalar")
    //   .map((t) => {
    //     const details = t.details as IScalar;
    //   });
  }
}
