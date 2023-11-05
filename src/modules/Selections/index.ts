import {
  ICurrentSelections,
  IProps,
  IPropsSelectionArray,
  ISelection,
} from "../../interface/Specs";
import { EventsBus } from "../../util/EventBus";
import { IAppMixin } from "../../interface/Mixin";
import { Timing } from "../../util/common";

export class Selection {
  static instance: Selection;
  selections: ISelection[];
  private app: IAppMixin;
  private emitter: EventsBus;
  private propSelections: IPropsSelectionArray[];
  private documentBookmarks: { id: string; title: string }[];
  private state: string;
  // private isDebug: boolean;

  constructor(app: IAppMixin, state: string) {
    this.app = app;
    this.emitter = new EventsBus();
    this.state = state;
    // TODO: emit something here at all?
    // TODO: write to log the selections actions (if debug)
  }

  public static getInstance(arg: {
    state?: string;
    app?: IAppMixin;
  }): Selection {
    if (!Selection.instance) {
      Selection.instance = new Selection(arg.app, arg.state);
    }
    return Selection.instance;
  }

  public setPropsSelections(propSelections: IPropsSelectionArray[]) {
    this.propSelections = propSelections;
  }

  // public setDebug(isDebug: boolean) {
  //   this.isDebug = isDebug;
  // }

  async makeSelections(selections: ISelection[], state: string) {
    const timings = new Timing();
    timings.start();

    this.documentBookmarks = await this.listBookmarks();

    // TODO: allow selections to be append?
    for (let selection of selections) {
      if (selection["clearAll"]) {
        await this.clearAll(state);

        this.emitter.emit("debug", `Cleared all selections`);
      }

      if (selection["field"]) {
        await this.selectInField(
          selection["field"],
          selection["values"],
          state
        );

        this.emitter.emit(
          "debug",
          `Select in state "${state}" in field "${
            selection["field"]
          }" --> ${selection["values"].join(",")}`
        );

        const currentSelections = await this.getCurrentSelections(state);

        const currentSelectionsString = currentSelections
          .map((s) => `${s.qField} (${s.qSelectedCount}): ${s.qSelected}`)
          .join(";");

        this.emitter.emit(
          "debug",
          `Current selections in state "${state}": ${
            currentSelections.length > 0 ? currentSelectionsString : "EMPTY"
          }`
        );
      }

      if (selection["bookmark"]) {
        await this.applyBookmark(selection["bookmark"]);

        this.emitter.emit(
          "debug",
          `Applied bookmark: ${selection["bookmark"]}`
        );
      }

      if (selection["clear"]) {
        await this.clear(selection["clear"], state);

        this.emitter.emit(
          "debug",
          `Cleared field ${selection["clear"]} in state "${state}"`
        );
      }

      if (selection["byName"]) {
        await this.selectByName(selection, state);

        // this.emitter.emit("debug", `Cleared field: ${selection["clear"]}`);
      }
    }

    timings.stop();

    const currentSelections = await this.getCurrentSelections(state);

    return {
      selections: currentSelections,
      timings: {
        start: timings.startTime,
        end: timings.endTime,
        elapsed: timings.elapsedTime,
      },
    };
  }

  private async listBookmarks() {
    try {
      const qObj = await this.app.createSessionObject({
        qInfo: { qId: "BookmarkList", qType: "BookmarkList" },
        qBookmarkListDef: {
          qType: "bookmark",
          qData: {
            title: "/qMetaDef/title",
            description: "/qMetaDef/description",
            sheetId: "/sheetId",
            selectionFields: "/selectionFields",
            creationDate: "/creationDate",
          },
        },
      });

      const layout = await qObj.getLayout();

      return layout.qBookmarkList.qItems.map((b) => ({
        id: b.qInfo.qId,
        title: b.qMeta.title,
      }));
    } catch (e) {
      return [];
    }
  }

  async getCurrentSelections(state: string) {
    const sessionObjDefinitions = {
      qInfo: {
        qId: "",
        qType: "SessionLists",
      },
      qSelectionObjectDef: {},
      qStateName: state,
    };

    const sessionObj = await this.app.createSessionObject(
      sessionObjDefinitions
    );

    const sessionObjLayout =
      (await sessionObj.getLayout()) as ICurrentSelections;

    try {
      await this.app.destroySessionObject(sessionObj.id);
    } catch (e) {}

    return sessionObjLayout.qSelectionObject.qSelections;
  }

  private getSelectionByName(name: string[]) {
    return this.propSelections.filter((s) => name.includes(s.name));
  }

  private async clearAll(state: string) {
    return await this.app.clearAll(false, state);
  }

