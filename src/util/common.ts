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
  "!=": function (a, b) {
    return a != b;
  },
};
