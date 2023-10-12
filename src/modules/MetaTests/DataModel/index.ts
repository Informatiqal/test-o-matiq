import { IDataModel, ITestMetaResult } from "../../../interface/Specs";
import { EventsBus } from "../../../util/EventBus";
import { Timing, concatResults } from "../../../util/common";
import { IAppMixin } from "../../../interface/Mixin";

export class DataModel {
  app: IAppMixin;
  private dataModelData: IDataModel;
  private emitter: EventsBus;

  constructor(dataModelData: IDataModel, app: IAppMixin) {
    this.dataModelData = dataModelData;
    this.app = app;
    this.emitter = new EventsBus();
  }

  async process(): Promise<ITestMetaResult[]> {
    let promises = [] as Promise<ITestMetaResult>[];

    if (this.dataModelData.Field) promises.push(this.field());
    if (this.dataModelData.Table) promises.push(this.table());
    if (this.dataModelData.AlwaysOneSelected)
      promises.push(this.alwaysOneSelected());
    if (this.dataModelData.hasOwnProperty("SyntheticKeys"))
      promises.push(this.syntheticKeys());

    return await Promise.all(promises);
  }

  /**
   * Check if the provided fields exists in the data model
   * Fields content is not checked
   */
  private async field() {
    const timing = new Timing();
    timing.start();

    const fields = await this.app.mGetFields();

    const notFound = this.dataModelData.Field.filter(
      (x) => !fields.includes(x)
    );

    const fieldStatus = notFound.length > 0 ? false : true;

    timing.stop();

    const result: ITestMetaResult = {
      name: "Meta -> DataModel -> Field",
      status: fieldStatus,
      message: !fieldStatus
        ? `${notFound.length} field(s) not found: ${concatResults(notFound)}`
        : "All fields are present",
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
   * Check if the provided tables exists in the data model
   * Tables content is not checked
   */
  private async table() {
    const timing = new Timing();
    timing.start();

    const tables = await this.app.mGetTables();

    const notFound = this.dataModelData.Table.filter(
      (x) => !tables.includes(x)
    );

    const tableStatus = notFound.length > 0 ? false : true;

    timing.stop();

    const result: ITestMetaResult = {
      name: "Meta -> DataModel -> Table",
      status: tableStatus,
      message: !tableStatus
        ? `${notFound.length} tables(s) not found: ${concatResults(notFound)}`
        : "All tables are present",
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
   * Check if the data mode have synthetic keys
   */
  private async syntheticKeys() {
    const timing = new Timing();
    timing.start();

    const tables = await this.app.getTablesAndKeys(
      {} as EngineAPI.ISize,
      {} as EngineAPI.ISize,
      0,
      true,
      false
    );

    const synthTables = tables.qtr.filter((t) => t.qIsSynthetic == true);

    const synthTableStatus =
      synthTables.length > 0 &&
      this.dataModelData.hasOwnProperty("SyntheticKeys") &&
      this.dataModelData.SyntheticKeys == false
        ? false
        : true;

    timing.stop();

    const suppressedMessage: string =
      synthTables.length > 0 &&
      this.dataModelData.hasOwnProperty("SyntheticKeys") &&
      this.dataModelData.SyntheticKeys == true
        ? `Synthetic tables exists but "SyntheticKeys" property is set to "true"`
        : `Synth tables do not exist`;

    const result: ITestMetaResult = {
      name: "Meta -> DataModel -> SyntheticKeys",
      status: synthTableStatus,
      message: !synthTableStatus
        ? `Synthetic table(s) found: ${concatResults(
            synthTables.map((t) => t.qName)
          )}`
        : suppressedMessage,
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
   * Check if alwaysOneSelected is present for the provided fields
   */
  private async alwaysOneSelected() {
    const timing = new Timing();
    timing.start();

    const allFields = await this.app.mGetFields();

    const oneSelectedFields = await Promise.all(
      allFields.map(async (field) => {
        const qField = await this.app.getField(field);
        const qFieldProps = await qField.getNxProperties();

        return {
          field,
          isOneSelected: qFieldProps.qOneAndOnlyOne || false,
        };
      })
    ).then((o) =>
      o.filter((o1) => o1.isOneSelected == true).map((o2) => o2.field)
    );

    const notFound = this.dataModelData.AlwaysOneSelected.filter(
      (x) => !oneSelectedFields.includes(x)
    );

    const alwaysOneSelectedStatus = notFound.length > 0 ? false : true;

    const result: ITestMetaResult = {
      name: "Meta -> DataModel -> AlwaysOneSelected",
      status: alwaysOneSelectedStatus,
      message: !alwaysOneSelectedStatus
        ? `${notFound.length} field(s) not found: ${concatResults(notFound)}`
        : "All fields are present and qOneAndOnlyOne property is set for them",
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
