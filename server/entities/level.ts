import { Field, ID, ObjectType } from 'type-graphql';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Assignment } from './assignment';
import { Score } from './score';

@ObjectType()
@Entity('level')
export class Level {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid', { name: 'level-id' })
    levelId?: string;

    @Field(() => Number)
    @Column({ name: 'level', type: 'int' })
    level?: number; // 1: easy; 2: normal; 3: hard

    @Field(() => String, { nullable: true })
    @Column({ name: 'description', type: 'longtext', nullable: true })
    description?: string;

    @Field(() => Number)
    @Column({ name: 'status', type: 'int', default: 0 })
    status?: number; // 0: not started; 1: in progress; 2: ready

    @Field(() => String)
    @Column({ name: 'code', type: 'longtext' })
    code?: string;

    @Field(() => String)
    @Column({ name: 'startcode', type: 'longtext' })
    startcode?: string;

    @Field(() => Assignment)
    @ManyToOne(() => Assignment, assignment => assignment.levels)
    @JoinColumn({ name: 'assignment-id' })
    assignment?: Assignment;

    @Field(() => [Score], { nullable: true })
    @OneToMany(() => Score, score => score.level)
    scores?: Score[];
};
