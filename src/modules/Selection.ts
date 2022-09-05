import { ISelection } from "../interface/Specs";
import { EventsBus } from "../util/EventBus";
import { IAppMixin } from "../interface/Mixin";

export class Selection {
  selections: ISelection[];
  private app: IAppMixin;
  private emitter: EventsBus;

  constructor(selections: ISelection[], app: IAppMixin) {
    this.selections = selections;
    this.app = app;
    this.emitter = new EventsBus();
  }

  async makeSelections() {
    if (this.selections) {
      await new Promise(async (resolve, reject) => {
        for (let s of this.selections) {
          const b = await this.app
            .mSelectInField(s.field, s.values as any)
            .catch((e) => {
              let b1 = 1;
            });
          let a = 1;
        }

        resolve("");
      });

      return await this.app.mSelectionsAll();
    }
  }
}
