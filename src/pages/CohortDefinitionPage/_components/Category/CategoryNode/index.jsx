import React from "react";

export default function CategoryNode({
                                         cat,
                                         expanded = {},
                                         toggle = () => {},
                                         isLeaf = (n) => !n?.columns,
                                         handleDragStart = () => {},
                                         depth = 1,
                                         search = "",
                                         highlight = (text) => text,
                                         tableName = null,
                                     }) {
    const isBranch = !!cat?.columns;
    const isOpen = !!expanded[cat?.name];

    const buttonStyle = {
        paddingLeft: `${depth * 12}px`,
        fontSize: depth === 1 ? "1rem" : "0.97rem",
        fontWeight: depth === 1 ? 500 : 400,
    };

    const leafStyle = {
        paddingLeft: `${depth * 12}px`,
        fontSize: "0.75rem",
    };

    if (isBranch) {
        return (
            <li className="mb-1 select-none">
                <button
                    className="flex items-center w-full px-2 py-1 rounded text-gray-800 hover:bg-blue-50 transition-colors font-medium"
                    style={buttonStyle}
                    onClick={() => toggle(cat.name)}
                    type="button"
                >
                    <svg
                        className={`w-4 h-4 text-gray-400 transform transition-transform ${
                            isOpen ? "rotate-90" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                    <span className="flex-1 ml-2 text-left">
            <span
                dangerouslySetInnerHTML={{ __html: highlight(cat.name, search) }}
            />
          </span>
                </button>

                {isOpen && (
                    <ul className="ml-2 mt-1 border-l border-gray-100 pl-2 pb-2">
                        {cat.columns.map((child, idx) => (
                            <CategoryNode
                                key={`${cat.name}-${idx}-${child.name || "node"}`}
                                cat={child}
                                expanded={expanded}
                                toggle={toggle}
                                isLeaf={isLeaf}
                                handleDragStart={handleDragStart}
                                depth={depth + 1}
                                search={search}
                                highlight={highlight}
                                tableName={tableName}
                            />
                        ))}
                    </ul>
                )}
            </li>
        );
    }

    // leaf
    return (
        <li className="mb-1 select-none">
            <div className="flex items-center w-full">
        <span
            draggable
            onDragStart={(e) => handleDragStart(e, cat, tableName)}
            className="block w-full px-2 py-1 rounded text-gray-700 hover:bg-blue-100 transition-colors text-sm cursor-grab group"
            style={leafStyle}
            role="button"
            tabIndex={0}
        >
          <div className="flex items-center justify-between w-full">
            {/* 컬럼명 */}
              <span className="flex-1 text-left">
              <span
                  dangerouslySetInnerHTML={{ __html: highlight(cat.name, search) }}
              />
            </span>

              {/* 컬럼타입 아이콘 */}
              {cat.type && (
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      {cat.type === "Select" ? (
                          <svg
                              className="w-3 h-3 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                          >
                              <title>{cat.type}</title>
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
                              <path d="M9 12l2 2 4-4" strokeWidth="2" />
                          </svg>
                      ) : cat.type === "Date" || cat.type === "Datetime" ? (
                          <svg
                              className="w-3 h-3 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                          >
                              <title>{cat.type}</title>
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
                              <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" />
                              <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" />
                              <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" />
                          </svg>
                      ) : cat.type === "Upload" ? (
                          <svg
                              className="w-3 h-3 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                          >
                              <title>{cat.type}</title>
                              <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                              <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M12 8v4m0 0l-2-2m2 2l2-2"
                              />
                          </svg>
                      ) : cat.type === "Lookup" ? (
                          <svg
                              className="w-3 h-3 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                          >
                              <title>{cat.type}</title>
                              <rect x="3" y="3" width="18" height="18" strokeWidth="2" />
                              <line x1="3" y1="9" x2="21" y2="9" strokeWidth="2" />
                              <line x1="9" y1="3" x2="9" y2="21" strokeWidth="2" />
                              <line x1="15" y1="3" x2="15" y2="21" strokeWidth="2" />
                          </svg>
                      ) : cat.type.includes("Range") ? (
                          <svg
                              className="w-3 h-3 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                          >
                              <title>{cat.type}</title>
                              <line x1="3" y1="12" x2="21" y2="12" strokeWidth="2" />
                              <circle cx="6" cy="12" r="2" fill="currentColor" />
                              <circle cx="18" cy="12" r="2" fill="currentColor" />
                              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                          </svg>
                      ) : cat.type === "Y/N" ? (
                          <span
                              className="w-3.5 h-3.5 flex items-center justify-center text-[5.5px] font-bold text-gray-400 border border-gray-400 rounded"
                              title="Y/N"
                          >
                    Y/N
                  </span>
                      ) : null}
                  </div>
              )}
          </div>
        </span>
            </div>
        </li>
    );
}
