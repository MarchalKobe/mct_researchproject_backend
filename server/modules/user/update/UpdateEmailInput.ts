import { Length, IsEmail } from 'class-validator';
import { Field, InputType } from 'type-graphql';

@InputType()
export class UpdateEmailInput {
    @Field()
    @IsEmail()
    email: string;
};
