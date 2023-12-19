import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class PaginationPipe implements PipeTransform {
  transform(value: any) {
    const page = parseInt(value.page) || 1;
    const limit = parseInt(value.limit) || 10;

    return {
      ...value,
      page,
      limit,
    };
  }
}
