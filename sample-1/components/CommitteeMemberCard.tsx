"use client";

import { CommitteeMember } from '@/types/dao';
import { CheckChallengeButton } from './CheckChallengeButton';

interface CommitteeMemberCardProps {
  member: CommitteeMember;
  className?: string;
}

export function CommitteeMemberCard({ member, className = "" }: CommitteeMemberCardProps) {
  return (
    <div className={`member-card ${className}`}>
      <div className="member-info">
        <div className="member-header">
          <h3>{member.name}</h3>
          <span className="member-index">#{member.indexMembers}</span>
        </div>

        <div className="member-details">
          <div className="detail-row">
            <span className="label">💰 Staking:</span>
            <span className="value">{(Number(member.totalStaked) / 1e18).toFixed(2)} TON</span>
          </div>

          <div className="detail-row">
            <span className="label">🏠 Contract:</span>
            <span className="value address">{member.candidateContract}</span>
          </div>

          <div className="detail-row">
            <span className="label">👤 Creation Address:</span>
            <span className="value address">{member.creationAddress}</span>
          </div>

          {member.claimableActivityReward && Number(member.claimableActivityReward) > 0 && (
            <div className="detail-row">
              <span className="label">🎁 Claimable Reward:</span>
              <span className="value">{(Number(member.claimableActivityReward) / 1e18).toFixed(4)} TON</span>
            </div>
          )}

          <div className="detail-row">
            <span className="label">📅 Joined:</span>
            <span className="value">{member.description}</span>
          </div>
        </div>
      </div>

      <div className="member-actions">
        <CheckChallengeButton
          targetMember={member}
          className="challenge-action"
        />
      </div>

      <style jsx>{`
        .member-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          border: 1px solid #e1e5e9;
        }

        .member-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
        }

        .member-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid #f0f4f8;
        }

        .member-header h3 {
          margin: 0;
          color: #2d3748;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .member-index {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .member-details {
          margin-bottom: 20px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          padding: 6px 0;
        }

        .label {
          font-weight: 500;
          color: #4a5568;
          font-size: 0.9rem;
        }

        .value {
          color: #2d3748;
          font-weight: 600;
          text-align: right;
          max-width: 60%;
        }

        .value.address {
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.8rem;
          word-break: break-all;
          color: #667eea;
        }

        .member-actions {
          display: flex;
          justify-content: center;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }

        .challenge-action {
          flex: 1;
          max-width: 200px;
        }

        @media (max-width: 768px) {
          .member-card {
            padding: 16px;
          }

          .detail-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }

          .value {
            max-width: 100%;
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
}