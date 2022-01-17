import { Field, InputType } from 'type-graphql';
import { Length, IsUUID } from 'class-validator';

@InputType()
export class UpdateCategoryInput {
    @Field()
    @IsUUID()
    categoryId: string;

    @Field()
    @Length(1, 255)
    name: string;
};
