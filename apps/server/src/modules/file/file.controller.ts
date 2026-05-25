import { Controller, Post, UseInterceptors, UploadedFile, Param, Get, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    return this.fileService.upload(file);
  }

  @Get(':id/preview')
  async preview(@Param('id') id: string, @Res() res) {
    const { stream, mimeType } = await this.fileService.getPreviewStream(id);
    res.set('Content-Type', mimeType);
    stream.pipe(res);
  }
}
