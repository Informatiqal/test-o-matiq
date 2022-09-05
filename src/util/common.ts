export function concatResults(data: string[]) {
  return `"` + data.join(`", "`) + `"`;
}
