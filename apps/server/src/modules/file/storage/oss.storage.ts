import { Injectable, NotImplementedException } from '@nestjs/common';
import { Readable } from 'stream';
import { IFileStorage } from './storage.interface';

@Injectable()
export class OssStorage implements IFileStorage {
  async save(): Promise<string> {
    throw new NotImplementedException('OSS storage is not configured in stage-one local development.');
  }

  async getReadStream(): Promise<Readable> {
    throw new NotImplementedException('OSS storage is not configured in stage-one local development.');
  }
}
