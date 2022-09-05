import { IGroupResult, Root } from "./interface/Specs";
import { Meta } from "./modules/Meta";
import { Scalar } from "./modules/Scalar";
import { List } from "./modules/List";
import { Table } from "./modules/Table";
import { QObject } from "./modules/Object";
import { Selection } from "./modules/Selection";
import { EventsBus } from "./util/EventBus";

// import { Qlik } from "./util/Qlik";
import { IAppMixin } from "./interface/Mixin";

export namespace QlikTesting {
  export class client {
    specs: Root;
    emitter: EventsBus;
    // private qlik: Qlik;
    testResults: IGroupResult[];
    qlikApp: IAppMixin;

    constructor(specs: Root, qlikApp: IAppMixin) {
      this.specs = specs;
      this.qlikApp = qlikApp;
      this.emitter = new EventsBus();
      this.testResults = [];
    }

    async run(): Promise<IGroupResult[]> {
      // await this.qlik.init();

      if (this.specs.selections) {
        this.emitter.emit("all", {
          message: `${this.getTimeStamp()} Applying selections in ${
            this.specs.selections.length
          } field(s)`,
        });

        const selection = new Selection(this.specs.selections, this.qlikApp);
        const makeSelections = await selection.makeSelections();

        this.emitter.emit("all", {
          message: `${this.getTimeStamp()} Selections applied`,
        });
      }

      if (this.specs.spec.Meta) {
        this.emitter.emit("group", {
          group: "Meta",
          message: `${this.getTimeStamp()} Starting Meta tests ...`,
          isFinished: false,
          status: true,
          elapsedTime: -1,
        });

        const meta = new Meta(this.specs.spec.Meta || undefined, this.qlikApp);
        const metaResult = await meta.run();

        this.emitter.emit("group", {
          group: "Meta",
          message: `${this.getTimeStamp()} Meta tests finished`,
          isFinished: true,
          status: metaResult.status,
          elapsedTime: metaResult.elapsedTime,
        });
        this.emitter.emit("group:result", metaResult);

        this.testResults.push(metaResult);
      }

      if (this.specs.spec.Scalar) {
        this.emitter.emit("group", {
          group: "Scalar",
          message: `${this.getTimeStamp()} Starting Scalar tests ...`,
          isFinished: false,
          status: true,
          elapsedTime: -1,
        });

        const scalar = new Scalar(this.specs.spec.Scalar, this.qlikApp);
        const scalarResult = await scalar.run();

        this.emitter.emit("group", {
          group: "Scalar",
          message: `${this.getTimeStamp()} Scalar tests finished`,
          isFinished: true,
          status: scalarResult.status,
          elapsedTime: scalarResult.elapsedTime,
        });
        this.emitter.emit("group:result", scalarResult);

        this.testResults.push(scalarResult);
      }

      if (this.specs.spec.List) {
        this.emitter.emit("group", {
          group: "List",
          message: `${this.getTimeStamp()} Starting Objects tests ...`,
          isFinished: false,
          status: true,
          elapsedTime: -1,
        });

        const list = new List(this.specs.spec.List || undefined, this.qlikApp);
        const listResult = await list.run();

        this.emitter.emit("group", {
          group: "List",
          message: `${this.getTimeStamp()} Objects tests finished`,
          isFinished: true,
          status: listResult.status,
          elapsedTime: listResult.elapsedTime,
        });
        this.emitter.emit("group:result", listResult);

        this.testResults.push(listResult);
      }

      if (this.specs.spec.Object) {
        this.emitter.emit("group", {
          group: "Objects",
          message: `${this.getTimeStamp()} Starting Objects tests ...`,
          isFinished: false,
          status: true,
          elapsedTime: -1,
        });

        const qObject = new QObject(this.specs.spec.Object, this.qlikApp);
        const objectExistsResult = await qObject.run();

        this.emitter.emit("group", {
          group: "Objects",
          message: `${this.getTimeStamp()} Objects tests finished`,
          isFinished: true,
          status: objectExistsResult.status,
          elapsedTime: objectExistsResult.elapsedTime,
        });
        this.emitter.emit("group:result", objectExistsResult);

        this.testResults.push(objectExistsResult);
      }

      if (this.specs.spec.Table) {
        this.emitter.emit("group", {
          group: "Table",
          message: `${this.getTimeStamp()} Starting Table tests ...`,
          isFinished: false,
          status: true,
          elapsedTime: -1,
        });

        const table = new Table(this.specs.spec.Table, this.qlikApp);
        const tableResult = await table.run();

        this.emitter.emit("group", {
          group: "Table",
          message: `${this.getTimeStamp()} Table tests finished`,
          isFinished: true,
          status: tableResult.status,
          elapsedTime: tableResult.elapsedTime,
        });
        this.emitter.emit("group:result", tableResult);

        this.testResults.push(tableResult);
      }

      return this.testResults.flat();
    }

    private getTimeStamp() {
      const d = new Date();
      return d.toLocaleString();
    }
  }
}
