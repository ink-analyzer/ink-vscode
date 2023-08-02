// Describes a group of tests to run on a smart contract code from a source file.
export type TestGroup = {
  source: string;
  testCases: Array<TestCase>;
};

// Describes a single test case in a `TestGroup`.
export type TestCase = {
  name: string;
  edits?: Array<TestEdit>;
  params?: {
    startPos: [number, number];
    endPos?: [number, number];
  };
  results: Array<TestResult>;
};

// Describes a modification/edit to perform on the original smart contract code.
export type TestEdit = {
  text: string;
  startPos: [number, number];
  endPos?: [number, number];
};

// Describes an expected test result.
export type TestResult = {
  text: string;
  startPos?: [number, number];
  endPos?: [number, number];
};
