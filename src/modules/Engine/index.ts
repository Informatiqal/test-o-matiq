import * as enigmaSchema from "enigma.js/schemas/12.1657.0.json" assert { type: "json" };
import * as enigma from "enigma.js";
import { docMixin } from "enigma-mixin";
import WebSocket from "ws";
import { IGenericObject } from "enigma-mixin/dist/index.doc";
import { IAppMixin } from "../../interface/Mixin";
import {
  Apps,
  EnvironmentDesktop,
  EnvironmentSaaS,
  qSelections,
} from "../../index.doc";
import { QlikApp } from "./QlikApp";

export class Engine {
  static instance: Engine;
  enigmaData: {
    [k: string]: QlikApp;
  } = {};
  mainApp: string;
  environment: EnvironmentDesktop | EnvironmentSaaS;
  scalarTable: ScalarTableObject;

  constructor(
    mainApp: string,
    environment: EnvironmentDesktop | EnvironmentSaaS
  ) {
    this.mainApp = mainApp;
    this.environment = environment;

    if (this.environment.host == "localhost")
      this.environment.host = "127.0.0.1";

    if (!this.environment.port) {
      if (this.environment.edition == "saas") this.environment.port = 443;
      if (this.environment.edition == "desktop") this.environment.port = 4848;
    }
  }

  public static getInstance(
    mainApp?: string,
    environment?: EnvironmentDesktop | EnvironmentSaaS
  ): Engine {
    if (!Engine.instance) {
      Engine.instance = new Engine(mainApp, environment);
    }
    return Engine.instance;
  }

  public async openApps(arg: Apps, selectionsProps: any) {
    // const selectionsProps = this.specs.props?.selections
    //   ? this.propSelectionsToArray()
    //   : [];
    const headers = (this.environment as EnvironmentSaaS).authentication?.apiKey
      ? {
          headers: {
            authorization: `Bearer ${
              (this.environment as EnvironmentSaaS).authentication?.apiKey
            }`,
          },
        }
      : {};

    let protocol = "wss";
    if (!this.environment.edition) protocol = "wss";
    if (this.environment.edition == "desktop") protocol = "ws";

    let b = await Promise.all(
      Object.entries(arg).map(([key, data]) => {
        const enigmaConfig: enigmaJS.IConfig = {
          Promise: Promise,
          schema: enigmaSchema,
          mixins: docMixin,
          url: `${protocol}://${this.environment.host}:${
            this.environment.port
          }/app/${data.id}/identity/${+new Date()}`,
          createSocket: (url) => new WebSocket(url, headers),
        };

        // const enigmaClass = (enigma as any).default as IEnigmaClass;
        // const qlikSession = enigmaClass.create(enigmaConfig);
        // const global: EngineAPI.IGlobal = await qlikSession.open();
        // const doc: IAppMixin = await global.openDoc(arg[a].id);
        const app = new QlikApp(enigmaConfig, data.id);
        // get apps alternate states and sets them into the selections class
        // const alternateStates = await app
        //   .getAppLayout()
        //   .then((layout) => layout.qStateNames);
        // return app;

        return app
          .open()
          .then(() => {
            this.enigmaData[key] = app;

            return app.app.getAppLayout();
          })
          .then((appLayout) => {
            app.selection.setAlternateStates(appLayout.qStateNames);
            app.selection.setPropsSelections(selectionsProps);
          })
          .catch((e) => {
            let a = 1;
          });

        // this.selections[a] = Selection.getInstance({
        //   app: doc,
        // });

        // this.selections[a].setPropsSelections(
        //   selectionsProps as IPropsSelectionArray[]
        // );

        // this.enigmaData[a] = {
        //   global,
        //   session: qlikSession,
        //   app: doc,
        // };
        // _this.engine[a] = Engine.getInstance(doc);
        // if (this.specs.environment.apps[a].isMain) this.mainApp = a;

        // this.selections[a].setAlternateStates(alternateStates);
      })
    );
    let a = 1;
  }

  async checkConnection() {
    const headers = (this.environment as EnvironmentSaaS).authentication?.apiKey
      ? {
          headers: {
            authorization: `Bearer ${
              (this.environment as EnvironmentSaaS).authentication?.apiKey
            }`,
          },
        }
      : {};

    let protocol = "wss";
    if (!this.environment.edition) protocol = "wss";
    if (this.environment.edition == "desktop") protocol = "ws";

    const enigmaConfig: enigmaJS.IConfig = {
      Promise: Promise,
      schema: enigmaSchema,
      mixins: docMixin,
      url: `${protocol}://${this.environment.host}:${
        this.environment.port
      }/app/${this.environment.apps[this.mainApp].id}/identity/${+new Date()}`,
      createSocket: (url) => new WebSocket(url, headers),
    };

    const enigmaClass = (enigma as any).default as IEnigmaClass;
    const enigmaSession = enigmaClass.create(enigmaConfig);

    try {
      const enigmaConnection: EngineAPI.IGlobal = await enigmaSession.open();

      const engineVersion = await enigmaConnection
        .engineVersion()
        .then((r) => r.qComponentVersion);

      await enigmaSession.close();
      return engineVersion;
    } catch (e) {
      try {
        await enigmaSession.close();
      } catch (e) {}

      throw new Error(e.message);
    }
  }

