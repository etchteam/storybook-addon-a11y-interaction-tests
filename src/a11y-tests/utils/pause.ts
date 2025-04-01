// Sometimes a pause is needed after user interactions to allow for animations to complete.
export async function pause(delay: number = 500): Promise<void> {
  await new Promise((r) => setTimeout(r, delay));
}
