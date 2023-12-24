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

// TODO: bit more work required here!
export function compareWithVariance(variance: string, resultValue: number) {
  let comparisonValue = parseNum(variance);
  let upperLimit: number = 0;
  let lowerLimit: number = 0;

  if (variance.includes("%")) {
    comparisonValue = comparisonValue / 100;

    if (variance.includes("+-") || variance.includes("-+")) {
      upperLimit = resultValue * comparisonValue + resultValue;
      lowerLimit = resultValue - resultValue * comparisonValue;

      return { upperLimit, lowerLimit };
    }

    if (!variance.includes("+") && !variance.includes("-")) {
      upperLimit = resultValue * comparisonValue + resultValue;
      lowerLimit = upperLimit;

      return { upperLimit, lowerLimit };
    }

    if (variance.includes("+") && !variance.includes("-")) {
      upperLimit = resultValue * comparisonValue + resultValue;
      lowerLimit = upperLimit;

      return { upperLimit, lowerLimit };
    }

    if (!variance.includes("+") && variance.includes("-")) {
      lowerLimit = resultValue - resultValue * comparisonValue;
      upperLimit = lowerLimit;

      return { upperLimit, lowerLimit };
    }
  }

  if (!variance.includes("%")) {
    if (variance.includes("+-") || variance.includes("-+")) {
      upperLimit = resultValue + comparisonValue;
      lowerLimit = resultValue - comparisonValue;

      return { upperLimit, lowerLimit };
    }

    if (!variance.includes("+") && !variance.includes("-")) {
      upperLimit = resultValue + comparisonValue;
      lowerLimit = upperLimit;

      return { upperLimit, lowerLimit };
    }

    if (variance.includes("+") && !variance.includes("-")) {
      upperLimit = resultValue + comparisonValue;
      lowerLimit = upperLimit;

      return { upperLimit, lowerLimit };
    }

    if (!variance.includes("+") && variance.includes("-")) {
      lowerLimit = resultValue - comparisonValue;
      upperLimit = lowerLimit;

      return { upperLimit, lowerLimit };
    }
  }
}

// extract/keep numeric values from string
export const parseNum = (str: string) => +str.replace(/[^.\d]/g, "");

// check if given number is in range
export const inRange = (num, min, max) => num >= min && num <= max;
