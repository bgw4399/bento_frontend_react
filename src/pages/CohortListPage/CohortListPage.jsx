import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer.jsx';
import LoadingComponent from '../../components/LoadingComponent.jsx';
// Vite 환경 변수 사용법
const API_URI = import.meta.env.VITE_PUBLIC_API_URI;

export default function CohortListPage() {
  // 1. 상태(State) 관리
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [cohortList, setCohortList] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});

  const navigate = useNavigate();
  const ITEMS_PER_PAGE = 10;

  // 2. 파생 상태(Derived State) 관리
  const filteredData = useMemo(() => {
    if (!searchQuery) return cohortList;
    return cohortList.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.author.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [cohortList, searchQuery]);

  const totalPages = useMemo(() => Math.ceil(filteredData.length / ITEMS_PER_PAGE), [filteredData]);

  const paginatedData = useMemo(() => {
    return filteredData.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredData, currentPage]);

  const pageNumbers = useMemo(() => Array.from({ length: totalPages }, (_, i) => i + 1), [totalPages]);

  useEffect(() => {
    const fetchCohorts = async () => {
      setLoading(true);
      try {
        // const res = await fetch(`${API_URI}/api/cohort/`);
        const res = await fetch('/cohort-list-testdata.json');

        if (!res.ok) throw new Error('Failed to fetch data');
        const data = await res.json();
        setCohortList(data);
        // setCohorts(data);

      } catch (error) {
        setErrorMessage("An error occurred while fetching data.");
        setTimeout(() => setErrorMessage(""), 5000);
      } finally {
        setLoading(false);
      }
    };
    fetchCohorts();
  }, []);

  // 4. 함수 및 이벤트 핸들러
  const handleCheckboxChange = (id) => {
    setSelectedItems(prev => ({ ...prev, [id]: !prev[id] }));
    setErrorMessage("");
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handleComparison = () => {
    const selectedCount = Object.values(selectedItems).filter(Boolean).length;
    let newErrorMessage = "";
    if (selectedCount < 2) {
      newErrorMessage = "Please select at least 2 cohorts to compare.";
    } else if (selectedCount > 5) {
      newErrorMessage = "You can select up to 5 cohorts for comparison.";
    }

    if (newErrorMessage) {
      setErrorMessage(newErrorMessage);
      setTimeout(() => setErrorMessage(""), 5000);
      return;
    }

    const selectedIds = Object.entries(selectedItems)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id);

    navigate(`/cohort/comparison?cohorts=${selectedIds.join(',')}`);
  };

  const handleDelete = async () => {
    const selectedIds = Object.entries(selectedItems)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id);

    if (selectedIds.length === 0) return;

    if (!confirm(`Are you sure you want to delete the selected ${selectedIds.length} cohorts?`)) {
      return;
    }

    setLoading(true);
    let deleteError = false;
    for (const id of selectedIds) {
      try {
        await fetch(`${API_URI}/api/cohort/${id}`, { method: 'DELETE' });
      } catch (e) {
        deleteError = true;
      }
    }

    try {
      const res = await fetch(`${API_URI}/api/cohort/`);
      const data = await res.json();
      setCohortList(data.cohorts);
      setSelectedItems({});
    } catch (e) {
      setErrorMessage("Failed to refresh cohort list.");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setLoading(false);
    }

    if (deleteError) {
      setErrorMessage("Failed to delete some cohorts.");
      setTimeout(() => setErrorMessage(""), 5000);
    }
  };


  // 5. UI (JSX) 렌더링
  if (loading) {
    return <LoadingComponent message="Loading cohort data..." />;
    // return <div>Loading...</div>;
  }

  const selectedCount = Object.values(selectedItems).filter(Boolean).length;

  let compareButtonStyles = '';
  if (selectedCount > 5) {
    compareButtonStyles = 'border-red-600 bg-red-50 text-red-600 hover:bg-red-100';
  } else if (selectedCount >= 2) {
    compareButtonStyles = 'border-blue-600 bg-blue-50 text-blue-600 hover:bg-blue-100';
  } else {
    compareButtonStyles = 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50';
  }

  let iconStyles = '';
  if (selectedCount > 5) {
    iconStyles = 'bg-red-600 text-white';
  } else if (selectedCount >= 2) {
    iconStyles = 'bg-blue-600 text-white';
  } else {
    iconStyles = 'bg-blue-100 text-blue-400';
  }

  return (
    <>
      <title>Cohort List - Bento</title>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Cohort List</h1>
            <p className="text-gray-600">You can create and manage cohorts and access a cohort page by clicking its name. By selecting up to five cohorts and clicking the Compare button, you can simultaneously compare and analyze the selected cohorts.

            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex gap-3 mb-6 items-center">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={event => { if (event.key === 'Enter') handleSearch() }}
                  placeholder="Search cohorts by name, description, or author"
                  className="w-full pl-10 pr-24 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                <button
                  className="absolute right-0 top-0 h-full px-4 text-sm font-medium text-blue-600 hover:text-blue-800 border-l"
                  onClick={handleSearch}
                >
                  Search
                </button>
              </div>

              <button
                className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors border ${compareButtonStyles}`}
                onClick={handleComparison}
              >
                <span>Compare</span>
                <span className={`flex items-center justify-center rounded-full w-5 h-5 text-xs ${iconStyles}`}>
                  {selectedCount}
                </span>
              </button>

              <Link
                to="/cohort-definition"
                className="px-3 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50"
              >
                New Cohort
              </Link>

              <button
                aria-label="Delete Cohorts"
                onClick={handleDelete}
                disabled={selectedCount === 0}
                className={`inline-flex items-center justify-center p-2 text-sm font-medium rounded-md transition-colors border ${selectedCount > 0 ? 'bg-red-50 border-red-600 text-red-600 hover:bg-red-100' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>

            {/* 테이블과 페이지네이션 코드는 여기에 그대로 들어갑니다. */}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                {/* thead */}
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="w-[5%] py-3 px-4"><span className="sr-only">Select</span></th>
                    <th className="w-[5%] py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">No.</th>
                    <th className="w-[25%] py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Name</th>
                    <th className="w-[35%] py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Description</th>
                    <th className="w-[10%] py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Author</th>
                    <th className="w-[10%] py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Created</th>
                    <th className="w-[10%] py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Updated</th>
                  </tr>
                </thead>
                {/* tbody */}
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.map((item, index) => {
                    const isSelected = !!selectedItems[item.id];
                    const rowNumber = filteredData.length - ((currentPage - 1) * ITEMS_PER_PAGE + index);
                    return (
                      <tr key={item.cohort_id} className={`transition-colors cursor-pointer group ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`} onClick={() => handleCheckboxChange(item.id)}>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className={`w-4 h-4 border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-blue-600' : 'border-gray-300'}`}>
                              {isSelected && (<div className="w-2 h-2 bg-blue-600"></div>)}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500 text-center">{rowNumber}</td>
                        <td className="py-3 px-4">
                          <Link to={`/cohort/${item.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline" onClick={(e) => e.stopPropagation()}>
                            {item.name}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          <div className="line-clamp-2 whitespace-pre-line">{item.description}</div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">anonymous</td>
                        <td className="py-3 px-4 text-sm text-gray-500 text-center">{new Date(item.createdAt).toLocaleString()}</td>
                        <td className="py-3 px-4 text-sm text-gray-500 text-center">{new Date(item.updatedAt).toLocaleString()}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-6">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} aria-label="Previous page" className={`p-2 text-sm font-medium rounded-md transition-colors ${currentPage === 1 ? 'text-gray-400' : 'text-blue-600 hover:text-blue-800'}`}>‹</button>
                {pageNumbers.map(page => (<button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${currentPage === page ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-blue-100'}`}>{page}</button>))}
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} aria-label="Next page" className={`p-2 text-sm font-medium rounded-md transition-colors ${currentPage === totalPages ? 'text-gray-400' : 'text-blue-600 hover:text-blue-800'}`}>›</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-red-50 border border-red-200 rounded-md shadow-lg px-6 py-3 text-sm text-red-600 flex items-center">
            <span>{errorMessage}</span>
            <button className="ml-4 text-red-400 hover:text-red-600" onClick={() => setErrorMessage("")}>×</button>
          </div>
        </div>
      )}
    </>
  );
}