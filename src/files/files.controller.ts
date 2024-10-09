import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('product')
  @UseInterceptors(FileInterceptor('file')) // Asegúrate de que el campo en el form-data sea 'file'
  uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { message: 'No se ha subido ningún archivo' };
    }
    // Puedes procesar el archivo aquí o simplemente devolver los metadatos del archivo
    return {
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      file,
    };
  }
}
