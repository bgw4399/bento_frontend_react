import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);

  let menuCloseTimer = null;

  const handleMouseEnter = (menu) => {
    clearTimeout(menuCloseTimer); // 닫기 타이머 취소
    setIsMenuOpen(true);
    setActiveMenu(menu);
  };

  const handleMouseLeave = () => {
    menuCloseTimer = setTimeout(() => {
      setIsMenuOpen(false);
      setActiveMenu(null);
    }, 300);
  };

  return (
    <div className="min-h-screen overflow-x-auto">
      <header
        className="fixed left-0 top-0 z-50 w-full"
        onMouseLeave={handleMouseLeave} // 헤더 영역을 떠나면 메뉴가 닫히도록 설정
      >
        <div className="absolute inset-0 border-b border-slate-300/80 bg-white/90 backdrop-blur-sm"></div>

        <div className="relative mx-auto max-w-[1280px] px-8">
          <div className="flex h-[60px]">
            {/* 로고 영역: <a> -> <Link> */}
            <Link
              to="/"
              className="flex h-[60px] w-[200px] items-center justify-center gap-2"
            >
              {/* 로고 SVG */}
              <svg
                className="h-7 w-7 text-blue-600"
                viewBox="150 130 250 330"
                fill="none"
              >
                <path
                  fill="#2463eb"
                  d="M269.21,189.19h-10.93c-1.39,0-2.52,1.13-2.52,2.52v14.68h-14.68c-1.39,0-2.52,1.13-2.52,2.52v10.93c0,1.39,1.13,2.52,2.52,2.52h14.68v13.45c0,1.39,1.13,2.52,2.52,2.52h10.93c1.39,0,2.52-1.13,2.52-2.52v-13.45h14.68c1.39,0,2.52-1.13,2.52-2.52v-10.93c0-1.39-1.13-2.52-2.52-2.52h-14.68v-14.68c0-1.39-1.13-2.52-2.52-2.52Z"
                />
                <path
                  fill="#155dfc"
                  d="M301.84,137.49c-65.8,0-119.55,52.12-119.81,116.18l12.29,.05c.24-57.32,48.47-103.95,107.52-103.95,9.11,0,17.96,1.11,26.42,3.19v109.95h-37.09c-4.22,0-8.27,1.56-11.41,4.38l-18.25,16.43-18.25-16.43c-3.14-2.82-7.19-4.38-11.41-4.38h-35.17c-1.7-2.93-4.87-4.92-8.5-4.92-5.42,0-9.83,4.41-9.83,9.83s4.41,9.83,9.83,9.83c3.63,0,6.8-1.98,8.5-4.92h35.18c1.79,0,3.5,.66,4.83,1.86l24.83,22.35,24.83-22.35c1.33-1.2,3.04-1.85,4.83-1.85h118.2v53.05c0,25.17-9.23,48.3-24.58,66.34v-27.23c0-2.71-2.2-4.92-4.92-4.92s-4.92,2.2-4.92,4.92v37.34c-1.6,1.44-3.23,2.84-4.92,4.18v-53.81c0-2.71-2.2-4.92-4.92-4.92s-4.92,2.2-4.92,4.92v60.79c-2,1.26-4.05,2.46-6.14,3.59v-82.81c0-2.71-2.2-4.92-4.92-4.92s-4.92,2.2-4.92,4.92v87.52c-1.62,.68-3.26,1.32-4.92,1.92v-109.1c0-2.71-2.2-4.92-4.92-4.92s-4.92,2.2-4.92,4.92v112.14c-8.83,2.28-18.09,3.5-27.65,3.5-42.35,0-79.05-23.89-96.57-58.51,13.95-.03,27.63,1.41,40.73,4.28,15.92,3.49,27.19,8.22,37.13,12.39,11.07,4.64,21.74,10,31.71,15.94,1.01,.6,2.15,.9,3.3,.9s2.2-.28,3.19-.84c2-1.14,3.24-3.27,3.24-5.57v-69.49c0-2.71-2.2-4.92-4.92-4.92s-4.92,2.2-4.92,4.92v63.58c-8.86-4.99-18.19-9.55-27.81-13.58-9.81-4.12-22.03-9.24-38.82-12.92-15.15-3.32-31-4.8-47.16-4.44-4.29-11.26-6.64-23.42-6.64-36.11v-44.45h-12.29v44.45c0,64.33,53.75,116.66,119.81,116.66s119.81-52.33,119.81-116.66v-71.65c0-64.33-53.75-116.66-119.81-116.66ZM340.55,262.92v-106.14c40.22,15.12,68.82,53.06,68.82,97.37v8.77h-68.82Z"
                />
              </svg>
              <p className="text-xl font-bold">
                <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  Bento
                </span>
              </p>
            </Link>

            {/* 메인 네비게이션 */}
            <nav className="flex flex-1" aria-label="Main navigation">
              <div className="flex">
                {/* 각 메뉴 아이템: on:event -> onEvent */}
                <Link
                  to="/cohort"
                  onMouseEnter={() => handleMouseEnter('cohorts')}
                  className={`flex h-[60px] w-[160px] items-center px-6 text-[15px] transition-all duration-200 hover:font-semibold hover:text-slate-900 ${activeMenu === 'cohorts' ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}
                >
                  Cohorts
                </Link>
                <Link
                  to="/person"
                  onMouseEnter={() => handleMouseEnter('person')}
                  className={`flex h-[60px] w-[200px] items-center px-6 text-[15px] transition-all duration-200 hover:font-semibold hover:text-slate-900 ${activeMenu === 'person' ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}
                >
                  Person
                </Link>
                <Link
                  to="/custom-chart"
                  onMouseEnter={() => handleMouseEnter('custom')}
                  className={`flex h-[60px] w-[200px] items-center px-6 text-[15px] transition-all duration-200 hover:font-semibold hover:text-slate-900 ${activeMenu === 'custom' ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}
                >
                  Custom Chart
                </Link>
                <Link
                  to="/guide"
                  onMouseEnter={() => handleMouseEnter('about')}
                  className={`flex h-[60px] w-[200px] items-center px-6 text-[15px] transition-all duration-200 hover:font-semibold hover:text-slate-900 ${activeMenu === 'about' ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}
                >
                  About
                </Link>
              </div>
              <div className="flex w-full justify-end">
                <Link
                  to="/login"
                  className="flex h-[60px] items-center px-6 text-[15px] transition-all duration-200 hover:font-semibold hover:text-slate-900"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="flex h-[60px] items-center px-6 text-[15px] transition-all duration-200 hover:font-semibold hover:text-slate-900"
                >
                  Register
                </Link>
              </div>
            </nav>
          </div>
        </div>

        {/* 드롭다운 패널: {#if ...} -> {isMenuOpen && ...} */}
        {isMenuOpen && (
          <div
            className="absolute left-0 right-0 w-full border-b border-slate-300/80 bg-white/95 shadow-sm backdrop-blur-sm"
            style={{ top: '60px' }}
            onMouseEnter={() => clearTimeout(menuCloseTimer)} // 패널에 마우스가 들어가면 닫기 타이머 취소
            onMouseLeave={handleMouseLeave} // 패널에서 마우스를 떼면 닫기
          >
            <div className="mx-auto max-w-[1280px] px-8">
              {/* 드롭다운 메뉴 내용 */}
              <div className="flex">
                <div className="w-[200px]"></div>
                <div className="flex">
                  <div className="w-[160px] border-r py-4">
                    <ul className="space-y-3">
                      <li onMouseEnter={() => setActiveMenu('cohorts')}>
                        <Link
                          to="/cohort"
                          className="block px-6 text-sm text-slate-600 hover:text-blue-600"
                        >
                          Cohort List
                        </Link>
                      </li>
                      <li onMouseEnter={() => setActiveMenu('cohorts')}>
                        <Link
                          to="/cohort-definition"
                          className="block px-6 text-sm text-slate-600 hover:text-blue-600"
                        >
                          Cohort Definition
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <div className="w-[200px] border-r py-4">
                    <ul className="space-y-3">
                      <li onMouseEnter={() => setActiveMenu('person')}>
                        <Link
                          to="/person"
                          className="block px-6 text-sm text-slate-600 hover:text-blue-600"
                        >
                          Person Search
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <div className="w-[200px] border-r py-4">
                    <ul className="space-y-3">
                      <li onMouseEnter={() => setActiveMenu('custom')}>
                        <Link
                          to="/custom-chart"
                          className="block px-6 text-sm text-slate-600 hover:text-blue-600"
                        >
                          Chart Set List
                        </Link>
                      </li>
                      <li onMouseEnter={() => setActiveMenu('custom')}>
                        <Link
                          to="/custom-chart/new"
                          className="block px-6 text-sm text-slate-600 hover:text-blue-600"
                        >
                          Chart Definition
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <div className="w-[200px] border-r py-4">
                    <ul className="space-y-3">
                      <li onMouseEnter={() => setActiveMenu('about')}>
                        <Link
                          to="/guide"
                          className="block px-6 text-sm text-slate-600 hover:text-blue-600"
                        >
                          Guide
                        </Link>
                      </li>
                      <li onMouseEnter={() => setActiveMenu('about')}>
                        <a
                          href="https://kookmin-sw.github.io/capstone-2025-16/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block px-6 text-sm text-slate-600 hover:text-blue-600"
                        >
                          About Us
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Svelte의 {@render children()} -> React Router의 <Outlet /> */}
      <main className="pt-[60px]">
        <Outlet />
      </main>
    </div>
  );
}
