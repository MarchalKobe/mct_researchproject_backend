import { IsEmail, IsOptional } from 'class-validator';
import { Field, InputType } from 'type-graphql';

@InputType()
export class ForgotPasswordInput {
    @Field({ nullable: true })
    @IsEmail()
    @IsOptional()
    email: string;
};
