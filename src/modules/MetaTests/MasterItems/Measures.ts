import { ITestMetaResult } from "../../../interface/Specs";
import { EventsBus } from "../../../util/EventBus";
import { Timing, concatResults } from "../../../util/common";

export interface MeasureLayout {
  qMeasureList: { qItems: { qMeta: { title: string } }[] };
}

export class MasterMeasures {
  private app: EngineAPI.IApp;
  private measures: string[];
  private emitter: EventsBus;
  private timing: Timing;

  constructor(measures: string[], app: EngineAPI.IApp) {
    this.measures = measures;
    this.app = app;
    this.emitter = new EventsBus();
    this.timing = new Timing();
  }

  /**
   * Check if the provided master measures exists in the app
   */
  async process(): Promise<ITestMetaResult[]> {
    this.timing.start();
    this.emitter.emit("testStart", "Meta -> Master measures");

    const sessionObject = await this.app.createSessionObject({
      qInfo: {
        qType: "MeasureList",
      },
      qMeasureListDef: {
        qType: "measure",
        qData: {
          title: "/title",
          tags: "/tags",
        },
      },
    });

    const notFoundMeasures: string[] = await sessionObject
      .getLayout()
      .then((allMeasures) => {
        this.timing.stop();

        const allMeasureTitles = (
          allMeasures as unknown as MeasureLayout
        ).qMeasureList.qItems.map((o) => o.qMeta.title);
        return this.measures.filter((x) => !allMeasureTitles.includes(x));
      });

    const result: ITestMetaResult = {
      name: "Meta -> Master measures",
      status: notFoundMeasures.length > 0 ? false : true,
      message:
        notFoundMeasures.length > 0
          ? `Measures(s) not found: ${concatResults(notFoundMeasures)}`
          : `All master measures are present`,
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
