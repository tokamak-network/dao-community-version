'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'

export default function Header() {
  try {
    const pathname = usePathname()
    const { address, isConnected } = useAccount()
    const { connect, connectors, error: connectError, isPending } = useConnect()
    const { disconnect } = useDisconnect()
    const [showDropdown, setShowDropdown] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // 🎯 Hydration Error 방지 - 클라이언트 마운트 후에만 지갑 상태 표시
    useEffect(() => {
      setIsMounted(true)
    }, [])

    // 연결 에러 로깅 (ConnectorAlreadyConnectedError는 무시)
    useEffect(() => {
      if (connectError) {
        // ConnectorAlreadyConnectedError는 완전히 무시
        if (connectError.message?.includes('ConnectorAlreadyConnectedError') ||
            connectError.name?.includes('ConnectorAlreadyConnectedError')) {
          return
        }

        // 다른 실제 에러만 로깅
        console.error('Connect error:', connectError)
      }
    }, [connectError])

    // 현재 경로에 따라 활성 메뉴 스타일 결정
    const isActiveMenu = (path: string) => pathname === path

    const handleConnect = async () => {
      // 연결 시도 중이면 중복 실행 방지
      if (isPending) {
        // console.log('Connection already in progress...')
        return
      }

      // 이미 연결되어 있으면 그냥 성공으로 처리
      if (isConnected && address) {
        // console.log('Wallet already connected:', address)
        return
      }

      // MetaMask connector 찾기 (injected connector)
      const injectedConnector = connectors.find(connector => connector.type === 'injected')

      if (injectedConnector) {
        try {
          // console.log('Attempting to connect wallet...')
          await connect({ connector: injectedConnector })
          // console.log('Wallet connected successfully')
        } catch (error) {
          // ConnectorAlreadyConnectedError 처리 - 강제 재연결 시도
          if (error instanceof Error && error.message.includes('ConnectorAlreadyConnectedError')) {
            // console.log('Connector already connected - attempting to reconnect...')

            try {
              // 먼저 연결 해제 시도
              // console.log('Disconnecting first to clear state...')
              disconnect()

              // 잠시 대기 후 재연결 시도
              setTimeout(async () => {
                try {
                  // console.log('Reconnecting after cleanup...')
                  await connect({ connector: injectedConnector })
                  // console.log('Reconnection successful')
                } catch (reconnectError) {
                  console.error('Reconnection failed:', reconnectError)
                  alert(`재연결에 실패했습니다. 메타마스크에서 연결을 해제한 후 다시 시도해주세요.\n\n에러: ${reconnectError instanceof Error ? reconnectError.message : 'Unknown error'}`)
                }
              }, 500)

            } catch (disconnectError) {
              console.error('Disconnect during reconnect failed:', disconnectError)
              alert('연결 상태를 정리하는데 실패했습니다. 메타마스크에서 직접 연결을 해제한 후 다시 시도해주세요.')
            }
            return
          }

          // 실제 연결 실패의 경우에만 에러 로깅 및 알림
          console.error('Actual connection failed:', error)
          if (error instanceof Error) {
            alert(`Connection failed: ${error.message}`)
          }
        }
      } else {
        console.error('No injected connector found - please install MetaMask or another Web3 wallet')
        alert('No Web3 wallet detected. Please install MetaMask or another compatible wallet.')
      }
    }

    const handleDisconnect = () => {
      disconnect()
      setShowDropdown(false)
    }

    const toggleDropdown = () => {
      setShowDropdown(!showDropdown)
    }

    // 외부 클릭시 드롭다운 닫기
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setShowDropdown(false)
        }
      }

      if (showDropdown) {
        document.addEventListener('mousedown', handleClickOutside)
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [showDropdown])

    // 주소 표시용 단축 함수
    const formatAddress = (addr: string) => {
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`
    }

    return (
      <header className="flex h-[73px] px-[30px] py-[19px] justify-between items-center self-stretch bg-[rgba(250,251,252,0.50)]">
        {/* Logo - Left */}
        <Link href="/" className="flex items-center">
          <div className="self-stretch h-20 px-7 py-5 bg-gray-50/50 inline-flex justify-between items-center">
            <div className="flex justify-center items-center gap-1.5">
              <div className="justify-start"><span className="text-black text-2xl font-extrabold font-['NanumSquare']">Tokamak </span><span className="text-blue-600 text-2xl font-extrabold font-['NanumSquare']">DAO</span></div>
              <div className="justify-start text-black text-xs font-extrabold font-['NanumSquare'] leading-3">Community<br/>Version</div>
            </div>
          </div>
        </Link>

        {/* Navigation - Center */}
        <nav className="flex items-center space-x-8">
          <Link
            href="/dao-committee"
            className={`text-center justify-start text-base font-semibold font-['Inter'] ${
              pathname === '/dao-committee' ? 'text-blue-600' : 'text-gray-700'
            }`}
          >
            DAO Candidates
          </Link>
          <Link
            href="/agenda"
            className={`text-center justify-start text-base font-semibold font-['Inter'] ${
              pathname.startsWith('/agenda') ? 'text-blue-600' : 'text-gray-700'
            }`}
          >
            Agenda
          </Link>
        </nav>

        {/* Wallet - Right - Hydration Safe */}
        {!isMounted || isPending ? (
          // 마운트 중이거나 연결 중일 때 로딩 표시
          <div className="w-32 h-10 bg-gray-100 rounded-md animate-pulse flex items-center justify-center">
            <span className="text-xs text-gray-500">Loading...</span>
          </div>
        ) : isConnected && address ? (
          <div className="relative" ref={dropdownRef}>
            <div
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded-md px-2 py-1 transition-colors"
              onClick={toggleDropdown}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-white">0x</span>
              </div>
              <span className="text-sm text-gray-700 font-mono">{formatAddress(address)}</span>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                <div className="py-1">
                  <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                    Wallet
                  </div>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(address || '')
                      setShowDropdown(false)
                    }}
                  >
                    Copy Address
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    onClick={handleDisconnect}
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
            onClick={handleConnect}
          >
            Connect Wallet
          </button>
        )}
      </header>
    )
  } catch (error) {
    console.error('❌ Header: Component failed to render due to an error:', error)
    return (
      <header className="flex h-[73px] px-[30px] py-[19px] justify-between items-center self-stretch bg-[rgba(250,251,252,0.50)]">
        <div className="self-stretch h-20 px-7 py-5 bg-gray-50/50 inline-flex justify-between items-center">
          <div className="flex justify-center items-center gap-1.5">
            <div className="justify-start"><span className="text-black text-2xl font-extrabold font-['NanumSquare']">Tokamak </span><span className="text-blue-600 text-2xl font-extrabold font-['NanumSquare']">DAO</span></div>
            <div className="justify-start text-black text-xs font-extrabold font-['NanumSquare'] leading-3">Community<br/>Version</div>
          </div>
        </div>
        <div className="flex items-center space-x-8">
          <Link href="/" className="text-center justify-start text-base font-semibold font-['Inter'] text-gray-700">Home</Link>
          <Link href="/dao-committee" className="text-center justify-start text-base font-semibold font-['Inter'] text-gray-700">DAO Candidates</Link>
          <Link href="/agenda" className="text-center justify-start text-base font-semibold font-['Inter'] text-gray-700">Agenda</Link>
        </div>
        <button
          className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
          onClick={() => alert('Header component failed to load. Please check console for details.')}
        >
          Connect Wallet
        </button>
      </header>
    )
  }
}