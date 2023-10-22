import { ITestMetaResult } from "../../../interface/Specs";
import { EventsBus } from "../../../util/EventBus";
import { Timing, concatResults } from "../../../util/common";

export class MasterDimensions {
  private app: EngineAPI.IApp;
  private dimensions: string[];
  private emitter: EventsBus;
  private timing: Timing;

  constructor(dimensions: string[], app: EngineAPI.IApp) {
    this.dimensions = dimensions;
    this.app = app;
    this.emitter = new EventsBus();
    this.timing = new Timing();
  }

  /**
   * Check if the provided master dimensions exists in the app
   */
  async process(): Promise<ITestMetaResult[]> {
    this.timing.start();
    this.emitter.emit("testStart", "Meta -> Master dimensions");

    const sessionObject = await this.app.createSessionObject({
      qInfo: {
        qType: "DimensionList",
      },
      qDimensionListDef: {
        qType: "dimension",
        qData: {
          title: "/title",
          tags: "/tags",
          grouping: "/qDim/qGrouping",
          info: "/qDimInfos",
        },
      },
    });

    const notFoundDimensions: string[] = await sessionObject
      .getLayout()
      .then((allDimensions) => {
        this.timing.stop();

        const allDimensionTitles = allDimensions.qDimensionList.qItems.map(
          (o) => o.qMeta.title
        );
        return this.dimensions.filter((x) => !allDimensionTitles.includes(x));
      });

    const result: ITestMetaResult = {
      name: "Meta -> Master dimensions",
      status: notFoundDimensions.length > 0 ? false : true,
      message:
        notFoundDimensions.length > 0
          ? `Dimension(s) not found: ${concatResults(notFoundDimensions)}`
          : `All master dimensions are present`,
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
