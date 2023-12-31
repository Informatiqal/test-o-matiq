import Ajv from "ajv";
import {
  App,
  IPropsSelectionArray,
  IScalar,
  ISelection,
  ITestDataResult,
  ITestMetaResult,
  Runbook,
  TestCase,
} from "./interface/Specs";
import { Selection, SelectionValidation } from "./modules/Engine/Selections";
import { EventsBus } from "./util/EventBus";
import { TestSuite } from "./modules/DataTests";
import { Meta } from "./modules/MetaTests";
import { Engine } from "./modules/Engine";

import { IAppMixin } from "./interface/Mixin";

import draft from "ajv/dist/refs/json-schema-draft-06.json" assert { type: "json" };
import * as schema from "./schema/schema.json" assert { type: "json" };
// import * as enigmaSchema from "enigma.js/schemas/12.20.0.json" assert { type: "json" };
// import { docMixin } from "enigma-mixin";
// import * as enigma from "enigma.js";
// import WebSocket from "ws";

export class TestOMatiq {
  specs: Runbook;
  emitter: EventsBus;
  testResults: { [k: string]: ITestDataResult[] | ITestMetaResult[] };
  // qlikApps: { name: string; app: IAppMixin; isMain: boolean }[];
  qlikApps: { [k: string]: App };
  private engine: Engine;
  private selections: { [key: string]: Selection } = {};
  // private mainApp: { name: string; app: IAppMixin; isMain: boolean };
  private mainApp: string;

  constructor(
    specs: Runbook,
    // qlikApps: { name: string; app: IAppMixin; isMain: boolean }[],
    // qlikApps: { [k: string]: App },
    validateSchema?: boolean
  ) {
    this.specs = specs;
    // this.qlikApps = qlikApps;
    // this.qlikApps = qlikApps;
    this.emitter = new EventsBus();
    this.testResults = {};

    this.engine = Engine.getInstance(this.getMainApp());

    // if (validateSchema != undefined) validateSchema = validateSchema || true;

    // validate the schema by default but have the option to suppress it as well
    if (validateSchema) {
      const ajv = new Ajv({
        strict: true,
        allowUnionTypes: true,
        allErrors: true,
      });
      ajv.addMetaSchema(draft);

      const isValidSpec = ajv.validate(schema, specs);

      if (isValidSpec == false)
        throw {
          message: "Error(s) while validating the input",
          errors: ajv.errors,
        };
    }
  }

  //TODO: filter testSuites based on the provided option (if any. if not - all testSuites are active)
  async run(options?: { testSuites?: string[] }): Promise<{
    tests: { [k: string]: ITestDataResult[] | ITestMetaResult[] };
    totalTime: number;
    failedTests: number;
    passedTests: number;
  }> {
    const selectionsProps = this.specs.props?.selections
      ? this.propSelectionsToArray()
      : [];

    await this.engine.openApps(this.specs.environment.apps, selectionsProps);

    // check if test suites have to be filtered first
    if (options?.testSuites?.length > 0)
      this.specs.spec.data = Object.fromEntries(
        options.testSuites
          .map((k) => {
            if (!this.specs.spec.data || !this.specs.spec.data[k]) return [];
            return [k, this.specs.spec.data[k]];
          })
          .filter((k) => k.length > 0)
      );

    // if (!this.specs.spec.meta && !this.specs.spec.data) return {};

    await this.validateExpressions();
    // if (this.specs.props?.selections) await this.validateSelections();
    // this.validateTaskOperatorResult();

    if (this.specs.props?.variables) await this.createSessionVariables();
    if (this.specs.spec?.meta) await this.runMetaTests();
    if (this.specs.spec?.data) await this.runDataTests();

    // TODO: close all sessions on any exit as well!
    // try and close all the sessions before exit
    try {
      await Promise.all(
        Object.entries(this.engine.enigmaData).map(([key, data]) => {
          data.session.close();
        })
      );
    } catch (e) {}

    let failedTests = 0;
    let passedTests = 0;
    let totalTime = 0;

    Object.entries(this.testResults).map(([testName, testsResults]) => {
      testsResults.map((test: ITestDataResult) => {
        test.status ? passedTests++ : failedTests++;
        totalTime += test.timings.elapsed;
      });
    });

    return {
      tests: this.testResults,
      totalTime: totalTime,
      passedTests: passedTests,
      failedTests: failedTests,
    };
  }

  private async runMetaTests() {
    const meta = new Meta(this.specs.spec.meta || undefined);
    const metaResult = await meta.run();

    // this.emitter.emit("group:result", metaResult);
    this.testResults["meta"] = metaResult;
  }

