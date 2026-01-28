import React, { useState, useEffect } from 'react';
import { transactionApi } from '../services/api';
import type { UserAnalytics as UserAnalyticsType } from '../types';
import { TransactionDetailModal } from './TransactionDetailModal';
import { StatsCard } from './StatsCard';

interface UserAnalyticsProps {
  userId: string;
  onBack: () => void;
}

export const UserAnalytics: React.FC<UserAnalyticsProps> = ({ userId, onBack }) => {
  const [analytics, setAnalytics] = useState<UserAnalyticsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadUserAnalytics();
  }, [userId]);

  const loadUserAnalytics = async () => {
    try {
      setLoading(true);
      const data = await transactionApi.getUserTransactions(userId);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load user analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading user analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">User not found</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
          Back
        </button>
      </div>
    );
  }

  return (
    <>
      <TransactionDetailModal
        transaction={selectedTransaction}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
      />

      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  User Analytics: {userId}
                </h1>
                <p className="text-gray-600 mt-1">
                  Transaction history and behavior patterns
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatsCard
              title="Total Transactions"
              value={analytics.stats.total}
              color="blue"
            />
            <StatsCard
              title="Approved"
              value={analytics.stats.approved}
              color="green"
            />
            <StatsCard
              title="Monitor"
              value={analytics.stats.monitor}
              color="yellow"
            />
            <StatsCard
              title="Flagged"
              value={analytics.stats.flagged}
              color="red"
            />
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">User Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Average Amount</p>
                <p className="text-2xl font-bold">${analytics.stats.avgAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Approval Rate</p>
                <p className="text-2xl font-bold">
                  {analytics.stats.total > 0 
                    ? ((analytics.stats.approved / analytics.stats.total) * 100).toFixed(1) 
                    : 0}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Flag Rate</p>
                <p className="text-2xl font-bold">
                  {analytics.stats.total > 0 
                    ? ((analytics.stats.flagged / analytics.stats.total) * 100).toFixed(1) 
                    : 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Transaction History</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Transaction ID</th>
                    <th className="text-left py-2 px-3">Amount</th>
                    <th className="text-left py-2 px-3">Risk Score</th>
                    <th className="text-left py-2 px-3">Category</th>
                    <th className="text-left py-2 px-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.transactions.map((txn) => (
                    <tr
                      key={txn.transactionId}
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedTransaction(txn);
                        setShowDetailModal(true);
                      }}
                    >
                      <td className="py-2 px-3 font-mono text-sm">{txn.transactionId}</td>
                      <td className="py-2 px-3">${txn.amount?.toFixed(2) || 'N/A'}</td>
                      <td className="py-2 px-3 font-bold">{txn.riskScore.toFixed(1)}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          txn.riskCategory === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          txn.riskCategory === 'MONITOR' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {txn.riskCategory}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-sm">{txn.timestamp || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};
