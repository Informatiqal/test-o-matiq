import { IAppMixin } from "../../interface/Mixin";
import { EventsBus } from "../../util/EventBus";
import { IList, TestCase, TestEvaluationResult } from "../../interface/Specs";
import { Timing, concatResults } from "../../util/common";
import { Selection } from "../../modules/Selections";
import { DataTestsBase } from "./BaseClass";

export class List extends DataTestsBase {
  private app: IAppMixin;
  test: TestCase;
  private testDetails: IList;
  private emitter: EventsBus;
  selections: Selection;
  private timing: Timing;

  constructor(test: TestCase, app: IAppMixin) {
    super();

    this.test = test;
    this.selections = Selection.getInstance();
    this.testDetails = test.details as IList;
    this.app = app;
    this.emitter = new EventsBus();
    this.timing = new Timing();
  }

  async process(): Promise<TestEvaluationResult> {
    this.timing.start();

    // apply the required selections
    const currentSelections = await this.applySelections();

    const listValues = await this.app
      .mCreateSessionListbox(this.testDetails.fieldName, {
        destroyOnComplete: true,
        getAllData: true,
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
        testStatusMessage = `Failed: Values not found - ${concatResults(
          notFound
        )}`;
      } else {
        testStatusMessage =
          "Passed: All specified values exists in the field/list";
      }
    }

    if (this.testDetails.operation == "missing") {
      const found = this.testDetails.values.filter((x) =>
        rawValues.includes(x)
      );

      if (found.length > 0) {
        testStatus = false;
        testStatusMessage = `Failed: Values found - ${concatResults(found)}`;
      } else {
        testStatusMessage =
          "Passed: All specified values do not exists in the field/list";
      }
    }

    this.timing.stop();

    return {
      status: testStatus,
      name: this.test.name,
      type: "scalar",
      timings: {
        start: this.timing.startTime,
        end: this.timing.endTime,
        elapsed: this.timing.elapsedTime,
      },
      message: testStatusMessage,
      currentSelections: currentSelections,
    };
  }
}
