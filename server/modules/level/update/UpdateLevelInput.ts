import { Field, InputType } from 'type-graphql';
import { Length, IsUUID, IsInt,  } from 'class-validator';

@InputType()
export class UpdateLevelInput {
    @Field()
    @IsUUID()
    levelId: string;

    @Field()
    @Length(0, 10000)
    description: string;

    @Field()
    @IsInt()
    status: number;

    @Field()
    code: string;

    @Field()
    startcode: string;
};
