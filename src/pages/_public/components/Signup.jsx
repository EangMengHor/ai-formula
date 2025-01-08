import React, { useState } from 'react';
import { login } from '../../../namespace/client';
import { signup } from '../../../services/n8n-apis/_auth/Signup.api.js';
import { Link } from 'react-router-dom';
import { useToast } from '../../../hooks/use-toast';
import { Loader } from 'lucide-react';
import { useUser } from '../../../context/UserContext';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { setUser } = useUser();
    async function handleSignup() {
        if (email.length === 0 || password.length === 0) {
            toast({
                title: 'Error',
                description: 'Please fill all the fields',
                variant: "destructive"
            });
            return;
        }
        setIsLoading(true);
        try {
            const response = await signup(email, password);
            console.log(response, 'response');
            if (response.success) {
                localStorage.setItem('id', response.data.id)
                localStorage.setItem('email', response.data.email)
                localStorage
                setUser({
                    id: response.data.id,
                    email: response.data.email,
                    isAuthenticated: true
                });
                toast({
                    title: 'Success',
                    description: response.data.message,
                    variant: 'default'
                });
            } else {
                toast({
                    title: 'Error',
                    description: response.message,
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-gray-900 to-gray-800">
            <h1 className="text-4xl font-bold mb-6 text-white">Create New Account</h1>
            <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-sm">
                <div className="mb-4">
                    <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="email">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 bg-gray-800 text-gray-300 leading-tight focus:outline-none focus:shadow-outline"
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="password">
                        Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 bg-gray-800 text-gray-300 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                    />
                </div>
                <div className="flex items-center justify-between">
                    <button
                        onClick={handleSignup}
                        className="bg-blue-600 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                        {
                            isLoading ? (
                                <Loader className="animate-spin" />
                            ) : (
                                'Sign Up'
                            )
                        }
                    </button>
                </div>
                <p className='flex gap-2 text-gray-400 font-semibold m-4'>
                    or
                    <Link to={login} className="text-blue-400 hover:text-blue-600">Log in</Link>
                </p>
            </div>
        </div>
    );
};