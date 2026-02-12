import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('cognspective_user');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return { name: '', education: '' };
            }
        }
        return { name: '', education: '' };
    });

    useEffect(() => {
        localStorage.setItem('cognspective_user', JSON.stringify(user));
    }, [user]);

    const updateUser = (name, education) => {
        setUser({ name, education });
    };

    return (
        <UserContext.Provider value={{ user, updateUser }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}

export default UserContext;
