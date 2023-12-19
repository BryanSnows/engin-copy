import { ApiProperty } from "@nestjs/swagger";
import { CreateProfileDto } from "./create-profile.dto";

export class UpdateProfileDto {
    @ApiProperty({ required: false})
    profile_name?: string;
  
    @ApiProperty({ required: false, type: [Number] })
    transaction_id?: number[];
};