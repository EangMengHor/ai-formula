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


    useEffect(() => {
        console.log("Changs", currActiveIntraction, isSuperiorPersonaAttached)
    }, [currActiveIntraction, isSuperiorPersonaAttached,])
    useEffect(() => {
        setIsDocumentOn(false)
    }, [pathname])


    const navigate = useNavigate();
    useEffect(() => {
        console.log(user, 'user')
    }, [user])

    useEffect(() => {
        localStorage.getItem('id') && setUser({
            id: localStorage.getItem('id'),
            email: localStorage.getItem('email'),
            isAuthenticated: true
        })

    }, [])

    useEffect(() => {
        if (!user.isAuthenticated) {
            navigate('/login')
        }
    }, [user.isAuthenticated])


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
        <UserContext.Provider value={{ user, setUser, logout, isSearchOn, setIsSearchOn, isDocumentOn, setIsDocumentOn, isVectorBaseOn, setIsVectorBaseOn, isSuperiorPersonaAttached, setIsSuperiorPersonaAttached, selectedSuperiorPersona, setSelectedSuperiorPersona, SupPerItems, setSupPerItems, currActiveIntraction, setCurrActiveIntraction }}>
            {children}
        </UserContext.Provider>
    );
};



export const useUser = () => {
    return useContext(UserContext);
};