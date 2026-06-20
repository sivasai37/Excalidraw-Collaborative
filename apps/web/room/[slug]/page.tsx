import { BACKEND_URL } from "../../config"
import axios from "axios";

async function getRoom(slug:string) {
    const response = await axios.get(`${BACKEND_URL}/room/${slug}`);
   return response.data.room.id;
}
export default async function ChatRoom({
    params
}:{
    params:{
        slug:string
    }
}){
    const slug = params.slug;
    const roomId = await getRoom(slug);
}