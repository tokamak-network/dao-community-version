'use client'
import { useMemo, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import PageHeader from '@/components/ui/PageHeader'
import { useCombinedDAOContext } from '@/contexts/CombinedDAOContext'
import { formatAddress, calculateAgendaStatus, getStatusText, getStatusClass, getStatusMessage, getAgendaTimeInfo, AgendaStatus, getNetworkName, getAgendaMetadataRepoFolderUrl } from '@/lib/utils'
import { chain } from '@/config/chain'
// AgendaPagination 클래스 제거됨 - Context에서 직접 페이지네이션 관리

export default function AgendaList() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const focusAgendaId = searchParams?.get('focus')
  const [highlightedAgendaId, setHighlightedAgendaId] = useState<string | null>(null)
  const { isConnected } = useAccount();
  const {
    error,
    refreshAgendas,
    statusMessage,
    quorum,
    paginationState,
    paginationStatus,
    loadNextPage,
    hasMore,
    getRemainingCount
  } = useCombinedDAOContext();
  const chainId = chain.id;

  // 현재 페이지에 보여줄 아젠다 목록
  const displayAgendas = paginationState?.agendas || [];
  const isLoading = paginationState?.isLoading;
  const hasMoreAgendas = hasMore ? hasMore() : false;
  const remainingAgendas = getRemainingCount ? getRemainingCount() : 0;

  // // 더보기 버튼 디버깅
  // console.log('🔍 [AgendaList] Load More Button Debug:', {
  //   isLoading,
  //   hasMoreAgendas,
  //   remainingAgendas,
  //   displayAgendasCount: displayAgendas.length,
  //   hasMoreFunction: !!hasMore,
  //   getRemainingCountFunction: !!getRemainingCount,
  //   paginationState: paginationState ? {
  //     totalCount: paginationState.totalCount,
  //     currentPage: paginationState.currentPage,
  //     agendaCount: paginationState.agendas?.length
  //   } : null
  // });

  // // 디버깅: 아젠다 목록 변경 감지
  // useEffect(() => {
  //   console.log('📋 Agenda list updated:', {
  //     totalAgendas: displayAgendas.length,
  //     agendaIds: displayAgendas.map((a: any) => a.id),
  //     paginationState: paginationState ? {
  //       totalLoaded: paginationState.agendas?.length,
  //       isLoading: paginationState.isLoading,
  //       hasMore: hasMoreAgendas,
  //       remaining: remainingAgendas
  //     } : null
  //   });
  // }, [displayAgendas.length, paginationState?.agendas?.length]);

    // 포커스된 아젠다로 스크롤
  useEffect(() => {
    if (focusAgendaId && displayAgendas.length > 0) {
      const targetElement = document.getElementById(`agenda-${focusAgendaId}`);
      if (targetElement) {
        // 하이라이트 설정
        setHighlightedAgendaId(focusAgendaId);

        setTimeout(() => {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });

          // 3초 후 하이라이트만 제거 (URL은 그대로 유지)
          setTimeout(() => {
            setHighlightedAgendaId(null);
          }, 3000);
        }, 100);
      }
    }
  }, [focusAgendaId, displayAgendas.length]);

  // "View more" 버튼 클릭 시 다음 페이지 로드
  const handleLoadMore = () => {
    // 더보기 시 focus 파라미터 제거 (새로 로드된 아젠다로 스크롤 방지)
    if (focusAgendaId) {
      const url = new URL(window.location.href);
      url.searchParams.delete('focus');
      window.history.replaceState({}, '', url.toString());
      setHighlightedAgendaId(null);
    }

    if (loadNextPage) loadNextPage();
  };

  // // 디버깅: 실제 렌더링되는 아젠다 개수 및 상태 확인
  // console.log('displayAgendas.length', displayAgendas.length, displayAgendas.map((a: any) => a.id));
  // console.log('paginationState', paginationState);
  // console.log('paginationStatus', paginationStatus);
  // console.log('error', error, 'statusMessage', statusMessage, 'quorum', quorum);

  const handleNewProposalClick = () => {
    router.push('/agendas/new');
  };

  // Memoized agenda formatting for performance
  const displayAgendasMemo = useMemo(() => {
    return displayAgendas.map((agenda: any) => {
      const currentStatus = calculateAgendaStatus(agenda, quorum ?? BigInt(2));
      const statusMessage = getStatusMessage(agenda, currentStatus, quorum ?? BigInt(2));

      return {
        id: agenda.id,
        title: agenda.title && agenda.title.trim() !== '' ? agenda.title : `Agenda #${agenda.id}`,
        author: agenda.creator?.address ? formatAddress(agenda.creator.address) : 'Unknown',
        date: agenda.createdTimestamp ? new Date(Number(agenda.createdTimestamp) * 1000).toLocaleDateString() : 'Unknown',
        status: getStatusText(currentStatus),
        statusClass: getStatusClass(currentStatus),
        statusMessage: statusMessage,
        currentStatus: currentStatus,
        votesFor: Number(agenda.countingYes || 0),
        votesAgainst: Number(agenda.countingNo || 0),
        isApproved: Number(agenda.countingYes) > Number(agenda.countingNo)
      };
    });
  }, [displayAgendas, quorum]);

  // Show error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex flex-col items-center gap-4">
          <p className="text-red-600">{error}</p>
          <button
            onClick={refreshAgendas}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Show loading state only when no agendas are loaded yet
  if (isLoading && displayAgendas.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-600">{statusMessage || "Loading agendas..."}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-normal text-zinc-900 font-['Inter']">Agenda</h1>
          <button
            className="text-gray-600 text-sm hover:text-gray-700 underline border border-gray-200 rounded px-3 py-1 font-semibold bg-white"
            style={{ boxShadow: '0 0 0 1px #e5e7eb' }}
            onClick={() => {
              const url = getAgendaMetadataRepoFolderUrl(chain.network);
              window.open(url, '_blank');
            }}
          >
            Go to metadata repository
          </button>
        </div>

        <button
          onClick={handleNewProposalClick}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          + New proposal
        </button>
      </div>

      {/* Agenda List */}
      <div className="flex flex-col gap-4">
        {displayAgendas.length === 0 && !isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No agendas available</p>
            <p className="text-gray-400 text-sm mt-2">Check back later for new proposals</p>
          </div>
        ) : (
          displayAgendasMemo.map((agenda: any) => (
                    <div
            key={agenda.id}
            id={`agenda-${agenda.id}`}
            className={`bg-white border border-gray-200 rounded-lg p-6 transition-all duration-300 ${
              highlightedAgendaId === agenda.id.toString() ? 'ring-2 ring-blue-500 shadow-lg' : ''
            }`}
          >

            {/* Member Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-900 text-xs font-normal font-['Inter']">Agenda </span>
                  <span className="text-slate-700 text-xs font-normal font-['Inter']">{agenda.id}</span>
                </div>
                <div className="self-stretch justify-start text-slate-700 text-xl font-semibold font-['Inter']">{agenda.title}</div>
                <div className="self-stretch justify-start text-gray-600 text-sm font-normal font-['Inter']">This agenda was made by {agenda.author} on {agenda.date}</div>
              </div>
            </div>

            {/* Status with time information */}
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12,6 12,12 16,14"></polyline>
              </svg>
              <span className="text-gray-600 text-[10px] font-normal font-['Inter']">
                {agenda.statusMessage}
              </span>
            </div>

            {/* Buttons at bottom */}
            <div className="flex justify-between items-center">
              <Link
                href={`/agenda/${agenda.id}`}
                data-size="Small"
                data-state="Default"
                data-type="Primary"
                className="w-32 px-4 py-1 rounded-md inline-flex justify-center items-center gap-1.5 cursor-pointer border"
                style={{
                  backgroundColor: '#2A72E5',
                  borderColor: '#2A72E5'
                }}
              >
                <div
                  className="text-center justify-start text-sm font-semibold font-['Proxima_Nova'] leading-loose"
                  style={{color: '#FFFFFF'}}
                >
                  View Details
                </div>
              </Link>
            </div>
          </div>
        ))
        )}
      </div>

      {/* Loading indicator at the bottom when loading */}
      {isLoading && (
        <div className="flex justify-center items-center mt-8 gap-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 text-sm">{statusMessage || "Loading..."}</p>
        </div>
      )}

      {/* Load More Button */}
      {(() => {
        const shouldShowButton = !isLoading && hasMoreAgendas;
        // console.log('🔍 [AgendaList] Load More Button Render Check:', {
        //   isLoading,
        //   hasMoreAgendas,
        //   shouldShowButton,
        //   condition: `!${isLoading} && ${hasMoreAgendas} = ${shouldShowButton}`
        // });

        return shouldShowButton && (
          <div className="flex justify-center mt-8">
            <button
              onClick={handleLoadMore}
              className="text-gray-500 text-sm hover:text-gray-700 transition-colors"
            >
              View more agenda ({remainingAgendas})
            </button>
          </div>
        );
      })()}
    </div>
  )
}