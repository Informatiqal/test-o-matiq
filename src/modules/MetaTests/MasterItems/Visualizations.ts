import { ITestMetaResult } from "../../../interface/Specs";
import { EventsBus } from "../../../util/EventBus";
import { Timing, concatResults } from "../../../util/common";

export interface VizLayout {
  qAppObjectList: { qItems: { qMeta: { title: string } }[] };
}

export class MasterVisualizations {
  private app: EngineAPI.IApp;
  private visualizations: string[];
  private emitter: EventsBus;
  private timing: Timing;

  constructor(visualizations: string[], app: EngineAPI.IApp) {
    this.visualizations = visualizations;
    this.app = app;
    this.emitter = new EventsBus();
    this.timing = new Timing();
  }

  /**
   * Check if the provided master visualizations exists in the app
   */
  async process(): Promise<ITestMetaResult[]> {
    this.timing.start();
    this.emitter.emit("testStart", "Meta -> Master visualizations");

    const sessionObject = await this.app.createSessionObject({
      qInfo: { qId: "MasterObjectList", qType: "MasterObjectList" },
      qAppObjectListDef: {
        qType: "masterobject",
        qData: {
          name: "/qMetaDef/title",
          labelExpression: "/labelExpression",
          visualization: "/visualization",
          tags: "/qMetaDef/tags",
        },
      },
    });

    const notFoundViz: string[] = await sessionObject
      .getLayout()
      .then((allViz) => {
        this.timing.stop();

        const allVizTitles = (
          allViz as unknown as VizLayout
        ).qAppObjectList.qItems.map((o) => o.qMeta.title);

        return this.visualizations.filter((x) => !allVizTitles.includes(x));
      });

    const result: ITestMetaResult = {
      name: "Meta -> Master visualizations",
      status: notFoundViz.length > 0 ? false : true,
      message:
        notFoundViz.length > 0
          ? `Visualization(s) not found: ${concatResults(notFoundViz)}`
          : `All master visualizations are present`,
      type: "meta",
      timings: {
        start: this.timing.startTime,
        end: this.timing.endTime,
        elapsed: this.timing.elapsedTime,
      },
    };

    this.emitter.emit("testResult", result);

    return [result];
  }
}
