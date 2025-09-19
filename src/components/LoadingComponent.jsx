import React from 'react';
import './LoadingComponent.css'; // 1. CSS 파일을 import 합니다.

// 2. Svelte의 'export let' -> 함수의 인자로 props를 받습니다.
export default function LoadingComponent({ message = 'Loading...' }) {
  return (
    <div className="loading-container">
      <div className="spinner mr-5"></div>
      <p>{message}</p>
    </div>
  );
}
