import { Field, InputType } from 'type-graphql';
import { Length, IsUUID } from 'class-validator';

@InputType()
export class AddAssignmentInput {
    @Field()
    @Length(1, 255)
    subject: string;

    @Field()
    @IsUUID()
    categoryId: string;
};
