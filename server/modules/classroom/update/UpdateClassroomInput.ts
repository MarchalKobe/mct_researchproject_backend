import { Field, InputType } from 'type-graphql';
import { Length, IsUUID } from 'class-validator';

@InputType()
export class UpdateClassroomInput {
    @Field()
    @IsUUID()
    classroomId: string;

    @Field()
    @Length(1, 255)
    name: string;
};
