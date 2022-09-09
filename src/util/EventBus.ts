import { EventEmitter } from "events";
import {
  IEventError,
  IEventGroupStartEnd,
  IGroupResult,
} from "../interface/Specs";
import TypedEmitter from "typed-emitter";

type MessageEvents = {
  testError: (error: IEventError) => void;
  all: (body: { message: string }) => void;
  group: (body: IEventGroupStartEnd) => void;
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
