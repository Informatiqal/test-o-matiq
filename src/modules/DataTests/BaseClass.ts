import {
  ISelection,
  TestCase,
  TestEvaluationResult,
  qSelections,
} from "../../interface/Specs";
import { groupByKey } from "../../util/common";
import { Engine } from "../Engine";
import { Selection } from "../Engine/Selections";

export interface CurrentSelections {
  selections: {
    state: string;
    selections: qSelections[];
  }[];
  timings: {
    start: string;
    end: string;
    elapsed: number;
    message?: string;
  };
}

export abstract class DataTestsBase {
  abstract test: TestCase;
  abstract selections: Selection;
  abstract engine: Engine;

  constructor() {}

  abstract process(): Promise<TestEvaluationResult>;

  async applySelections(): Promise<CurrentSelections> {
    const _this = this;
    if (this.test.selections) {
      const s = groupByKey<ISelection>(this.test.selections, "app");

      // "move" the selections without specified app under the main app
      if (s["undefined"]) {
        s[this.engine.mainApp] = [
          ...(s[this.engine.mainApp] || []),
          ...s["undefined"],
        ];
        delete s["undefined"];
      }

      await Promise.all(
        Object.entries(s).map(([key, data]) =>
          _this.engine.enigmaData[key].selection
            .makeSelections(data)
            .then((s) => {
              s["app"] = key;
              return s;
            })
        )
      );
    }

    // const currentSelections = await this.selections.getCurrentSelections();
    const currentSelections = await this.engine.getAllCurrentSelections();

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
