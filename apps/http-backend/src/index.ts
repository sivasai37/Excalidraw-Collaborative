import express from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backendcommon/config";
import { middleware } from "./middleware";
import type { Request } from "express";
import {
  CreateRoomSchema,
  CreateUserSchema,
  SigninSchema,
} from "@repo/common/types";
import cors from "cors";

import { prismaClient } from "@repo/db/client";




const app = express();
app.use(express.json());
app.use(cors());

app.post("/signup", async (req, res) => {

  const parsedData = CreateUserSchema.safeParse(req.body);
  if (!parsedData.success) {
      console.log(parsedData.error);
      res.json({
          message: "Incorrect inputs"
      })
      return;
  }
  try {
      const user = await prismaClient.user.create({
          data: {
              email: parsedData.data?.email,
              // TODO: Hash the pw
              password: parsedData.data.password,
              name: parsedData.data.name
          }

      })
       console.log(user);
      res.json({
          userId: user.id
      })
  } catch(e) {
      res.status(411).json({
          message: "User already exists with this email"
      })
  }
})

app.post("/signin", async (req, res) => {
  const parsedData = SigninSchema.safeParse(req.body);
  console.log(parsedData);
  if (!parsedData.success) {
      res.json({
          message: "Incorrect inputs"
      })
      return;
  }

  // TODO: Compare the hashed pws here
  const user = await prismaClient.user.findFirst({
      where: {
          email: parsedData.data.email,
          password: parsedData.data.password
      }
  })

  if (!user) {
      res.status(403).json({
          message: "Not authorized"
      })
      return;
  }
  console.log('User signed in', user);

  const token = jwt.sign({
      userId: user?.id
  }, JWT_SECRET);

  res.json({
      token
  })
})

app.post("/room", middleware, async (req: Request, res) => {
    const parsedData = CreateRoomSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.json({
            message: "Incorrect inputs"
        });
        return;
    }
    // middleware attaches `userId` to the request when authorized
    // cast to any to access userId added by middleware
    const userId = (req as any).userId as string | undefined;
    if (!userId) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
  
    try {
        const room = await prismaClient.room.create({
            data: {
                slug: parsedData.data.name, // The name of the room
                adminId: userId // Admin of the room (current user)
            }
        });
  
        res.json({
            roomId: room.id // Return the unique room ID
        });
    } catch (e) {
        res.status(411).json({
            message: "Room already exists with this name"
        });
    }
  });
  

app.get("/chats/:roomId", async (req, res) => {
    try {
        const roomId = Number(req.params.roomId);
        console.log(req.params.roomId);
        const messages = await prismaClient.chat.findMany({
            where: {
                roomId: roomId
            },
            orderBy: {
                id: "desc"
            },
            take: 1000
        });

        res.json({
            messages
        })
    } catch(e) {
        console.log(e);
        res.json({
            messages: []
        })
    }
    
})

console.log("HTTP Backend Started");



const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});