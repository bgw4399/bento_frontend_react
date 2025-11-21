import React from 'react';
import { RegisterForm } from '@/pages/IntegratedRegisterPage/_components/register-form.jsx';

export default function IntegratedRegisterPage() {
  return (
    <div className="flex min-h-[calc(100vh-60px)] items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-balance text-3xl font-bold text-foreground">
            회원가입
          </h1>
          <p className="mt-2 text-muted-foreground">
            새로운 계정을 만들어보세요
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
