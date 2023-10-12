import { IMetaVariable, ITestMetaResult } from "../../interface/Specs";
import { EventsBus } from "../../util/EventBus";
import { Timing, concatResults } from "../../util/common";

export class VariablesExists {
  private app: EngineAPI.IApp;
  private variables: IMetaVariable;
  private emitter: EventsBus;

  constructor(variables: IMetaVariable, app: EngineAPI.IApp) {
    this.variables = variables;
    this.app = app;
    this.emitter = new EventsBus();
  }

  async process(): Promise<ITestMetaResult[]> {
    let promises = [];

    if (this.variables.DoNotExists) promises.push(this.variablesDoNotExists());
    if (this.variables.Exists) promises.push(this.variablesExists());

    return await Promise.all(promises).then((r) => r.flat());
  }

  /**
   * Check if the provided variables exists in the app
   */
  async variablesExists(): Promise<ITestMetaResult> {
    const timing = new Timing();
    timing.start();

    const notFoundVariables = await Promise.all(
      this.variables.Exists.map(async (t) =>
        this.app
          .getVariableByName(t)
          .then((v) => ({
            name: t,
            exists: true,
          }))
          .catch((e) => ({
            name: t,
            exists: false,
          }))
      )
    )
      .then((variables) => variables.filter((v) => v.exists == false))
      .then((subset) => subset.map((s) => s.name));

    timing.stop();

    const result: ITestMetaResult = {
      name: "Meta -> Variables -> Exists",
      status: notFoundVariables.length > 0 ? false : true,
      message:
        notFoundVariables.length > 0
          ? `Variable(s) not found: ${concatResults(notFoundVariables)}`
          : `All variables do not exists`,
      type: "meta",
      timings: {
        start: timing.startTime,
        end: timing.endTime,
        elapsed: timing.elapsedTime,
      },
    };

    this.emitter.emit("testResult", result);

    return result;
  }

  /**
   * Check if the provided variables do not exists in the app
   */
  async variablesDoNotExists(): Promise<ITestMetaResult> {
    const timing = new Timing();
    timing.start();

    const foundVariables = await Promise.all(
      this.variables.DoNotExists.map(async (t) =>
        this.app
          .getVariableByName(t)
          .then((v) => ({
            name: t,
            exists: true,
          }))
          .catch((e) => ({
            name: t,
            exists: false,
          }))
      )
    )
      .then((variables) => variables.filter((v) => v.exists == true))
      .then((subset) => subset.map((s) => s.name));

    timing.stop();

    const result: ITestMetaResult = {
      name: "Meta -> Variables -> DoNotExists",
      status: foundVariables.length > 0 ? false : true,
      message:
        foundVariables.length > 0
          ? `Variable(s) found: ${concatResults(foundVariables)}`
          : `All variables do not exists`,
      type: "meta",
      timings: {
        start: timing.startTime,
        end: timing.endTime,
        elapsed: timing.elapsedTime,
      },
    };

    this.emitter.emit("testResult", result);

    return result;
  }
}
