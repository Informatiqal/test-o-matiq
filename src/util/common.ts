export function concatResults(data: string[]) {
  return `"` + data.join(`", "`) + `"`;
}

export const operations = {
  ">": function (a, b) {
    return a > b;
  },
  "<": function (a, b) {
    return a < b;
  },
  ">=": function (a, b) {
    return a >= b;
  },
  "<=": function (a, b) {
    return a <= b;
  },
  "==": function (a, b) {
    return a == b;
  },
  "=": function (a, b) {
    return a == b;
  },
  "!=": function (a, b) {
    return a != b;
  },
  "<>": function (a, b) {
    return a != b;
  },
};

export class Timing {
  startTime: string;
  endTime: string;
  elapsedTime: number;
  private startTimeDate: Date;
  private endTimeDate: Date;

  start() {
    this.startTimeDate = new Date();
    this.startTime = this.startTimeDate.toISOString();
  }

  stop() {
    this.endTimeDate = new Date();
    this.endTime = this.endTimeDate.toISOString();
    this.elapsedTime = Math.abs(
      (this.endTimeDate.getTime() - this.startTimeDate.getTime()) / 1000
    );
  }
}
