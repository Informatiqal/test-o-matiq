import { IMetaVariable, ITestResponse } from "../../interface/Specs";
import { EventsBus } from "../../util/EventBus";

export class VariablesExists {
  private app: EngineAPI.IApp;
  private variables: IMetaVariable;
  private emitter: EventsBus;

  constructor(variables: IMetaVariable, app: EngineAPI.IApp) {
    this.variables = variables;
    this.app = app;
    this.emitter = new EventsBus();
  }

  async process(): Promise<ITestResponse[]> {
    let promises = [];

    if (this.variables.DoNotExists) promises.push(this.variablesDoNotExists());
    if (this.variables.Exists) promises.push(this.variablesExists());

    return await Promise.all(promises).then((r) => r.flat());
  }

  async variablesExists(): Promise<ITestResponse[]> {
    return await Promise.all(
      this.variables.Exists.map(async (t) => {
        try {
          const v = await this.app.getVariableByName(t);
          return {
            status: true,
            name: "Variable should exists",
            message: `Passed: ${t} is present`,
          };
        } catch (e) {
          this.emitter.emit("testError", {
            group: "Meta",
            subGroup: "Variable should exists",
            name: t,
            reason: `Variable "${t}" do not exists`,
          });

          return {
            status: false,
            name: "Variable should exists",
            message: `Variable "${t}" do not exists`,
          };
        }
      })
    );
  }

  async variablesDoNotExists(): Promise<ITestResponse[]> {
    return await Promise.all(
      this.variables.DoNotExists.map(async (t) => {
        try {
          const v = await this.app.getVariableByName(t);

          this.emitter.emit("testError", {
            group: "Meta",
            subGroup: "Variable should not exists",
            name: t,
            reason: `Variable "${t}" does exists`,
          });

          return {
            status: false,
            name: "Variable should not exists",
            message: `Variable "${t}" does exists`,
          };
        } catch (e) {
          return {
            status: true,
            name: "Variable should not exists",
            message: `Variable "${t}" do not exists`,
          };
        }
      })
    );
  }
}
