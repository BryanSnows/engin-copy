import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MinioService } from 'nestjs-minio-client';
import { BufferedFile } from './interfaces/file.interface';
import { ConfigService } from '@nestjs/config';
import { RequestFileDto } from './dtos/request-file.dto';
import { Response } from 'express';
import { createReadStream, unlinkSync } from 'fs';

@Injectable()
export class MinioClientService {
  constructor(
    private readonly minioService: MinioService,
    private readonly configService: ConfigService,
  ) {}

  private readonly bucket = this.configService.get('minio.bucket');

  get client() {
    return this.minioService.client;
  }

  async get(requestFileDto: RequestFileDto, response: Response) {
    const { hashed_file_path } = requestFileDto;
    const hashed_file_name = hashed_file_path.replace(`${this.bucket}/`, '');
    const filePath = `./tmp/${hashed_file_name}`;

    return new Promise((resolve, reject) => {
      this.client.fGetObject(this.bucket, hashed_file_name, filePath, function (error: any) {
        if (error) {
          reject(error);
        }

        response.setHeader('Content-Type', 'application/pdf');
        response.setHeader('Content-Disposition', `attachment; filename="${hashed_file_name}"`);

        resolve(filePath);
      });
    })
      .then(async (file_path: string) => {
        const stream = createReadStream(file_path);
        stream.pipe(response);

        stream.on('end', () => {
          unlinkSync(file_path);
        });
      })
      .catch((error) => {
        throw new NotFoundException(error.message);
      });
  }

  async upload(file: BufferedFile): Promise<string> {
    const metaData = {
      'Content-Type': file.mimetype,
    };

    const hashedFileName = file.fieldname;
    const extension = new Date().toLocaleDateString('pt-BR').replace(/\//g, '_');

    const filename = hashedFileName + '_' + extension;
    const file_path = `${this.configService.get('minio.bucket')}/${filename}`;

    return new Promise((resolve, reject) => {
      try {
        return this.client.putObject(
          this.bucket,
          filename,
          file.buffer,
          file.buffer.length,
          metaData,
          (err: any) => {
            if (err) {
              reject(err);
            }
            resolve(file_path);
          },
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  async delete(filename: string, bucket: string = this.bucket): Promise<any> {
    try {
      return this.client.removeObject(bucket, filename, (err: any) => {
        if (err) throw new BadRequestException('Error removing file');
      });
    } catch (error) {
      return false;
    }
  }
}
