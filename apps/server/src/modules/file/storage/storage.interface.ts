import { Readable } from 'stream';

export interface IFileStorage {
  save(buffer: Buffer, storedName: string, mimeType: string): Promise<string>;
  getReadStream(storedName: string): Promise<Readable>;
}
