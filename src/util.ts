import { DEFAULT_FILE_COUNT, DEFAULT_FLOAT_TOLERANCE } from "./constants";

const getRandomIntUpTo = (upToNumber: number) =>
  Math.floor(Math.random() * upToNumber);

const getRandomFileNumber = () => 1 + getRandomIntUpTo(DEFAULT_FILE_COUNT);

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const isClose = (
  a: number,
  b: number,
  relTol: number = DEFAULT_FLOAT_TOLERANCE,
  absTol: number = 0,
) =>
  Math.abs(a - b) <=
  Math.max(relTol * Math.max(Math.abs(a), Math.abs(b)), absTol);

export { clamp, getRandomFileNumber, getRandomIntUpTo, isClose };
