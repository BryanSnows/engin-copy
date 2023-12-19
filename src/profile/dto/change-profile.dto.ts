import { ApiProperty } from "@nestjs/swagger";

class ChangeProfileDto {
    
    @ApiProperty()
    profile_id: number;

    @ApiProperty({
        type: [Number]
    })
    transaction_ids: number[];
}

export class ChangeProfileArrayDto {
    @ApiProperty({
        type: [ChangeProfileDto]
    })
    profiles: ChangeProfileDto[]
}