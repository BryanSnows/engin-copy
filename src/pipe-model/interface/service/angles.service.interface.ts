import { Angle } from 'src/pipe-model/entities/angle.entity';

export interface AngleServiceInterface {
  listAllAngles(): Promise<Angle[]>;
  findById(id: number): Promise<Angle>;
}
