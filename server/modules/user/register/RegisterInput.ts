import { Field, InputType } from 'type-graphql';
import { Length, IsEmail, MinLength, IsInt } from 'class-validator';

@InputType()
export class RegisterInput {
    @Field()
    @Length(1, 255)
    firstName: string;

    @Field()
    @Length(1, 255)
    lastName: string;
    
    @Field()
    @IsEmail()
    email: string;

    @Field()
    @MinLength(5)
    password: string;

    @Field()
    @IsInt()
    type: number;
};
