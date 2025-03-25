import { useEffect, useState } from "react"

export default function PersonaOnBoard({ personaState }) {
    const [parentCallState, setParentCallState] = useState()
    useEffect(() => {
        if (personaState) {
            setParentCallState(personaState)
        }
    }, [personaState])


    return (
        <div>
            
        </div>
    )
}