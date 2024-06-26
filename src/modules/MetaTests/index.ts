import { IAppMixin } from "../../interface/Mixin";
import { IMeta, ITestMetaResult } from "../../interface/Specs";
import { DataModel } from "./DataModel/index";
import { FieldCounts } from "./Field";
import { TableCounts } from "./Table";
import { VariablesExists } from "./Variable";
import { QObject } from "./Object";
import { DataConnections } from "./DataConnections";
import { MasterDimensions } from "./MasterItems/Dimensions";
import { MasterMeasures } from "./MasterItems/Measures";
import { MasterVisualizations } from "./MasterItems/Visualizations";
import { Engine } from "../Engine";
import { QlikApp } from "../Engine/QlikApp";

export class Meta {
  meta: IMeta;
  app: IAppMixin;
  private totalTests: number;

  constructor(meta: IMeta) {
    const engine = Engine.getInstance();
    this.meta = meta;
    this.app = engine.enigmaData[engine.mainApp].app;
    this.totalTests = 0;
  }

  async run(): Promise<ITestMetaResult[]> {
    let promises = [] as Promise<ITestMetaResult[]>[];

    if (this.meta.DataModel) {
      const dm = new DataModel(this.meta.DataModel, this.app);
      this.totalTests += Object.entries(this.meta.DataModel).length;
      promises.push(dm.process());
    }

    if (this.meta.Field) {
      const fc = new FieldCounts(this.meta.Field, this.app);
      this.totalTests += this.meta.Field.length;
      promises.push(fc.process());
    }

    if (this.meta.Table) {
      const tc = new TableCounts(this.meta.Table, this.app);
      this.totalTests += this.meta.Table.length;
      promises.push(tc.process());
    }

    if (this.meta.Variable) {
      const ve = new VariablesExists(this.meta.Variable, this.app);
      this.totalTests +=
        (this.meta.Variable.DoNotExists?.length || 0) +
        (this.meta.Variable.Exists?.length || 0);
      promises.push(ve.process());
    }

    if (this.meta.VizObject) {
      const qObject = new QObject(this.meta.VizObject, this.app);
      this.totalTests += this.meta.VizObject.length;
      promises.push(qObject.run());
    }

    if (this.meta.DataConnections) {
      const dataConnections = new DataConnections(
        this.meta.DataConnections,
        this.app
      );
      this.totalTests += this.meta.DataConnections.length;
      promises.push(dataConnections.process());
    }

    if (this.meta.MasterItems) {
      if (this.meta.MasterItems.dimensions) {
        const masterDimensions = new MasterDimensions(
          this.meta.MasterItems.dimensions,
          this.app
        );
        this.totalTests += this.meta.MasterItems.dimensions.length;

        promises.push(masterDimensions.process());
      }

      if (this.meta.MasterItems.measures) {
        if (this.meta.MasterItems.measures) {
          const masterMeasures = new MasterMeasures(
            this.meta.MasterItems.measures,
            this.app
          );
          this.totalTests += this.meta.MasterItems.measures.length;

          promises.push(masterMeasures.process());
        }
      }

      if (this.meta.MasterItems.visualizations) {
        const masterViz = new MasterVisualizations(
          this.meta.MasterItems.visualizations,
          this.app
        );
        this.totalTests += this.meta.MasterItems.visualizations.length;

        promises.push(masterViz.process());
      }
    }

    const results = await (await Promise.all(promises)).flat();

    return results;
  }
}