  async checkExpression(expression: string) {
    // const { qErrorMsg, qBadFieldNames, qDangerousFieldNames } =
    //   await this.qApp.checkExpression(expression);

    // if (qErrorMsg) throw new Error(qErrorMsg);

    // if (qBadFieldNames.length > 0) {
    //   const badFieldNames = qBadFieldNames.map(({ qFrom, qCount }) =>
    //     expression.substring(qFrom, qFrom + qCount)
    //   );

    //   throw new Error(`Bad field name(s): ${badFieldNames.join(", ")}`);
    // }

    // if (qDangerousFieldNames.length > 0) {
    //   const dangerousFieldNames = qDangerousFieldNames.map(
    //     ({ qFrom, qCount }) => expression.substring(qFrom, qFrom + qCount)
    //   );

    //   throw new Error(
    //     `Dangerous field name(s): ${dangerousFieldNames.join(", ")}`
    //   );
    // }

    return;
  }

  /**
   * call clearAll method in all defined apps
   */
  async clearAllInAll() {
    await Promise.all(
      Object.keys(this.enigmaData).map((d) => {
        this.enigmaData[d].app.clearAll(true);
      })
    );
  }

  async getAllCurrentSelections() {
    const sel = await Promise.all(
      Object.entries(this.enigmaData).map(async ([key, data]) => {
        const selections = await data.selection.getCurrentSelections();

        return { app: key, ...selections };
      })
    );

    return sel.flat() as {
      app: string;
      state: string;
      selections: qSelections[];
    }[];
  }
}

export class ScalarTableObject {
  private qApp: QlikApp;
  private qObj: IGenericObject;

  constructor(qApp: QlikApp) {
    this.qApp = qApp;
  }

  async evaluate(expression: string, state?: string) {
    // make sure that the expression string starts with =
    const expressionEx = expression.startsWith("=")
      ? expression
      : `= ${expression}`;

    this.qObj = await this.create(expressionEx, state);
    const qObjData = await this.qObj.getHyperCubeData("/qHyperCubeDef", [
      {
        qLeft: 0,
        qTop: 0,
        qWidth: 1,
        qHeight: 1,
      },
    ]);

    // if no data in the hypercube then return null
    // TODO: to check how returning null is behaving with the comparison operations
    if (qObjData[0].qMatrix.length == 0) return null;

    // since its a single measure data its safe to return the first result
    return qObjData[0].qMatrix[0][0].qNum
      ? qObjData[0].qMatrix[0][0].qNum
      : qObjData[0].qMatrix[0][0].qText;
  }

  private async create(expression: string, state?: string) {
    const qObjProps = {
      qInfo: {
        qId: "",
        qType: "test-o-matiq-scalar",
      },
      qExtendsId: "",
      qMetaDef: {},
      qStateName: state,
      qHyperCubeDef: {
        qMeasures: [
          {
            qDef: {
              qDef: expression,
            },
          },
        ],
        qInitialDataFetch: [
          {
            qTop: 0,
            qLeft: 0,
            qWidth: 1,
            qHeight: 1,
          },
        ],
      },
    } as EngineAPI.IGenericObjectProperties;

    return await this.qApp.app.createSessionObject(qObjProps);
  }

  async destroy() {
    return this.qApp.app.destroySessionObject(this.qObj.id);
  }
}

export class TableObject {
  private qApp: IAppMixin;
  private qObj: IGenericObject;

  constructor(qApp: IAppMixin) {
    this.qApp = qApp;
  }

  async evaluate(dimensions: string[], measures: string[], state?: string) {
    this.qObj = await this.create(dimensions, measures, state);
    const qObjData = await this.qObj.getHyperCubeData("/qHyperCubeDef", [
      {
        qLeft: 0,
        qTop: 0,
        qWidth: dimensions.length + measures.length,
        qHeight: 20,
      },
    ]);

    // if no data in the hypercube then return null
    // TODO: to check how returning null is behaving with the comparison operations
    if (qObjData[0].qMatrix.length == 0) return null;

    return qObjData[0].qMatrix;
  }

  private async create(dimensions, measures, state?: string) {
    const qObjProps = {
      qInfo: {
        qId: "",
        qType: "test-o-matiq-table",
      },
      qExtendsId: "",
      qMetaDef: {},
      qStateName: state || "",
      qHyperCubeDef: {
        qDimensions: [],
        qMeasures: [],
        qInitialDataFetch: [
          {
            qTop: 0,
            qLeft: 0,
            qWidth: 1,
            qHeight: 1,
          },
        ],
      },
    } as EngineAPI.IGenericObjectProperties;

    qObjProps.qHyperCubeDef.qMeasures = measures.map((m) => ({
      qDef: {
        qDef: m.toString().startsWith("=") ? m : `=${m}`,
      },
    }));

    qObjProps.qHyperCubeDef.qDimensions = dimensions.map((d) => ({
      qDef: {
        qFieldDefs: [d],
      },
    }));

    return await this.qApp.createSessionObject(qObjProps);
  }

  async destroy() {
    return this.qApp.destroySessionObject(this.qObj.id);
  }
}
