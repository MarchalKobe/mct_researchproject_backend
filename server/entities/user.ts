import { Field, ID, Int, ObjectType } from 'type-graphql';
import { Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Classroom } from './classroom';
import { Score } from './score';

@ObjectType()
@Entity('user')
export class User {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid', { name: 'user-id' })
    userId?: string;

    @Field(() => String)
    @Column({ name: 'first-name' })
    firstName?: string;

    @Field(() => String)
    @Column({ name: 'last-name' })
    lastName?: string;
    
    @Field(() => String)
    @Column({ name: 'email', unique: true })
    email?: string;

    @Column({ name: 'password' })
    password?: string;

    @Field(() => String)
    @Column({ name: 'preferred-theme', default: 'dark' })
    preferredTheme?: string;

    @Field(() => Int)
    @Column({ name: 'type', type: 'int' })
    type?: number; // 0 = student; 1 = teacher

    @Column({ name: 'confirmed', type: 'boolean', default: false })
    confirmed?: boolean;

    @Field(() => String)
    @Column({ name: 'avatar', type: 'longtext' })
    avatar?: string;

    @Field(() => String, { nullable: true })
    token?: string;

    @Field(() => [Classroom], { nullable: true })
    @ManyToMany(() => Classroom, classroom => classroom.users)
    classrooms?: Classroom[];
    
    @Field(() => [Classroom], { nullable: true })
    @OneToMany(() => Classroom, classroom => classroom.userCreated)
    classroomsCreated?: Classroom[];

    @Field(() => [Score], { nullable: true })
    @OneToMany(() => Score, score => score.level)
    scores?: Score[];
};
