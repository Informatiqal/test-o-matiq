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
    // TODO: emit something here at all?
    // TODO: write to log the selections actions
  }

  async makeSelections() {
    const documentBookmarks = await this.listBookmarks();

    // TODO: allow selections to be append?

    for (let selection of this.selections) {
      if (selection["clearAll"]) {
        const clearAllResult = await this.app.clearAll(false);
      }

      if (selection["field"]) {
        const selectionResult = await this.app.mSelectInField(
          selection["field"],
          selection["values"]
        );
      }

      if (selection["bookmark"]) {
        const bookmarkDetails = documentBookmarks.filter(
          (db) => selection["bookmark"] == db.title
        )[0];

        if (!bookmarkDetails.id) {
          // TODO: throw error? or warning? do something at all?
        }

        const applyBookmarkResult = await this.app.applyBookmark(
          bookmarkDetails.id
        );
      }

      if (selection["clear"]) {
        for (let fieldName of selection["clear"]) {
          const field = await this.app.getField(fieldName);

          const clearFieldResult = await field.clear();
        }
      }
    }
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
}
