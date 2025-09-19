import React, { useCallback, useEffect, useMemo, useState } from 'react';
import CategoryNode from '../CategoryNode/index.jsx';
import { getCategories } from '../../../../../api/cohort-definition/categories.js';

export default function CategoryTree() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({});

  // category 불러오기
  useEffect(() => {
    const getData = async () => {
      const data = await getCategories();
      setCategories(data);

      const initExpanded = {};
      for (const cat of data) {
        initExpanded[cat.table] = false;
      }
      setExpanded(initExpanded);
    };

    getData();
  }, []);

  const toggle = useCallback((key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const isLeaf = useCallback((item) => !item.columns, []);

  const handleDragStart = useCallback((event, item, tableName = null) => {
    const dragData = {
      tableName: tableName || item.table || '알 수 없음',
      fieldName: item.name || item.table,
      fieldType: item.type || 'unknown',
    };
    event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    window.currentDragData = dragData;
  }, []);

  const filterTree = useCallback((tree, keyword) => {
    if (!keyword) return tree;
    const k = keyword.toLowerCase();
    return tree
      .map((cat) => {
        if (cat.table && cat.table.toLowerCase().includes(k)) return cat;
        if (cat.columns) {
          const filteredCols = cat.columns
            .map((col) => {
              if (col.name && col.name.toLowerCase().includes(k)) return col;
              if (col.columns) {
                const filteredSub = filterTree([col], k);
                if (filteredSub.length > 0)
                  return { ...col, columns: filteredSub[0].columns };
              }
              return null;
            })
            .filter(Boolean);
          if (filteredCols.length > 0) return { ...cat, columns: filteredCols };
        }
        return null;
      })
      .filter(Boolean);
  }, []);

  const highlight = useCallback((text, keyword) => {
    if (!keyword) return text;
    const idx = text.toLowerCase().indexOf(keyword.toLowerCase());
    if (idx === -1) return text;
    return [
      text.slice(0, idx),
      `<span class='text-blue-600 bg-blue-100 rounded'>${text.slice(
        idx,
        idx + keyword.length,
      )}</span>`,
      text.slice(idx + keyword.length),
    ].join('');
  }, []);

  const filteredCategories = useMemo(
    () => filterTree(categories, search),
    [categories, filterTree, search],
  );

  // 검색 중이면 자동 펼침 상태 구성
  const autoExpanded = useMemo(() => {
    if (!search) return {};
    const next = {};
    for (const cat of filteredCategories) {
      next[cat.table] = true;
      if (cat.columns) {
        for (const child of cat.columns) {
          if (child.columns) next[child.name] = true;
        }
      }
    }
    return next;
  }, [filteredCategories, search]);

  const isOpen = useCallback(
    (table) => (search ? !!autoExpanded[table] : !!expanded[table]),
    [search, autoExpanded, expanded],
  );

  return (
    <aside className="flex h-screen min-w-64 max-w-72 flex-col overflow-y-auto border-r border-gray-200 bg-white p-4 pb-12">
      <h2 className="mb-4 flex items-center gap-2 border-b border-gray-200 pb-2 text-xl font-semibold text-blue-700">
        테이블 및 컬럼
      </h2>

      <input
        type="text"
        className="mb-4 w-full border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="검색할 항목을 입력하세요."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <ul className="w-full list-none p-0 pb-8">
        {filteredCategories.map((cat) => (
          <li key={cat.table} className="mb-0 border-b border-gray-100">
            <button
              className="flex w-full items-center rounded-lg px-2 py-2 font-semibold text-gray-900 transition-colors hover:bg-blue-50"
              onClick={() => toggle(cat.table)}
              type="button"
            >
              {cat.columns && (
                <svg
                  className={`h-5 w-5 transform text-gray-400 transition-transform ${
                    isOpen(cat.table) ? 'rotate-90' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
              <span className="ml-2 flex-1 text-left text-[13px]">
                <span
                  dangerouslySetInnerHTML={{
                    __html: highlight(cat.table, search),
                  }}
                />
              </span>
            </button>

            {cat.columns && isOpen(cat.table) && (
              <ul className="ml-4 mt-1 border-l border-gray-100 pb-2 pl-2">
                {cat.columns.map((child, idx) => (
                  <CategoryNode
                    key={`${cat.table}-${idx}-${child.name || 'node'}`}
                    cat={child}
                    expanded={search ? autoExpanded : expanded}
                    toggle={toggle}
                    isLeaf={isLeaf}
                    handleDragStart={(e, item) =>
                      handleDragStart(e, item, cat.table)
                    }
                    depth={1}
                    search={search}
                    highlight={highlight}
                    tableName={cat.table}
                  />
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
