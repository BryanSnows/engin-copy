import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PipeModelAngle } from './pipe-model-angle.entity';

@Entity('ANGLE')
export class Angle {
  @PrimaryGeneratedColumn('increment')
  angle_id: number;

  @Column()
  angle_dimension: string;

  @OneToMany(() => PipeModelAngle, (pipeModelAngle) => pipeModelAngle.angles)
  pipeModelAngle: PipeModelAngle[];
}
