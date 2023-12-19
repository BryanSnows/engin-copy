import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PipeModel } from './pipe-model.entity';
import { Angle } from './angle.entity';

@Entity('PIPE_MODEL_ANGLE')
export class PipeModelAngle {
  @PrimaryGeneratedColumn('increment')
  pipe_model_angles_id: number;

  @Column()
  pipe_model_id: number;

  @Column()
  angle_id: number;

  @Column()
  angle_order: number;

  @ManyToOne(() => PipeModel, (pipe) => pipe.pipeModelAngle)
  @JoinColumn({ name: 'pipe_model_id' })
  pipeModel: PipeModel;

  @ManyToOne(() => Angle, (pipeModel) => pipeModel.pipeModelAngle)
  @JoinColumn({ name: 'angle_id' })
  angles: PipeModel;
}
