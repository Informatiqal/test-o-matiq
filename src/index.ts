import Ajv from "ajv";
import { IGroupResult, Root } from "./interface/Specs";
import { Meta } from "./modules/Meta";
import { Scalar } from "./modules/Scalar";
import { List } from "./modules/List";
import { Table } from "./modules/Table";
import { QObject } from "./modules/Object";
import { Selection } from "./modules/Selection";
import { EventsBus } from "./util/EventBus";

import { IAppMixin } from "./interface/Mixin";
import * as schema from "./schema/root.json";

import draft from "ajv/dist/refs/json-schema-draft-06.json";

export namespace TestOMatiq {
  export class client {
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

      this.testGroups = Object.entries(specs.spec).map((value) =>
        value[0].toString()
      );

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
      if (this.specs.selections) {
        this.emitter.emit("all", {
          message: `Applying selections in ${this.specs.selections.length} field(s)`,
        });

        const selection = new Selection(this.specs.selections, this.qlikApp);
        const makeSelections = await selection.makeSelections();

        this.emitter.emit("all", {
          message: `Selections applied`,
        });
      }

      if (this.specs.spec.Meta) {
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

      if (this.specs.spec.Scalar) {
        this.emitter.emit("group", {
          group: "Scalar",
          message: `Starting Scalar tests ...`,
          isFinished: false,
          status: true,
          elapsedTime: -1,
          totalTests: -1,
          failedTests: -1,
        });

        const scalar = new Scalar(this.specs.spec.Scalar, this.qlikApp);
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

      if (this.specs.spec.List) {
        this.emitter.emit("group", {
          group: "List",
          message: `Starting Objects tests ...`,
          isFinished: false,
          status: true,
          elapsedTime: -1,
          totalTests: -1,
          failedTests: -1,
        });

        const list = new List(this.specs.spec.List || undefined, this.qlikApp);
        const listResult = await list.run();

        this.emitter.emit("group", {
          group: "List",
          message: `Objects tests finished`,
          isFinished: true,
          status: listResult.status,
          elapsedTime: listResult.elapsedTime,
          totalTests: listResult.totalTests,
          failedTests: listResult.failedTests,
        });
        this.emitter.emit("group:result", listResult);

        this.testResults.push(listResult);
      }

      if (this.specs.spec.Object) {
        this.emitter.emit("group", {
          group: "Objects",
          message: `Starting Objects tests ...`,
          isFinished: false,
          status: true,
          elapsedTime: -1,
          totalTests: -1,
          failedTests: -1,
        });

        const qObject = new QObject(this.specs.spec.Object, this.qlikApp);
        const objectExistsResult = await qObject.run();

        this.emitter.emit("group", {
          group: "Objects",
          message: `Objects tests finished`,
          isFinished: true,
          status: objectExistsResult.status,
          elapsedTime: objectExistsResult.elapsedTime,
          totalTests: objectExistsResult.totalTests,
          failedTests: objectExistsResult.failedTests,
        });
        this.emitter.emit("group:result", objectExistsResult);

        this.testResults.push(objectExistsResult);
      }

      if (this.specs.spec.Table) {
        this.emitter.emit("group", {
          group: "Table",
          message: `Starting Table tests ...`,
          isFinished: false,
          status: true,
          elapsedTime: -1,
          totalTests: -1,
          failedTests: -1,
        });

        const table = new Table(this.specs.spec.Table, this.qlikApp);
        const tableResult = await table.run();

        this.emitter.emit("group", {
          group: "Table",
          message: `Table tests finished`,
          isFinished: true,
          status: tableResult.status,
          elapsedTime: tableResult.elapsedTime,
          totalTests: tableResult.totalTests,
          failedTests: tableResult.failedTests,
        });
        this.emitter.emit("group:result", tableResult);

        this.testResults.push(tableResult);
      }

      return this.testResults.flat();
    }

    // private getTimeStamp() {
    //   const d = new Date();
    //   return d.toLocaleString();
    // }
  }
}
