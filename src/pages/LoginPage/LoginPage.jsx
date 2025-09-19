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
        <div className="flex min-h-[calc(100vh-60px)] w-[50vw] items-center justify-center bg-gradient-to-b from-white to-blue-50">
          <div className="w-[45%] text-center">
            <h1 className="text-3xl font-bold text-gray-800">
              Welcome to Bento
            </h1>
            <p className="mt-2 text-gray-500">
              Your gateway to intelligent patient data insights
            </p>
          </div>
        </div>

        <div className="flex min-h-[calc(100vh-60px)] w-[50vw] justify-center bg-gradient-to-b from-blue-50 to-white">
          <div className="mt-10 flex w-[400px] items-center justify-center">
            <form
              onSubmit={handleLogin}
              className="w-full max-w-[500px] rounded-lg border border-gray-200 bg-white p-6 shadow-md"
            >
              <h2 className="mb-4 text-center text-xl font-semibold">Login</h2>
              <div className="mb-4">
                <label
                  htmlFor="id"
                  className="block text-sm font-medium text-gray-700"
                >
                  ID
                </label>
                <input
                  id="id"
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder="Enter ID"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  autoComplete="current-password"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {loginError && (
                <p className="mb-2 text-sm text-red-500">{loginError}</p>
              )}
              <button
                type="submit"
                className="mt-2 w-full rounded-md bg-blue-600 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
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
