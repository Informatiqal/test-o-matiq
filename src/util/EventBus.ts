import {
  // IEventDebug,
  // IEventError,
  // IEventGroupStartEnd,
  // IGroupResult,
  ITestDataEmit,
} from "../interface/Specs";

import { EventEmitter } from "events";

export declare interface EventsBus {
  // on(event: "testError", listener: (name: IEventError) => void): this;
  on(event: "testResult", listener: (name: ITestDataEmit) => void): this;
  // on(event: "all", listener: (name: string) => void): this;
  // on(event: "group", listener: (body: IEventGroupStartEnd) => void): this;
  // on(event: "group:result", listener: (body: IGroupResult) => void): this;
  // on(event: "debug", listener: (name: IEventDebug) => void): this;
  // on(event: "error", listener: (name: IEventError) => void): this;
  emit(event: string | symbol, ...args: any[]): boolean;
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
