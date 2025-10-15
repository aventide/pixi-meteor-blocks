import { DEFAULT_FILE_COUNT } from "./constants";

const getRandomIntUpTo = (upToNumber: number) =>
  Math.floor(Math.random() * upToNumber);

const getRandomFileNumber = () => 1 + getRandomIntUpTo(DEFAULT_FILE_COUNT);

export { getRandomFileNumber, getRandomIntUpTo };
