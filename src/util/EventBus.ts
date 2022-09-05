import { EventEmitter } from "events";
import {
  IEventError,
  IEventGroupStartEnd,
  IGroupResult,
  ITestResponse,
} from "../interface/Specs";
import TypedEmitter from "typed-emitter";

type MessageEvents = {
  testError: (error: IEventError) => void;
  all: (body: { message: string }) => void;
  group: (body: IEventGroupStartEnd) => void;
  // "group:end": (body: IEventGroupStartEnd) => void;
  "group:result": (body: IGroupResult) => void;
};

export class EventsBus extends (EventEmitter as new () => TypedEmitter<MessageEvents>) {
  private static instance: EventsBus;
  constructor() {
    super();
    if (EventsBus.instance) {
      return EventsBus.instance;
    }
    EventsBus.instance = this;
  }
}

// export declare interface EventsBus {
//   on(event: "selections", listener: (name: string) => void): this;
//   on(event: "all", listener: (event: ITestResponse) => void): this;
//   on(event: "task:result", listener: (name: string) => void): this;
//   on(event: "group:start", listener: (name: string) => void): this;
//   on(event: "group:end", listener: (name: string) => void): this;
//   on(event: "error", listener: (name: string) => void): this;
//   on(event: "debug", listener: (name: string) => void): this;
//   emit(event: string | symbol, ...args: any[]): boolean;
// }

// export class EventsBus extends EventEmitter {
//   private static instance: EventsBus;
//   constructor() {
//     super();
//     if (EventsBus.instance) {
//       return EventsBus.instance;
//     }
//     EventsBus.instance = this;
//   }

//   send(channels: string[], data: ITestResponse[]) {
//     channels.map((channel) => this.emit(channel, data));
//   }
// }
