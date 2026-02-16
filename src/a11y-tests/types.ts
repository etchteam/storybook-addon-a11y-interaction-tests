export type Step = (
  name: string,
  callback: () => Promise<void>,
) => void | Promise<void>;
