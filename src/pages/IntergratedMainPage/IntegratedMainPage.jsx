import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function IntegratedMainPage() {
  return (
    <div className="min-h-[calc(100vh-60px)] bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      {/*<header className="sticky top-0 z-10 border-b border-border/50 bg-card/50 backdrop-blur-sm">*/}
      {/*  <div className="container mx-auto flex items-center justify-between px-4 py-4">*/}
      {/*    <div className="flex items-center gap-2">*/}
      {/*      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">*/}
      {/*        <svg*/}
      {/*          className="h-6 w-6 text-primary-foreground"*/}
      {/*          fill="none"*/}
      {/*          stroke="currentColor"*/}
      {/*          viewBox="0 0 24 24"*/}
      {/*        >*/}
      {/*          <path*/}
      {/*            strokeLinecap="round"*/}
      {/*            strokeLinejoin="round"*/}
      {/*            strokeWidth={2}*/}
      {/*            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"*/}
      {/*          />*/}
      {/*        </svg>*/}
      {/*      </div>*/}
      {/*      <h1 className="text-xl font-bold text-foreground">Data Platform</h1>*/}
      {/*    </div>*/}

      {/*    <Button variant="outline" asChild>*/}
      {/*      <Link to="/integrated-login">로그아웃</Link>*/}
      {/*    </Button>*/}
      {/*  </div>*/}
      {/*</header>*/}

      {/* Main */}
      <main className="mx-auto flex min-h-[calc(100vh-60px)] flex-col items-center justify-center px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-balance text-4xl font-bold text-foreground">
              데이터 관리 플랫폼
            </h2>
            <p className="text-pretty text-lg text-muted-foreground">
              원하시는 서비스를 선택해주세요
            </p>
          </div>

          {/* 3 Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Atlas */}
            <Link to="/atlas" className="group">
              <Card className="h-full border-border/50 transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <svg
                      className="h-6 w-6 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <CardTitle className="text-2xl">Atlas</CardTitle>
                  <CardDescription className="text-base">
                    데이터 시각화 및 분석 도구
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    지도 기반의 데이터 탐색과 분석을 제공합니다.
                  </p>
                </CardContent>
              </Card>
            </Link>

            {/* Canvas */}
            <Link to="/canvas" className="group">
              <Card className="h-full border-border/50 transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <svg
                      className="h-6 w-6 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 1 0 01-1 1h-4a1 1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 1 0 011 1v3a1 1 1 0 01-1 1H5a1 1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 1 0 011 1v3a1 1 1 0 01-1 1h-4a1 1 1 0 01-1-1v-3z"
                      />
                    </svg>
                  </div>
                  <CardTitle className="text-2xl">Canvas</CardTitle>
                  <CardDescription className="text-base">
                    대시보드 및 워크플로우 관리
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    자유로운 레이아웃으로 데이터를 구성하고 관리합니다.
                  </p>
                </CardContent>
              </Card>
            </Link>

            {/* Data Center */}
            <Link to="/datacenter" className="group">
              <Card className="h-full border-border/50 transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <svg
                      className="h-6 w-6 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                      />
                    </svg>
                  </div>
                  <CardTitle className="text-2xl">Data Center</CardTitle>
                  <CardDescription className="text-base">
                    데이터 저장소 및 관리 센터
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    모든 데이터를 중앙에서 안전하게 관리합니다.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
