"use client";

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useDAOContext } from '@/contexts/DAOContext';
import { CommitteeMember, Candidate } from '@/types/dao';

interface CheckChallengeButtonProps {
  targetMember: CommitteeMember;
  className?: string;
}

export function CheckChallengeButton({ targetMember, className = "" }: CheckChallengeButtonProps) {
  const { address } = useAccount();
    const {
    committeeMembers,
    layer2Candidates,
    loadLayer2Candidates,
    isLoadingLayer2,
    layer2Total,
    layer2LoadingIndex,
    hasLoadedLayer2Once
  } = useDAOContext();

  const [challengeCandidates, setChallengeCandidates] = useState<Candidate[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleCheckChallenge = async () => {
    if (!address) {
      setError('지갑을 먼저 연결해주세요');
      return;
    }

    console.log('🎯 Check Challenge 버튼 클릭:', targetMember.name);
    setIsChecking(true);
    setError(null);
    setShowResults(false);

        try {
      // 캐시에 데이터가 없으면 먼저 로드
      if (!hasLoadedLayer2Once || layer2Candidates.length === 0) {
        console.log('📦 캐시 데이터 없음, Layer2 정보 로드 시작...');
        await loadLayer2Candidates();
      }

      // 직접 필터링 로직 (getChallengeCandidates 함수 대신)
      const targetStaking = BigInt(targetMember.totalStaked);
      const challengeCandidates = layer2Candidates.filter(candidate => {
        // 1. 타겟 멤버보다 스테이킹이 높은가?
        const candidateStaking = BigInt(candidate.totalStaked);
        if (candidateStaking <= targetStaking) {
          return false;
        }

        // 2. 이미 위원회 멤버인가?
        const isAlreadyMember = committeeMembers?.some(
          member => member.candidateContract.toLowerCase() === candidate.candidateContract.toLowerCase()
        );
        if (isAlreadyMember) {
          console.log(`⏭️ 스킵: ${candidate.name} - 이미 위원회 멤버`);
          return false;
        }

        return true;
      });

      // description 업데이트 (타겟과의 비교 정보 추가)
      const enhancedCandidates = challengeCandidates.map(candidate => ({
        ...candidate,
        description: `Staking: ${(Number(candidate.totalStaked) / 1e18).toFixed(2)} TON (Higher than target: ${(Number(targetStaking) / 1e18).toFixed(2)} TON)`,
        isCommitteeMember: false
      }));

      setChallengeCandidates(enhancedCandidates);
      setShowResults(true);

      console.log(`✅ 도전 가능한 후보자 ${enhancedCandidates.length}명 조회 완료`);

    } catch (err) {
      console.error('❌ Challenge 체크 실패:', err);
      setError('도전 후보자 조회에 실패했습니다');
    } finally {
      setIsChecking(false);
    }
  };

  const closeResults = () => {
    setShowResults(false);
    setChallengeCandidates([]);
  };

  // Layer2 로딩 중일 때 버튼 상태
  const isDisabled = isChecking || isLoadingLayer2;
  const buttonText = isLoadingLayer2
    ? `Loading Layer2... (${layer2LoadingIndex}/${layer2Total})`
    : isChecking
    ? 'Checking...'
    : 'Check Challenge';

  return (
    <div className={`check-challenge-container ${className}`}>
      {/* Check Challenge 버튼 */}
      <button
        onClick={handleCheckChallenge}
        disabled={isDisabled}
        className={`check-challenge-btn ${isDisabled ? 'disabled' : ''}`}
      >
        {buttonText}
      </button>

      {/* Layer2 로딩 진행률 */}
      {isLoadingLayer2 && (
        <div className="layer2-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${layer2Total > 0 ? (layer2LoadingIndex / layer2Total) * 100 : 0}%` }}
            />
          </div>
          <small>Caching Layer2 data for challenges...</small>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {/* 도전 결과 모달/섹션 */}
      {showResults && (
        <div className="challenge-results">
          <div className="results-header">
            <h3>🎯 Challenge Results for {targetMember.name}</h3>
            <button onClick={closeResults} className="close-btn">✕</button>
          </div>

          <div className="target-info">
            <p><strong>Target:</strong> {targetMember.name}</p>
            <p><strong>Target Staking:</strong> {(Number(targetMember.totalStaked) / 1e18).toFixed(2)} TON</p>
          </div>

          {challengeCandidates.length > 0 ? (
            <div className="candidates-list">
              <h4>💪 도전 가능한 Layer2 ({challengeCandidates.length}개)</h4>
              {challengeCandidates.map((candidate, index) => (
                <div key={candidate.candidateContract} className="candidate-item">
                  <div className="candidate-info">
                    <div className="candidate-header">
                      <span className="rank">#{index + 1}</span>
                      <strong>{candidate.name}</strong>
                    </div>
                    <div className="candidate-details">
                      <p>💰 <strong>Staking:</strong> {(Number(candidate.totalStaked) / 1e18).toFixed(2)} TON</p>
                      <p>🏠 <strong>Contract:</strong> {candidate.candidateContract}</p>
                      <p>👤 <strong>EOA:</strong> {candidate.creationAddress}</p>
                      {candidate.manager && candidate.manager !== '0x0000000000000000000000000000000000000000' && (
                        <p>🔧 <strong>Manager:</strong> {candidate.manager}</p>
                      )}
                    </div>
                  </div>
                  <button
                    className="challenge-btn"
                    onClick={() => console.log('🚀 챌린지 시작:', candidate.name)}
                  >
                    Challenge
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-candidates">
              <p>😔 이 멤버에게 도전할 수 있는 Layer2가 없습니다.</p>
              <p>더 높은 스테이킹을 가진 Layer2가 필요합니다.</p>
            </div>
          )}

          <div className="cache-info">
            <small>
              ⚡ Results from cached data •
              {hasLoadedLayer2Once ? ' Cache ready' : ' Building cache...'}
            </small>
          </div>
        </div>
      )}

      <style jsx>{`
        .check-challenge-container {
          position: relative;
        }

        .check-challenge-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .check-challenge-btn:hover:not(.disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        .check-challenge-btn.disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .layer2-progress {
          margin-top: 8px;
        }

        .progress-bar {
          width: 100%;
          height: 4px;
          background: #f0f0f0;
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          transition: width 0.3s ease;
        }

        .error-message {
          color: #e74c3c;
          margin-top: 8px;
          padding: 8px;
          background: #fdf2f2;
          border-radius: 4px;
          font-size: 14px;
        }

        .challenge-results {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
          z-index: 1000;
          padding: 0;
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
          background: #f8f9fa;
          border-radius: 12px 12px 0 0;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #666;
        }

        .target-info {
          padding: 15px 20px;
          background: #f0f4f8;
          border-left: 4px solid #667eea;
        }

        .candidates-list {
          padding: 20px;
        }

        .candidate-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          border: 1px solid #eee;
          border-radius: 8px;
          margin-bottom: 10px;
          transition: transform 0.2s ease;
        }

        .candidate-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .candidate-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .rank {
          background: #667eea;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }

        .candidate-details p {
          margin: 4px 0;
          font-size: 14px;
          color: #666;
        }

        .challenge-btn {
          background: #e74c3c;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }

        .challenge-btn:hover {
          background: #c0392b;
        }

        .no-candidates {
          padding: 40px 20px;
          text-align: center;
          color: #666;
        }

        .cache-info {
          padding: 15px 20px;
          border-top: 1px solid #eee;
          background: #f8f9fa;
          color: #666;
          text-align: center;
        }
      `}</style>
    </div>
  );
}