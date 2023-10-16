import { ITestMetaResult } from "../interface/Specs";

import { EventEmitter } from "events";

export declare interface EventsBus {
  on(event: "testResult", listener: (name: ITestMetaResult) => void): this;
  on(event: "testStart", listener: (name: string) => void): this;
  emit(event: string | symbol, ...args: any[]): boolean;
  // on(event: "debug", listener: (name: IEventDebug) => void): this;
}

export class EventsBus extends EventEmitter {
  private static instance: EventsBus;
  constructor() {
    super();
    if (EventsBus.instance) {
      return EventsBus.instance;
    }
    EventsBus.instance = this;
  }
}
