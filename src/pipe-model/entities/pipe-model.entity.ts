import { ProductionGoal } from 'src/production-goal/entities/production-goal.entity';
import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PipeModelAngle } from './pipe-model-angle.entity';
import { Angle } from './angle.entity';
import { BitToBooleanTransformer } from 'src/config/database/transformers/bit-to-boolean.transformers';

@Entity('PIPE_MODEL')
export class PipeModel {
  @PrimaryGeneratedColumn()
  pipe_model_id: number;

  @Column()
  pipe_model_name: string;

  @Column()
  pipe_model_code: string;

  @Column()
  pipe_model_path?: string;

  @Column()
  pipe_model_status: boolean;

  @Column({ type: 'date' })
  pipe_model_created_at: Date;

  @Column({ type: 'date' })
  pipe_model_updated_at: Date;

  @Column()
  pipe_model_length: number;

  @Column()
  pipe_model_diameter: string;

  @Column({
    type: 'bit',
    transformer: new BitToBooleanTransformer(),
  })
  pipe_model_expansion: boolean;

  @Column({
    type: 'bit',
    transformer: new BitToBooleanTransformer(),
  })
  pipe_model_reduction: boolean;

  @Column()
  pipe_model_folds: number;

  @OneToMany(() => ProductionGoal, (productionGoal) => productionGoal.pipe_model_id)
  productionGoals: ProductionGoal[];

  @OneToMany(() => PipeModelAngle, (pipeModelAngle) => pipeModelAngle.pipeModel)
  pipeModelAngle: PipeModelAngle[];

  @ManyToMany(() => Angle, { eager: true })
  @JoinTable({
    name: 'PIPE_MODEL_ANGLE',
    joinColumn: {
      name: 'pipe_model_id',
      referencedColumnName: 'pipe_model_id',
    },
    inverseJoinColumn: {
      name: 'angle_id',
      referencedColumnName: 'angle_id',
    },
  })
  angle: Angle[];
}
