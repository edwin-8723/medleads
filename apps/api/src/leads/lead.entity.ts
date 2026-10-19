import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Coordination, LeadStatus } from './lead.enums.js';

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'full_name', type: 'varchar', length: 120 })
  fullName: string;

  @Column({ type: 'varchar', length: 160 })
  email: string;

  @Column({ type: 'varchar', length: 30 })
  phone: string;

  @Column({ type: 'varchar', length: 80 })
  country: string;

  @Column({ type: 'varchar', length: 120 })
  procedure: string;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Index()
  @Column({ type: 'varchar', length: 20 })
  coordination: Coordination;

  @Column({ type: 'varchar', length: 20, default: LeadStatus.NUEVO })
  status: LeadStatus;

  @Index()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
