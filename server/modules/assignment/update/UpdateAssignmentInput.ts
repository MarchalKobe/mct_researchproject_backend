import { Field, InputType } from 'type-graphql';
import { Length, IsUUID, IsInt, IsBoolean } from 'class-validator';

@InputType()
export class UpdateAssignmentInput {
    @Field()
    @IsUUID()
    assignmentId: string;

    @Field()
    @Length(1, 255)
    subject: string;

    @Field({ nullable: true })
    @IsInt()
    position?: number;

    @Field({ nullable: true })
    @IsBoolean()
    ready: boolean;
};
