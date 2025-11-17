// 기본 카테고리 목록
export const DEFAULT_CATEGORIES = [
  '텐트/타프',
  '침구류',
  '취사도구',
  '조명',
  '화로/난방',
  '테이블/의자',
  '수납/정리',
  '의류',
  '위생용품',
  '안전/응급',
  '놀이/레저',
  '전자기기',
  '기타',
] as const;

// 상태별 색상
export const STATUS_COLORS = {
  green: '#4caf50',
  yellow: '#ff9800',
  red: '#f44336',
} as const;

// 상태별 한글 이름
export const STATUS_LABELS = {
  green: '정상',
  yellow: '교체 필요',
  red: '구매 필요',
} as const;
