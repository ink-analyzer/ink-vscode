export type TestGroup = {
  source: string;
  testCases: Array<TestCase>;
};

export type TestCase = {
  name: string;
  edits?: Array<TestEdit>;
  params?: {
    startPos: [number, number];
    endPos?: [number, number];
  };
  results: Array<TestResult>;
};

export type TestEdit = {
  text: string;
  startPos: [number, number];
  endPos?: [number, number];
};

export type TestResult = {
  text: string;
  startPos?: [number, number];
  endPos?: [number, number];
};
