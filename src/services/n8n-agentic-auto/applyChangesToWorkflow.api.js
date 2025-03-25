import axios from "axios";
import { response } from "../../lib/utils";
import { applyChangesToWorkflowUrl } from "../../namespace/server";

export async function applyChangesToWorkflow(existingWorkflow,prompt){
    try {
        const res = await axios.post(applyChangesToWorkflowUrl,{
            prompt:prompt,
            prev:existingWorkflow
        })
        if(res.status !== 200){
            return response(false,"Can't Perform Changes , Try Again!")
        }
        return response(true,"Successfully Changed Workflow",res.data.data)
    } catch (error) {
        return response(false,error.message)
    }
}