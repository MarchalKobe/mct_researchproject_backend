import { Field, InputType } from 'type-graphql';
import { Length, IsUUID } from 'class-validator';

@InputType()
export class UpdateAssignmentInput {
    @Field()
    @IsUUID()
    assignmentId: string;

    @Field()
    @Length(1, 255)
    subject: string;
};
