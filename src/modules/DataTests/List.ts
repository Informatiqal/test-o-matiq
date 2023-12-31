import { IAppMixin } from "../../interface/Mixin";
import { EventsBus } from "../../util/EventBus";
import { IList, ITestDataResult, TestCase } from "../../interface/Specs";
import { Timing, concatResults } from "../../util/common";
import { Selection } from "../Engine/Selections";
import { DataTestsBase } from "./BaseClass";
import { Engine } from "../Engine";

export class List extends DataTestsBase {
  // private app: IAppMixin;
  private testDetails: IList;
  test: TestCase;
  selections: Selection;
  private emitter: EventsBus;
  private timing: Timing;
  engine: Engine;

  constructor(test: TestCase) {
    super();

    this.test = test;
    // this.selections = Selection.getInstance({});
    this.testDetails = test.details as IList;
    // this.app = app;
    this.emitter = new EventsBus();
    this.timing = new Timing();
    this.engine = Engine.getInstance();
  }

  async process(): Promise<ITestDataResult> {
    this.timing.start();
    this.emitter.emit("testStart", this.test.name);

    // apply the required selections
    const currentSelections = await this.applySelections();

    const listValues = await this.engine[this.engine.mainApp]
      .mCreateSessionListbox(this.testDetails.fieldName, {
        destroyOnComplete: true,
        getAllData: true,
        state: this.testDetails.state ?? "$",
      })
      .then((res) =>
        res.flattenData().map((f) => ({
          qText: f.qText,
          qState: f.qState,
        }))
      );

    const rawValues = listValues.map((v) => v.qText);

    let testStatus = true;
    let testStatusMessage = "";

    if (this.testDetails.operation == "present") {
      const notFound = this.testDetails.values.filter(
        (x) => !rawValues.includes(x)
      );
      if (notFound.length > 0) {
        testStatus = false;
        testStatusMessage = `Values not found - ${concatResults(notFound)}`;
      } else {
        testStatusMessage = "All specified values exists in the field/list";
      }
    }

    if (this.testDetails.operation == "missing") {
      const found = this.testDetails.values.filter((x) =>
        rawValues.includes(x)
      );

      if (found.length > 0) {
        testStatus = false;
        testStatusMessage = `Values found - ${concatResults(found)}`;
      } else {
        testStatusMessage =
          "All specified values do not exists in the field/list";
      }
    }

    this.timing.stop();

    const result: ITestDataResult = {
      name: this.test.name,
      status: testStatus,
      type: "list",
      timings: {
        start: this.timing.startTime,
        end: this.timing.endTime,
        elapsed: this.timing.elapsedTime,
      },
      message: testStatusMessage,
      currentSelections: currentSelections,
    };

    this.emitter.emit("testResult", result);

    return result;
  }
}
