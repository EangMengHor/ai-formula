import React, { createContext, useEffect, useState } from 'react';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState({
        id: null,
        email: '',
        isAuthenticated: false
    });
    const { pathname } = useNavigate();
    const [isSearchOn, setIsSearchOn] = useState(false);
    const [isDocumentOn, setIsDocumentOn] = useState(false);
    const [isVectorBaseOn, setIsVectorBaseOn] = useState(false);
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
        if (user.isAuthenticated) {
            navigate(pathname)
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
        <UserContext.Provider value={{ user, setUser, logout, isSearchOn, setIsSearchOn, isDocumentOn, setIsDocumentOn, isVectorBaseOn, setIsVectorBaseOn }}>
            {children}
        </UserContext.Provider>
    );
};



export const useUser = () => {
    return useContext(UserContext);
};