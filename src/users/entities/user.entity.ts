import { ProfileEntity } from 'src/profile/entities/profile.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('USER')
export class User {
  @PrimaryGeneratedColumn()
  readonly user_id: number;

  @Column()
  user_name: string;

  @Column()
  user_email: string;

  @Column()
  user_status: boolean;

  @Column()
  user_refresh_token: string;

  @Column()
  profile_id: number;

  @ManyToOne(() => ProfileEntity)
  @JoinColumn({ name: 'profile_id' })
  profile: ProfileEntity;
}