  private async clear(fieldNames: string[], state: string) {
    for (let fieldName of fieldNames) {
      const field = await this.app.getField(fieldName);

      const clearFieldResult = await field.clear();
    }

    return true;
  }

  private async applyBookmark(bookmarkName: string) {
    const bookmarkDetails = this.documentBookmarks.filter(
      (db) => bookmarkName == db.title
    )[0];

    if (!bookmarkDetails.id) {
      // TODO: throw error? or warning? do something at all?
    }

    return await this.app.applyBookmark(bookmarkDetails.id);
  }

  private async selectInField(field: string, values: any[], state: string) {
    const makeSelection = await this.app.mSelectInField(
      field,
      values,
      true,
      state
    );

    return makeSelection;
  }

  private async selectByName(selection: ISelection, state: string) {
    const selectionDetails = this.getSelectionByName(selection["byName"]);

    for (let sd of selectionDetails) {
      for (let s of sd.selections) {
        if (s["clearAll"]) {
          await this.clearAll(state);

          this.emitter.emit(
            "debug",
            `Cleared all selections in state "${state}"`
          );
        }

        if (s["field"]) {
          await this.selectInField(s["field"], s["values"], state);

          this.emitter.emit(
            "debug",
            `Select in state "${state}" in field "${s["field"]}" --> ${s[
              "values"
            ].join(",")}`
          );
        }

        if (s["bookmark"]) {
          await this.applyBookmark(s["bookmark"]);

          this.emitter.emit("debug", `Bookmark applied: ${s["bookmark"]}`);
        }

        if (s["clear"]) {
          await this.clear(s["clear"], state);

          this.emitter.emit(
            "debug",
            `Cleared field: ${s["clear"]} in state "${state}"`
          );
        }

        if (s["byName"]) {
          await this.selectByName(s as ISelection, state);
        }
      }

      const currentSelections = await this.getCurrentSelections(state);

      const currentSelectionsString = currentSelections
        .map((s) => `${s.qField} (${s.qSelectedCount}): ${s.qSelected}`)
        .join(";");

      this.emitter.emit(
        "debug",
        `Current selections in state "${state}": ${currentSelectionsString}`
      );
    }
  }
}

/**
 * Set of validations to be performed on the selections entities
 */
export class SelectionValidation {
  qApp: IAppMixin;
  bookmarksToValidate: string[];
  fieldsToValidate: string[];
  byNameToValidate: string[];
  propSelections: string[];

  constructor(
    selections: ISelection[],
    propSelections: IProps,
    qApp: IAppMixin
  ) {
    this.qApp = qApp;

    this.bookmarksToValidate = selections
      .filter((s) => s.bookmark)
      .map((s) => s.bookmark);

    this.fieldsToValidate = selections
      .filter((s) => s.field)
      .map((s) => s.field);

    this.byNameToValidate = selections
      .filter((s) => s.byName)
      .map((s) => s.byName)
      .flat();

    this.propSelections = propSelections.selections
      ? Object.keys(propSelections.selections)
      : [];
  }

  /**
   * Check if the fields, specified in the pre-defined selections
   * and in the inline tests selections actually exists in the app
   */
  private async validateBookmarks() {
    const availableBookmarks: string[] = await this.qApp
      .getBookmarks({
        qTypes: ["bookmark"],
        qData: {},
      })
      .then((b: any) => b.map((b1) => b1.qInfo.qName));

    return this.bookmarksToValidate.filter(
      (b) => !availableBookmarks.includes(b)
    );
  }

  /**
   * Check if the fields, specified in the pre-defined selections
   * and in the inline tests selections actually exists in the app
   */
  private async validateFields() {
    const availableFields = await this.qApp.mGetFields();

    return this.fieldsToValidate.filter((f) => !availableFields.includes(f));
  }

  /**
   * Check if the selection names (byName) in the tests actually exists
   */
  private async validateSelectionsByName() {
    return this.byNameToValidate.filter(
      (v) => !this.propSelections.includes(v)
    );
  }

  /**
   * Check for duplicate pre-defined selections names
   */
  private async validateSelectionByNameDuplication() {
    const toFindDuplicates = (array) =>
      array.filter((item, index) => array.indexOf(item) !== index);

    return toFindDuplicates(this.propSelections);
  }

  async validateFieldsAndBookmarks() {
    const [
      missingBookmarks,
      missingFields,
      missingByNameSelections,
      duplicatedByName,
    ] = await Promise.all([
      this.validateBookmarks(),
      this.validateFields(),
      this.validateSelectionsByName(),
      this.validateSelectionByNameDuplication(),
    ]);

    return {
      missingBookmarks,
      missingFields,
      missingByNameSelections,
      duplicatedByName,
    };
  }
}
