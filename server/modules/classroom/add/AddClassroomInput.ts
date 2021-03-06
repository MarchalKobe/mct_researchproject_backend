import { Field, InputType } from 'type-graphql';
import { Length } from 'class-validator';

@InputType()
export class AddClassroomInput {
    @Field()
    @Length(1, 255)
    name: string;
};
