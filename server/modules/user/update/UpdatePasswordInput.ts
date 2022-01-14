import { MinLength } from "class-validator";
import { Field, InputType } from "type-graphql";

@InputType()
export class UpdatePasswordInput {
    @Field()
    @MinLength(5)
    current?: string;

    @Field()
    @MinLength(5)
    password?: string;
};
