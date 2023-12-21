export interface IGenericBaseLayout extends EngineAPI.IGenericBaseLayout {}

export interface IGenericBaseLayoutExt extends IGenericBaseLayout {
  qListObject: {
    qDataPages: EngineAPI.INxDataPage[];
    qSize: EngineAPI.ISize;
    qStateName: string;
    qDimensionInfo: {
      qError?: EngineAPI.INxValidationError;
    };
  };
}

export interface IGenericObjectPropertiesExt
  extends EngineAPI.IGenericObjectProperties {
  qListObjectDef: {
    qExpressions: string[];
    qFrequencyMode: string;
    qStateName: string;
    qInitialDataFetch: EngineAPI.INxPage[];
    qDef: {
      qActiveField: number;
      qFieldDefs: string[];
      qFieldLabels: string[];
      qGrouping: string;
      qNumberPresentations: EngineAPI.IFieldAttributes[];
      qSortCriterias: EngineAPI.ISortCriteria[];
    };
  };
}

export interface INxCellListBox {
  qText: string;
  qNum: number | undefined;
  qElemNumber: number;
  qState: EngineAPI.NxCellStateType;
}

export interface IAppMixin extends EngineAPI.IApp {
  mGetFields(): Promise<string[]>;
  mGetTables(): Promise<string[]>;
  mSelectionsAll(): Promise<EngineAPI.ISelectionListObject>;
  mSelectInField(
    fieldName: string,
    values: any[],
    toggle?: boolean,
    state?: string
  ): Promise<{
    selection: boolean;
    selectMore: void;
    destroy: void;
  }>;
  mSelectInFieldBySearch(
    fieldName: string,
    searchTerm: string,
    toggle?: boolean,
    state?: string
  ): Promise<boolean>;
  mCreateSessionListbox(
    fieldName: string,
    options?: {
      state?: string;
      type?: string;
      destroyOnComplete?: boolean;
      getAllData?: boolean;
    }
  ): Promise<{
    obj: EngineAPI.IGenericObject;
    layout: IGenericBaseLayoutExt;
    props: IGenericObjectPropertiesExt;
    flattenData(): INxCellListBox[];
  }>;
}
