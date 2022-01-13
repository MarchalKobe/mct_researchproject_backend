import { Arg, Mutation, Query, Resolver } from 'type-graphql';
import { getRepository } from 'typeorm';
import admin from 'firebase-admin';
import bcrypt from 'bcrypt';
import { User } from '../../entities/user';
import { RegisterInput } from './register/RegisterInput';
import { LoginInput } from './login/LoginInput';
import { redis } from '../../redis';
import { sendEmail } from '../utils/sendEmail';
import { createConfirmationUrl, createPasswordRestoreUrl } from '../utils/createUrl';
import { RestorePasswordInput } from './password/RestorePasswordInput';
import { ForgotPasswordInput } from './password/ForgotPasswordInput';

@Resolver()
export class UserResolver {
    repository = getRepository(User);

    @Query(() => [User], { nullable: true })
    async getUsers(): Promise<User[] | null> {
        try {
            const users = await this.repository.find();
            console.log(users);
            return users;
            
        } catch(error: any) {
            console.error(error);
            return null;
        };
    };

    @Mutation(() => User, { nullable: true })
    async register(@Arg('data') data: RegisterInput): Promise<User | null> {
        try {
            const hashedPassword = await bcrypt.hash(data.password, 12);
            
            const newUser: User = {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                password: hashedPassword,
                type: data.type,
            };
    
            await this.repository.save(newUser);
            await sendEmail(newUser.email!, await createConfirmationUrl(newUser.userId!));
            return newUser;
        } catch(error: any) {
            console.error(error);
            return null;
        };
    };

    @Mutation(() => User, { nullable: true })
    async login(@Arg('data') data: LoginInput): Promise<User | null> {
        try {
            const user: User | undefined = await this.repository.findOne({ email: data.email });
    
            if(user) {
                const result = await bcrypt.compare(data.password, user.password!);

                if(result) {
                    if(!user.confirmed) return null;
    
                    let claims = {
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        type: user.type,
                    };
    
                    const customToken = await admin.auth().createCustomToken(user.userId as string, claims).then((token) => token);
    
                    if(customToken) {
                        user.token = customToken;
                        return user;
                    } else {
                        // console.error(`Error creating custom token: ${error}`);
                    };
                } else {
                    // response.status(404).send({ error: 'Password incorrect' });
                };
            } else {
                // response.status(404).send({ error: 'No account' });
            };
    
            return null;
        } catch(error: any) {
            console.error(error);
            return null;
        };
    };

    @Mutation(() => Boolean, { nullable: true })
    async confirm(@Arg('token') token: string): Promise<Boolean | null> {
        try {
            const userId = await redis.get(`confirmemail-${token}`);
    
            if(!userId) return false;
    
            const user = await this.repository.findOne({ userId: userId });
    
            if(user) {
                user.confirmed = true;
                await this.repository.save(user);
                await redis.del(`confirmemail-${token}`);
                return true;
            };
    
            return false;
        } catch(error: any) {
            console.error(error);
            return null;
        };
    };

    @Mutation(() => Boolean, { nullable: true })
    async forgotPassword(@Arg('data') data: ForgotPasswordInput): Promise<Boolean | null> {
        try {
            const user = await this.repository.findOne({ email: data.email });
    
            if(user) {
                await sendEmail(user.email!, await createPasswordRestoreUrl(user.userId!));
                return true;
            };
    
            return false;
        } catch(error: any) {
            console.error(error);
            return null;
        };
    };

    @Mutation(() => Boolean, { nullable: true })
    async restorePassword(@Arg('token') token: string, @Arg('data') data: RestorePasswordInput): Promise<Boolean | null> {
        try {
            const userId = await redis.get(`passwordrestore-${token}`);
    
            if(!userId) return false;
    
            const user = await this.repository.findOne({ userId: userId });
    
            if(user) {
                const hashedPassword = await bcrypt.hash(data.password!, 12);
                user.password = hashedPassword;
                await this.repository.save(user);
                await redis.del(`passwordrestore-${token}`);
                return true;
            };
    
            return false;
        } catch(error: any) {
            console.error(error);
            return null;
        };
    };
};
