import { Process } from 'src/process/entities/process.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('MACHINE_MODEL')
export class MachineModel {
  @PrimaryGeneratedColumn()
  machine_model_id: number;

  @Column()
  machine_model_name: string;

  @Column()
  machine_model_ip: string;

  @Column()
  machine_model_status: boolean;

  @OneToMany(() => Process, process => process.machineModel)
  processes: Process[];
}
