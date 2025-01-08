import { getChatSessionHistory as url } from '@/namespace/server'
import { response } from '../../../lib/utils';
import axios from 'axios';

export async function getChatSessionHistory(id, pagination) {
    try {
        const _response = await axios.post(`${url}`, {
            userId: id, pagination
        });

        if (Object.keys(_response.data[0]).length <= 0) {
            return response(false,"Can't Get chat history", null);
        }

        return response(true, "Successfully Fetched Chat History", _response.data[0]);
    } catch (error) {
        return response(false, error.message, null);

    }
}