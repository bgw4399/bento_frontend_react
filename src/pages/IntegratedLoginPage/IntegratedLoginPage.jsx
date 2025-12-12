import React from 'react';
import { LoginForm } from '@/pages/IntegratedLoginPage/_components/login-form.jsx';

export default function IntegratedLoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-60px)] items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-balance text-3xl font-bold text-foreground">
            로그인
          </h1>
          {/*<p className="mt-2 text-muted-foreground">계정 정보를 입력해주세요</p>*/}
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
