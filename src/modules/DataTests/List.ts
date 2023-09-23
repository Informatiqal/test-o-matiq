import { IList, TestCase, TestEvaluationResult } from "../../interface/Specs";
import { Selection } from "../Selections";
import { EventsBus } from "../../util/EventBus";
import { Timing, concatResults } from "../../util/common";
import { IAppMixin } from "../../interface/Mixin";

export class List {
  private app: IAppMixin;
  private list: IList;
  private test: TestCase;
  private emitter: EventsBus;
  private selections: Selection;
  private timing: Timing;

  constructor(test: TestCase, app: IAppMixin) {
    this.test = test;
    this.list = test.details as IList;
    this.app = app;
    this.emitter = new EventsBus();
    this.selections = Selection.getInstance();
    this.timing = new Timing();
  }

  async run(): Promise<TestEvaluationResult> {
    this.timing.start();

    // apply the required selections
    const currentSelections = await this.applySelections();

    const listValues = await this.app
      .mCreateSessionListbox(this.list.name, {
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

    if (this.list.operation == "present") {
      const notFound = this.list.values.filter((x) => !rawValues.includes(x));
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

    if (this.list.operation == "missing") {
      const found = this.list.values.filter((x) => rawValues.includes(x));

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

  private async applySelections() {
    if (this.test.selections)
      return await this.selections.makeSelections(this.test.selections);

    const currentSelections = await this.selections.getCurrentSelections();

    return {
      selections: currentSelections,
      timings: {
        start: "n/a",
        end: "n/a",
        elapsed: 0,
        message:
          "No timings to be captured. No selections to be made. Returning the currently active selections",
      },
    };
  }
}
