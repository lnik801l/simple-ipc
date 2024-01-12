export class ExtendedError extends Error {
  public constructor(message: string, public description?: string, public trace?: string) {
    super(message);
  }
}
