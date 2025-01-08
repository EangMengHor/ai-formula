import React, { createContext, useEffect, useState } from 'react';
import { useContext } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState({
        id: null,
        email: '',
        isAuthenticated: false
    });

useEffect(()=>{
    console.log(user, 'user')
},[user])

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};



export const useUser = () => {
    return useContext(UserContext);
};