import Ajv from "ajv";
import { IData, IGroupResult, Root } from "./interface/Specs";
import { Meta } from "./modules/Meta";
import { Scalar } from "./modules/Scalar";
import { List } from "./modules/List";
import { Selection } from "./modules/Selection";
import { EventsBus } from "./util/EventBus";
// import { Table } from "./modules/Table";

import { IAppMixin } from "./interface/Mixin";
import * as schema from "./schema/root.json" assert { type: "json" };

import draft from "ajv/dist/refs/json-schema-draft-06.json" assert { type: "json" };

// export namespace TestOMatiq {
export class TestOMatiq {
  specs: Root;
  emitter: EventsBus;
  testResults: IGroupResult[];
  qlikApp: IAppMixin;
  testGroups: string[];

  constructor(specs: Root, qlikApp: IAppMixin) {
    this.specs = specs;
    this.qlikApp = qlikApp;
    this.emitter = new EventsBus();
    this.testResults = [];

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

    if (isValidSpec == false)
      throw {
        message: "Error(s) while validating the input",
        errors: ajv.errors,
      };
  }

  async run(): Promise<IGroupResult[]> {
    if (this.specs.spec.Meta) await this.processMeta();

    if (this.specs.spec.Data) {
      for (let dataTest of this.specs.spec.Data) {
        if (dataTest.Selections) {
          // TODO: emit selections
          const selection = new Selection(dataTest.Selections, this.qlikApp);
          const makeSelections = await selection.makeSelections();
        }

        if (dataTest.Tests.Scalar) await this.processScalar(dataTest);
        if (dataTest.Tests.List) await this.processList(dataTest);
      }
    }

    return this.testResults.flat();
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

    const meta = new Meta(this.specs.spec.Meta || undefined, this.qlikApp);
    const metaResult = await meta.run();

    this.emitter.emit("group", {
      group: "Meta",
      message: `Meta tests finished`,
      isFinished: true,
      status: metaResult.status,
      elapsedTime: metaResult.elapsedTime,
      totalTests: metaResult.totalTests,
      failedTests: metaResult.failedTests,
    });
    this.emitter.emit("group:result", metaResult);

    this.testResults.push(metaResult);
  }

  private async processScalar(dataTest: IData) {
    this.emitter.emit("group", {
      group: "Scalar",
      message: `Starting Scalar tests for "${dataTest.Name}"`,
      isFinished: false,
      status: true,
      elapsedTime: -1,
      totalTests: -1,
      failedTests: -1,
    });

    const scalar = new Scalar(dataTest.Tests.Scalar, this.qlikApp);
    const scalarResult = await scalar.run();

    this.emitter.emit("group", {
      group: "Scalar",
      message: `Scalar tests finished`,
      isFinished: true,
      status: scalarResult.status,
      elapsedTime: scalarResult.elapsedTime,
      totalTests: scalarResult.totalTests,
      failedTests: scalarResult.failedTests,
    });
    this.emitter.emit("group:result", scalarResult);

    this.testResults.push(scalarResult);
  }

  private async processList(dataTest: IData) {
    const list = new List(dataTest.Tests.List, this.qlikApp);
    const listResult = await list.run();

    // this.emitter.emit("group", {
    //   group: "Scalar",
    //   message: `Scalar tests finished`,
    //   isFinished: true,
    //   status: scalarResult.status,
    //   elapsedTime: scalarResult.elapsedTime,
    //   totalTests: scalarResult.totalTests,
    //   failedTests: scalarResult.failedTests,
    // });
    this.emitter.emit("group:result", listResult);

    this.testResults.push(listResult);
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
}
