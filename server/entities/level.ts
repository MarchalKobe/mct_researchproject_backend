import { Field, ID, ObjectType } from 'type-graphql';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Assignment } from './assignment';

@ObjectType()
@Entity('level')
export class Level {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid', { name: 'level-id' })
    levelId?: string;

    @Field(() => Number)
    @Column({ name: 'level', type: 'int' })
    level?: number; // 1: easy; 2: normal; 3: hard

    @Field(() => String)
    @Column({ name: 'description', type: 'longtext', nullable: true })
    description?: string;

    @Field(() => Boolean)
    @Column({ name: 'ready', type: 'boolean', default: false })
    ready?: boolean;

    @Field(() => Assignment)
    @ManyToOne(() => Assignment, assignment => assignment.levels)
    // @JoinColumn()
    @JoinColumn({ name: 'assignment-id' })
    assignment?: Assignment;
};
