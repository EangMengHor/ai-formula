import axios from "axios";
import { response } from "../../../lib/utils";

// this api makes the voice file to text
import { voiceToText } from '@/namespace/server'
export async function TTS(file) {
    try {
        console.log(file);
        const formData = new FormData();
        formData.append('data', file, { type: 'audio/webm' });

        const res = await axios.post(`${voiceToText}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        if (res.status == 200) {
            console.log(res.data[0].text);
            return response(true, "Voice to Text Success", res.data[0].text);
        }
        return response(false, "Voice to Text Failed", null);
    } catch (error) {
        return response(false, error.message, null);
    }
}
