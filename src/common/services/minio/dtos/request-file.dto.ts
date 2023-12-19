import { ApiProperty } from "@nestjs/swagger";

export class RequestFileDto {
    @ApiProperty()
    hashed_file_path: string;
}