  private async runDataTests() {
    for (let [testSuiteName, testSuiteDefinition] of Object.entries(
      this.specs.spec.data
    )) {
      const testSuite = new TestSuite(
        testSuiteDefinition
        // this.engine[this.mainApp].qApp
      );

      const testResults = await testSuite.performTests();

      this.testResults[testSuiteName] = testResults;
    }
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
            ...(test.selections ?? []),
            ...(this.specs.spec.data[testSuite].selections ?? []),
          ])
          .flat()
      )
      .flat();

    const selectionValidation = new SelectionValidation(
      [...selectionsProps, ...testsSelections] as ISelection[],
      this.specs.props,
      // TODO: only the main app?
      this.engine[this.mainApp].qApp
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

    const variablesValidationResult = await this.validateVariables();
    failedValidations.push(...variablesValidationResult);

    // get all possible tests
    const availableTests = Object.entries(this.specs.spec.data)
      .map(([_, tsDef]) => tsDef.tests)
      .flat();

    const scalarTests = availableTests.filter((t) => t.type == "scalar");
    const scalarValidationResult = await this.validateScalarExpressions(
      scalarTests
    );
    failedValidations.push(...scalarValidationResult);

    failedValidations = failedValidations.flat();

    if (failedValidations.length > 0)
      throw new Error(
        `Failed expression validations:\n${failedValidations.join("\n")}`
      );
  }

  /**
   * Validate if the expressions specified in the variables
   * are valid expressions (syntax, fields, functions etc)
   */
  private async validateVariables() {
    if (!this.specs.props?.variables) return [];
    const _this = this;

    return await Promise.all(
      Object.entries(this.specs.props.variables).map(
        ([varName, varDefinition]) => {
          const varApp: string = varDefinition["app"]
            ? varDefinition["app"]
            : _this.engine.mainApp;

          return _this.engine.enigmaData[varApp].app
            .checkExpression(
              varDefinition["expression"]
                ? varDefinition["expression"]
                : varDefinition
            )
            .then((v) => null)
            .catch(
              (e) =>
                `Session variable "${varName}" validation failed in app "${varApp}" -> ${e.message}`
            );
        }
      )
    ).then((validations) => validations.filter((v) => v != null));
  }

  private async validateScalarExpressions(scalarTests: TestCase[]) {
    if (scalarTests.length == 0) return [];
    const _this = this;

    let expressions: { value: string; app: string; testName: string }[][] =
      scalarTests.map((test) => {
        const exp = [];
        exp.push({
          value: test.details["expression"],
          app: _this.engine.mainApp,
          testName: test.name,
        });

        (test.details as IScalar).results.map((result) => {
          if (result.value.toString().startsWith("=")) {
            exp.push({
              value: result.value,
              app: result.app || _this.engine.mainApp,
              testName: test.name,
            });
          }
        });

        return exp;
      });

    return await Promise.all(
      expressions.flat().map((expression) => {
        return _this.engine.enigmaData[expression.app].app
          .checkExpression(expression.value)
          .then((v) => {
            if (v.qErrorMsg.length > 0)
              return `Test "${expression.testName}" expression validation failed in app "${expression.app}" -> ${v.qErrorMsg}`;

            if (v.qBadFieldNames.length > 0)
              return `Test "${
                expression.testName
              }" found bad field names in app "${
                expression.app
              }" -> ${v.qBadFieldNames.join(", ")}`;

            if (v.qDangerousFieldNames.length > 0)
              return `Test "${
                expression.testName
              }" found dangerous field names in app "${
                expression.app
              }" -> ${v.qDangerousFieldNames.join(", ")}`;

            return null;
          })
          .catch(
            (e) =>
              `Test "${expression.testName}" expression validation failed in app "${expression.app}" -> ${e.message}`
          );
      })
    ).then((validations) => validations.flat().filter((v) => v != null));
  }

  private async validateTable() {
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
  }

  private propSelectionsToArray() {
    return Object.entries(this.specs.props?.selections).map(
      ([name, selection]) => ({
        name: name,
        selections: selection,
      })
    );
  }

  /**
   * Create the specified session variables (if any)
   */
  private async createSessionVariables() {
    // TODO: group the variables by app to speed the variable creation
    for (let [varName, varDefinition] of Object.entries(
      this.specs.props.variables
    )) {
      // assume the main qlik app
      let qlikApp = this.engine.enigmaData[this.engine.mainApp].app;

      // if specific app is defined then create the
      // variable there
      if (varDefinition["app"]) {
        qlikApp = this.engine.enigmaData[varDefinition["app"]].app;
      }

      await qlikApp.createSessionVariable({
        qName: varName,
        qDefinition: varDefinition["expression"]
          ? varDefinition["expression"]
          : varDefinition,
        qIncludeInBookmark: false,
        qInfo: {
          qType: "test-o-matiq-variable",
        },
      });
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

  private getMainApp(): string {
    // TODO: extend the checks more?
    if (
      !this.specs.environment.mainApp &&
      Object.keys(this.specs.environment.apps).length > 1
    )
      throw new Error("Please specify which is the main app");

    if (!this.specs.environment.apps[this.specs.environment.mainApp])
      throw new Error(
        `Specified main app do not exists in the "environment.apps" section `
      );

    // if at the end mainApp is set then return it
    if (this.specs.environment.mainApp) return this.specs.environment.mainApp;
    // else there is only one app specified so return its key
    return Object.keys(this.specs.environment.apps)[0];
  }
}
