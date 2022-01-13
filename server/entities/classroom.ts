import { Field, ID, ObjectType } from 'type-graphql';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user';

@ObjectType()
@Entity('classroom')
export class Classroom {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid', { name: 'classroom-id' })
    classroomId?: string;

    @Field(() => String)
    @Column({ name: 'name' })
    name?: string;

    @Field(() => String)
    @Column({ name: 'classcode' })
    classcode?: string;

    @Field(() => User)
    @ManyToOne(() => User, { lazy: true })
    @JoinColumn({ name: 'usercreated-id' })
    userCreated?: User;
};
