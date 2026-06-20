import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backendcommon/config";

interface RequestWithUser extends Request {
    userId?: string;
}

export async function middleware(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers["authorization"] ?? req.headers["Authorization"] ?? "";
        const token = typeof authHeader === "string" ? authHeader.replace(/^Bearer\s+/i, "") : "";

        if (!token) {
            res.status(401).json({ message: "Missing authorization token" });
            return;
        }

        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload | string;

        if (!decoded || typeof decoded === "string" || !('userId' in decoded)) {
            res.status(403).json({ message: "Invalid token" });
            return;
        }

        req.userId = String((decoded as JwtPayload).userId);
        next();
    } catch (err) {
        console.error('Auth middleware error', err);
        res.status(403).json({ message: "Unauthorized" });
    }
}