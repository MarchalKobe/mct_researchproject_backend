import { Request } from 'express';
import jwt_decode from 'jwt-decode';

export const ContextToUserId = (req: Request) => {
    const bearerHeader = req.headers.authorization!.split(' ')[1];
    const decodedToken = jwt_decode(bearerHeader) as any;
    // console.log(bearerHeader);
    if(decodedToken.uid) return decodedToken.uid;
    return decodedToken.user_id;
};
