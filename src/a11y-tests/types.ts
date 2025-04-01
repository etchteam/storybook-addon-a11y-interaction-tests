export type Step = (
  name: string,
  callback: () => Promise<void>,
) => Promise<void>;
