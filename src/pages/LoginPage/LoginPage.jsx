import React, { useState } from 'react';
import Footer from '../../components/Footer.jsx'; // Footer 컴포넌트 경로

export default function LoginPage() {
    // Svelte의 let 변수 -> React의 useState Hook
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    const handleLogin = (event) => {
        event.preventDefault(); // Svelte의 on:submit|preventDefault 역할
        if (!id || !password) {
            setLoginError('Please fill in both ID and Password.');
            return;
        }
        // 실제 로그인 로직
        console.log('Logging in with', id, password);
        setLoginError('');
    };

    return (
        <>
            <title>Login - Bento</title>
            <div className="flex items-center justify-center">
                <div className="flex items-center justify-center min-h-[calc(100vh-60px)] w-[50vw] bg-gradient-to-b from-white to-blue-50">
                    <div className="text-center w-[45%]">
                        <h1 className="text-3xl font-bold text-gray-800">Welcome to Bento</h1>
                        <p className="text-gray-500 mt-2">Your gateway to intelligent patient data insights</p>
                    </div>
                </div>

                <div className="flex justify-center min-h-[calc(100vh-60px)] w-[50vw] bg-gradient-to-b from-blue-50 to-white">
                    <div className="flex justify-center items-center mt-10 w-[400px]">
                        <form
                            onSubmit={handleLogin}
                            className="max-w-[500px] w-full bg-white p-6 rounded-lg shadow-md border border-gray-200"
                        >
                            <h2 className="text-xl font-semibold mb-4 text-center">Login</h2>
                            <div className="mb-4">
                                <label htmlFor="id" className="block text-sm font-medium text-gray-700">ID</label>
                                <input
                                    id="id"
                                    type="text"
                                    value={id}
                                    onChange={(e) => setId(e.target.value)}
                                    placeholder="Enter ID"
                                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter Password"
                                    autoComplete="current-password"
                                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            {loginError && (
                                <p className="text-red-500 text-sm mb-2">{loginError}</p>
                            )}
                            <button
                                type="submit"
                                className="w-full mt-2 bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Login
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}