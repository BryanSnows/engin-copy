import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Angle } from './entities/angle.entity';
import { AngleServiceInterface } from './interface/service/angles.service.interface';

@Injectable()
export class AngleService implements AngleServiceInterface {
  constructor(
    @InjectRepository(Angle)
    private angleRepository: Repository<Angle>,
  ) {}

  async listAllAngles(): Promise<Angle[]> {
    return await this.angleRepository.find();
  }

  async findById(id: number): Promise<Angle> {
    const angle = await this.angleRepository.findOne({
      where: {
        angle_id: id,
      },
    });

    if (!angle) {
      throw new NotFoundException(`Ângulo com ID ${id} não encontrado.`);
    }

    return angle;
  }
}
