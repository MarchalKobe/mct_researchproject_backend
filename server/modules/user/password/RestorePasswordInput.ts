import { MinLength, IsOptional } from 'class-validator';
import { Field, InputType } from 'type-graphql';

@InputType()
export class RestorePasswordInput {
    @Field({ nullable: true })
    @MinLength(5)
    @IsOptional()
    password: string;
};
