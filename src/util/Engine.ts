import { IGenericObject } from "enigma-mixin/dist/index.doc";
import { IAppMixin } from "../interface/Mixin";

export class Engine {
  static instance: Engine;
  private qApp: IAppMixin;
  scalarTable: ScalarTableObject;

  constructor(qApp: IAppMixin) {
    this.qApp = qApp;
    this.scalarTable = new ScalarTableObject(qApp);
  }

  public static getInstance(qApp?: IAppMixin): Engine {
    if (!Engine.instance) {
      Engine.instance = new Engine(qApp);
    }
    return Engine.instance;
  }

  async checkExpression(expression: string) {
    const { qErrorMsg, qBadFieldNames, qDangerousFieldNames } =
      await this.qApp.checkExpression(expression);

    if (qErrorMsg) throw new Error(qErrorMsg);

    if (qBadFieldNames.length > 0) {
      const badFieldNames = qBadFieldNames.map(({ qFrom, qCount }) =>
        expression.substring(qFrom, qFrom + qCount)
      );

      throw new Error(`Bad field name(s): ${badFieldNames.join(", ")}`);
    }

    if (qDangerousFieldNames.length > 0) {
      const dangerousFieldNames = qDangerousFieldNames.map(
        ({ qFrom, qCount }) => expression.substring(qFrom, qFrom + qCount)
      );

      throw new Error(
        `Dangerous field name(s): ${dangerousFieldNames.join(", ")}`
      );
    }

    return;
  }
}

export class ScalarTableObject {
  private qApp: IAppMixin;
  private qObj: IGenericObject;

  constructor(qApp: IAppMixin) {
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
      qStateName: state || "",
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

    return await this.qApp.createSessionObject(qObjProps);
  }

  async destroy() {
    return this.qApp.destroySessionObject(this.qObj.id);
  }
}
