import { Field, InputType } from 'type-graphql';
import { Length, IsUUID } from 'class-validator';

@InputType()
export class AddCategoryInput {
    @Field()
    @Length(1, 255)
    name: string;

    @Field()
    @IsUUID()
    classroomId: string;
};
