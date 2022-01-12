import { Field, ID, Int, ObjectType } from 'type-graphql';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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

    @Field(() => String, { nullable: true })
    token?: string;
};
