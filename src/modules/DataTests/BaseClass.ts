import { TestCase, TestEvaluationResult } from "../../interface/Specs";
import { Selection } from "../Selections";

export abstract class DataTestsBase {
  abstract test: TestCase;
  abstract selections: Selection;

  constructor() {}

  abstract process(): Promise<TestEvaluationResult>;

  async applySelections(state: string) {
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
