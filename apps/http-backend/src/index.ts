import express from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backendcommon/config";
import { middleware } from "./middleware";
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
              email: parsedData.data?.username,
              // TODO: Hash the pw
              password: parsedData.data.password,
              name: parsedData.data.name
          }
      })
      res.json({
          userId: user.id
      })
  } catch(e) {
      res.status(411).json({
          message: "User already exists with this username"
      })
  }
})

app.post("/signin", async (req, res) => {
  const parsedData = SigninSchema.safeParse(req.body);
  if (!parsedData.success) {
      res.json({
          message: "Incorrect inputs"
      })
      return;
  }

  // TODO: Compare the hashed pws here
  const user = await prismaClient.user.findFirst({
      where: {
          email: parsedData.data.username,
          password: parsedData.data.password
      }
  })

  if (!user) {
      res.status(403).json({
          message: "Not authorized"
      })
      return;
  }

  const token = jwt.sign({
      userId: user?.id
  }, JWT_SECRET);

  res.json({
      token
  })
})

app.post("/room", middleware, async (req, res) => {
    const parsedData = CreateRoomSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.json({
            message: "Incorrect inputs"
        });
        return;
    }
    //@ts-ignore
    const userId = req.userId; // Get the userId from the middleware
  
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



app.listen(3002);
