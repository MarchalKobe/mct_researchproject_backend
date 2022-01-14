import { Length, IsEmail } from "class-validator";
import { Field, InputType } from "type-graphql";

@InputType()
export class UpdateGeneralInput {
    @Field()
    @Length(1, 255)
    firstName: string;

    @Field()
    @Length(1, 255)
    lastName: string;
};
