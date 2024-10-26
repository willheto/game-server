export function runLengthEncode(input: string): string {
  let encoded = "";
  let count = 1;

  for (let i = 0; i < input.length; i++) {
    if (input[i] === input[i + 1]) {
      count++;
    } else {
      encoded += input[i] + count;
      count = 1;
    }
  }

  if (input.length > 0) {
    encoded += input[input.length - 1] + count;
  }

  return encoded;
}
