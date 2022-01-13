import { Field, InputType } from 'type-graphql';
import { Length } from 'class-validator';
import { User } from '../../../entities/user';

@InputType()
export class AddClassroomInput {
    @Field()
    @Length(1, 255)
    name: string;

    classcode?: string;

    userCreated?: User;
};
