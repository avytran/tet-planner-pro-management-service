import { Request, Response, NextFunction } from "express";
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { getSigningKey } from "../config/jwksClient";
import { AuthErrorCode } from "../enums/authErrorCode.enum";

export const verifyJwt = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            status: "error",
            code: AuthErrorCode.TOKEN_MISSING,
            message: "Missing token"
        });
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, getSigningKey, { algorithms: ["RS256"] }, (err, decoded) => {
        if (err) {
            if (err instanceof TokenExpiredError) {
                return res.status(401).json({
                    success: false,
                    code: AuthErrorCode.TOKEN_EXPIRED,
                    message: "Access token expired",
                });
            }

            if (err instanceof JsonWebTokenError) {
                return res.status(401).json({
                    success: false,
                    code: AuthErrorCode.TOKEN_INVALID,
                    message: "Invalid access token",
                });
            }

            return res.status(401).json({
                success: false,
                code: AuthErrorCode.UNAUTHORIZED,
                message: "Unauthorized",
            });
        }

        req.user = decoded;
        next();
    })
}