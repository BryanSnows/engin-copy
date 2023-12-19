import { PartialType } from '@nestjs/swagger';
import { CreateMachineModelDto } from './create-machine-model.dto';

export class UpdateMachineModelDto extends PartialType(CreateMachineModelDto) {}
