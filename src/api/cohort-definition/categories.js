import axios from 'axios';

const API_BASE = import.meta.env.VITE_PUBLIC_API_URI;

// 카테고리 불러오는 API (is_active === 1인 컬럼만 포함하여 기존 categories 데이터의 형태로 반환)
export async function getCategories() {
  try {
    const response = await axios.get(`${API_BASE}/setting`, {
      headers: {
        Accept: 'application/json',
      },
    });

    const rawData = response.data;

    const formatted = Object.entries(rawData).map(([table, columns]) => ({
      table,
      columns: columns
        .filter((col) => col.is_active === 1)
        .map((col) => ({
          name: col.column_name,
          type: col.field_type,
        })),
    }));

    return formatted;
  } catch (error) {
    console.error('카테고리 데이터를 불러오는 데 실패했습니다:', error);
    return [];
  }
}
