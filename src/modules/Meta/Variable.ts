import { ITestResponse } from "../../interface/Specs";
import { EventsBus } from "../../util/EventBus";

export class VariablesExists {
  private app: EngineAPI.IApp;
  private variables: string[];
  private emitter: EventsBus;

  constructor(variables: string[], app: EngineAPI.IApp) {
    this.variables = variables;
    this.app = app;
    this.emitter = new EventsBus();
  }

  async process(): Promise<ITestResponse[]> {
    return await Promise.all(
      this.variables.map(async (t) => {
        try {
          const v = await this.app.getVariableByName(t);
          return {
            status: true,
            name: "Variable exists",
            message: `Passed: ${t} is present`,
          };
        } catch (e) {
          this.emitter.emit("testError", {
            group: "Meta",
            subGroup: "Variable exists",
            name: t,
            reason: `Variable "${t}" do not exists`,
          });

          return {
            status: false,
            name: "Variable exists",
            message: `Variable "${t}" do not exists`,
          };
        }
      })
    );
  }
}
