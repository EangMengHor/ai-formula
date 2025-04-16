import React, { createContext, useEffect, useState } from 'react';
import { useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { aiIntractions } from '../lib/config';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState({
        id: null,
        email: '',
        isAuthenticated: false
    });
    const { pathname } = useLocation();
    const [isSearchOn, setIsSearchOn] = useState(false);
    const [isDocumentOn, setIsDocumentOn] = useState(false);
    const [isVectorBaseOn, setIsVectorBaseOn] = useState(false);
    const [isSuperiorPersonaAttached, setIsSuperiorPersonaAttached] = useState(false)
    const [selectedSuperiorPersona, setSelectedSuperiorPersona] = useState([])
    const [SupPerItems, setSupPerItems] = useState([])
    const [currActiveIntraction, setCurrActiveIntraction] = useState(aiIntractions[0].value || "sequential")
    const [isDeepThinkMode, setIsDeepThinkMode] = useState(false); // Default to Quick Response

    console.log(user, 'user')
    useEffect(() => {
        console.log("Changs",isDeepThinkMode)
    }, [isDeepThinkMode])
    useEffect(() => {
        setIsDocumentOn(false)
    }, [pathname])


    const navigate = useNavigate();
    useEffect(() => {
        console.log(user, 'user')
    }, [user])



    function logout() {
        localStorage.removeItem('id')
        localStorage.removeItem('email')
        setUser({
            id: null,
            email: '',
            isAuthenticated: false
        })
        navigate('/login')
        toast({
            title: 'Success',
            description: 'Logged out successfully',
            variant: 'default'
        })
    }

    return (
        <UserContext.Provider value={{ user, setUser, logout, isSearchOn, setIsSearchOn, isDocumentOn, setIsDocumentOn, isVectorBaseOn, setIsVectorBaseOn, isSuperiorPersonaAttached, setIsSuperiorPersonaAttached, selectedSuperiorPersona, setSelectedSuperiorPersona, SupPerItems, setSupPerItems, currActiveIntraction, setCurrActiveIntraction, isDeepThinkMode, setIsDeepThinkMode }}>
            {children}
        </UserContext.Provider>
    );
};



export const useUser = () => {
    return useContext(UserContext);
};