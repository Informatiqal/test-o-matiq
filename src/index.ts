import Ajv from "ajv";
import {
  App,
  IPropsSelectionArray,
  IScalar,
  ISelection,
  ITestDataResult,
  ITestMetaResult,
  Runbook,
} from "./interface/Specs";
import { Selection, SelectionValidation } from "./modules/Selections";
import { EventsBus } from "./util/EventBus";
import { TestSuite } from "./modules/DataTests";
import { Meta } from "./modules/MetaTests";
import { Engine } from "./util/Engine";

import { IAppMixin } from "./interface/Mixin";

import draft from "ajv/dist/refs/json-schema-draft-06.json" assert { type: "json" };
import * as schema from "./schema/schema.json" assert { type: "json" };
import * as enigmaSchema from "enigma.js/schemas/12.20.0.json" assert { type: "json" };
import { docMixin } from "enigma-mixin";
import * as enigma from "enigma.js";
import WebSocket from "ws";

export class TestOMatiq {
  specs: Runbook;
  emitter: EventsBus;
  testResults: { [k: string]: ITestDataResult[] | ITestMetaResult[] };
  // qlikApps: { name: string; app: IAppMixin; isMain: boolean }[];
  qlikApps: { [k: string]: App };
  private engine: { [key: string]: Engine } = {};
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

    // if (validateSchema != undefined) validateSchema = validateSchema || true;

    const selectionsProps = this.specs.props?.selections
      ? this.propSelectionsToArray()
      : [];

    // Object.entries(this.qlikApps).forEach(([name, qlikApp]) => {
    //   this.selections[name] = Selection.getInstance({
    //     app: qlikApp.app,
    //   });

    //   this.selections[name].setPropsSelections(
    //     selectionsProps as IPropsSelectionArray[]
    //   );
    //   this.engine[name] = Engine.getInstance(qlikApp.app);

    //   if (qlikApp.isMain) this.mainApp = name;
    // });

    // if (Object.keys(this.qlikApps).length == 1)
    //   this.mainApp = Object.keys(this.qlikApps)[0];

    // this.testGroups = Object.entries(specs.spec).map((value) =>
    //   value[0].toString()
    // );

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
    await this.openApps();
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

    // await this.validateExpressions();
    // if (this.specs.props?.selections) await this.validateSelections();
    // this.validateTaskOperatorResult();

    if (this.specs.props?.variables) await this.createSessionVariables();
    if (this.specs.spec?.meta) await this.runMetaTests();
    if (this.specs.spec?.data) await this.runDataTests();

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
    const meta = new Meta(
      this.specs.spec.meta || undefined,
      this.engine[this.mainApp].qApp
    );
    const metaResult = await meta.run();

    // this.emitter.emit("group:result", metaResult);
    this.testResults["meta"] = metaResult;
  }

  private async runDataTests() {
    for (let [testSuiteName, testSuiteDefinition] of Object.entries(
      this.specs.spec.data
    )) {
      const testSuite = new TestSuite(
        testSuiteDefinition,
        this.engine[this.mainApp].qApp
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

    // validate all session variables
    if (this.specs.props?.variables) {
      await Promise.all(
        Object.entries(this.specs.props.variables).map(
          ([varName, varDefinition]) => {
            // TODO: only the main app?
            return _this.engine[this.mainApp].qApp
              .checkExpression(
                varDefinition["expression"]
                  ? varDefinition["expression"]
                  : varDefinition
              )
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
          // TODO: only the main app?
          return _this.engine[this.mainApp].qApp
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

  /**
   * Create the specified session variables (if any)
   */
  private async createSessionVariables() {
    for (let [varName, varDefinition] of Object.entries(
      this.specs.props.variables
    )) {
      // assume the main qlik app
      let qlikApp = this.engine[this.mainApp].qApp;

      // if specific app is defined then create the
      // variable there
      if (varDefinition["app"]) {
        qlikApp = this.engine[varDefinition["app"]].qApp;
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

  /**
   * Open all apps specified in the environment.apps section
   * If any of the apps fails (for some reason) then fail everything and dont continue
   */
  private async openApps() {
    const _this = this;

    const enigmaConfig: enigmaJS.IConfig = {
      Promise: Promise,
      schema: enigmaSchema,
      mixins: docMixin,
      url: "ws://127.0.0.1:4848/app/engineData",
      createSocket: (url) => new WebSocket(url),
    };

    const selectionsProps = this.specs.props?.selections
      ? this.propSelectionsToArray()
      : [];

    await Promise.all(
      Object.keys(this.specs.environment.apps).map(async (a) => {
        const enigmaClass = (enigma as any).default as IEnigmaClass;
        const qlikSession = enigmaClass.create(enigmaConfig);
        const global: EngineAPI.IGlobal = await qlikSession.open();
        const doc = (await global.openDoc(
          _this.specs.environment.apps[a].id
        )) as IAppMixin;

        this.selections[a] = Selection.getInstance({
          app: doc,
        });

        this.selections[a].setPropsSelections(
          selectionsProps as IPropsSelectionArray[]
        );

        _this.engine[a] = Engine.getInstance(doc);
        if (this.specs.environment.apps[a].isMain) this.mainApp = a;

        // get apps alternate states and sets them into the selections class
        const alternateStates = await doc
          .getAppLayout()
          .then((layout) => layout.qStateNames);

        this.selections[a].setAlternateStates(alternateStates);
      })
    );

    if (Object.keys(this.engine).length == 1 && !this.mainApp)
      this.mainApp = Object.keys(this.engine)[0];
  }
}
