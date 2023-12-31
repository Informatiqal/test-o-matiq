// import * as enigmaSchema from "enigma.js/schemas/12.20.0.json" assert { type: "json" };
// import { docMixin } from "enigma-mixin";
// import WebSocket from "ws";
import * as enigma from "enigma.js";
import { IAppMixin } from "../../interface/Mixin";
import { Selection } from "./Selections";

export class QlikApp {
  global: EngineAPI.IGlobal;
  session: enigmaJS.ISession;
  app: IAppMixin;
  selection: Selection;
  private config: enigmaJS.IConfig;
  private appId: string;
  constructor(config: enigmaJS.IConfig, appId: string) {
    this.config = config;
    this.appId = appId;
  }

  async open() {
    const enigmaClass = (enigma as any).default as IEnigmaClass;
    this.session = enigmaClass.create(this.config);
    this.global = await this.session.open();
    this.app = await this.global.openDoc(this.appId);
    this.selection = new Selection(this.app);
  }

  async evaluate() {
    //
  }

  async checkExpression() {
    //
  }
}
