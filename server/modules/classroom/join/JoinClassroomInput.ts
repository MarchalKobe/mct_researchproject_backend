import { Field, InputType } from 'type-graphql';
import { Length } from 'class-validator';

@InputType()
export class JoinClassroomInput {
    @Field()
    @Length(4, 4)
    classcode: string;
};
