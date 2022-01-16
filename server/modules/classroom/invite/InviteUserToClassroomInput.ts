import { Field, InputType } from 'type-graphql';
import { IsEmail, IsUUID } from 'class-validator';

@InputType()
export class InviteUserToClassroomInput {
    @Field()
    @IsEmail()
    email: string;

    @Field()
    @IsUUID()
    classroomId: string;
};
