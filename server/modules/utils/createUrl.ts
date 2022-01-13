
import { v4 } from 'uuid';
import { redis } from "../../redis";

export const createConfirmationUrl = async (userId: string) => {
    const token = v4();
    await redis.set(`confirmemail-${token}`, userId, 'ex', 60 * 60 * 4) // 4 hours experation
    return `http://localhost:3001/confirm?token=${token}`;
};

export const createPasswordRestoreUrl = async (userId: string) => {
    const token = v4();
    await redis.set(`passwordrestore-${token}`, userId, 'ex', 60 * 60 * 4) // 4 hours experation
    return `http://localhost:3001/restorepassword?token=${token}`;
};
