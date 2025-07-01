"use client";

import { useCombinedDAOContext } from '@/contexts/CombinedDAOContext';
import { CommitteeMemberCard } from '@/components/CommitteeMemberCard';

export default function CommitteePage() {
  const {
    committeeMembers,
    isLoadingMembers,
    membersError,
    loadLayer2Candidates,
    isLoadingLayer2,
    layer2Total,
    layer2Candidates,
    hasLoadedLayer2Once
  } = useCombinedDAOContext();

  const handlePreloadLayer2 = async () => {
    await loadLayer2Candidates();
  };

  return (
    <div className="committee-page">
      <div className="page-header">
        <h1>📋 Committee Members</h1>
        <p>DAO 위원회 멤버들과 챌린지 시스템</p>

        {/* Layer2 데이터 미리 로드 버튼 */}
        <div className="preload-section">
          <button
            onClick={handlePreloadLayer2}
            disabled={isLoadingLayer2}
            className={`preload-btn ${isLoadingLayer2 ? 'loading' : ''}`}
          >
            {isLoadingLayer2
              ? `Loading Layer2... (${layer2Candidates.length}/${layer2Total})`
              : hasLoadedLayer2Once
              ? '🚀 Layer2 Data Ready'
              : '📦 Preload Layer2 Data'
            }
          </button>

          {isLoadingLayer2 && (
            <div className="preload-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${layer2Total > 0 ? (layer2Candidates.length / layer2Total) * 100 : 0}%` }}
                />
              </div>
              <small>
                미리 로드하면 각 멤버의 Challenge 체크가 빨라집니다 ⚡
              </small>
            </div>
          )}
        </div>
      </div>

      <div className="committee-content">
        {isLoadingMembers ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading committee member information...</p>
          </div>
        ) : membersError ? (
          <div className="error-state">
            <p>❌ {membersError}</p>
          </div>
        ) : committeeMembers && committeeMembers.length > 0 ? (
          <div className="members-grid">
            {committeeMembers.map((member, index) => (
              <CommitteeMemberCard
                key={member.candidateContract}
                member={member}
                className="member-item"
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>아직 로드된 위원회 멤버가 없습니다.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .committee-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .page-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .page-header h1 {
          font-size: 2.5rem;
          color: #2d3748;
          margin-bottom: 8px;
        }

        .page-header p {
          color: #666;
          font-size: 1.1rem;
          margin-bottom: 30px;
        }

        .preload-section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          margin-bottom: 20px;
        }

        .preload-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 1rem;
          transition: all 0.3s ease;
          margin-bottom: 10px;
        }

        .preload-btn:hover:not(.loading) {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        .preload-btn.loading {
          background: #ccc;
          cursor: not-allowed;
        }

        .preload-progress {
          max-width: 400px;
          margin: 0 auto;
        }

        .progress-bar {
          width: 100%;
          height: 6px;
          background: #e2e8f0;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          transition: width 0.3s ease;
        }

        .loading-state,
        .error-state,
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #666;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .members-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 24px;
          margin-top: 20px;
        }

        .member-item {
          /* 추가 스타일이 필요하면 여기에 */
        }

        @media (max-width: 768px) {
          .committee-page {
            padding: 16px;
          }

          .page-header h1 {
            font-size: 2rem;
          }

          .members-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .preload-section {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}