import { Field, InputType } from 'type-graphql';
import { Length, IsUUID, IsBoolean } from 'class-validator';

@InputType()
export class UpdateCategoryInput {
    @Field()
    @IsUUID()
    categoryId: string;

    @Field()
    @Length(1, 255)
    name: string;

    @Field({ nullable: true })
    @IsBoolean()
    visible: boolean;
};
