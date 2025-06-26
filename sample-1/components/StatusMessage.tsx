"use client";

import { useDAOContext } from '@/contexts/DAOContext';
import { usePathname } from 'next/navigation';

export default function StatusMessage() {
  const pathname = usePathname();
  const {
    statusMessage,
    isLoadingMembers,
    // isLoadingAgendas,  // 현재 사용하지 않음
    // isLoadingOwner,    // 현재 사용하지 않음
    // isLoadingTonBalance // 현재 사용하지 않음
  } = useDAOContext();

  const isLoading = isLoadingMembers;

  // 아젠다 관련 페이지와 메인페이지에서는 DAO 상태 메시지를 숨김
  if (pathname.startsWith('/agenda') || pathname === '/') return null;

  if (!statusMessage || !isLoading) return null;

  // 진행률 파싱 (예: "Loading... 3/10 (30%)" -> "30")
  const progressMatch = statusMessage.match(/\((\d+)%\)/);
  const progress = progressMatch ? parseInt(progressMatch[1]) : 0;

  // 메시지에서 진행률 제거
  const message = statusMessage.replace(/\(\d+%\)/, "").trim();

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-blue-50/95 backdrop-blur-sm rounded-lg shadow-lg border border-blue-200 w-96 p-4">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700 font-medium tracking-wide">
              {message}
            </span>
            {progressMatch && (
              <span className="text-sm text-blue-600 font-semibold">
                {progress}%
              </span>
            )}
          </div>

          {progressMatch && (
            <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}