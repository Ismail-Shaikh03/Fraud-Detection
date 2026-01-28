import React from 'react';
import type { FraudEvaluationResponse } from '../types';
import { format } from 'date-fns';

interface TransactionDetailModalProps {
  transaction: FraudEvaluationResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  isOpen,
  onClose,
}) => {
  if (!transaction || !isOpen) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PPpp');
    } catch {
      return dateString;
    }
  };

  const getRiskColor = (category: string) => {
    switch (category) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'MONITOR':
        return 'bg-yellow-100 text-yellow-800';
      case 'FLAGGED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto ${isOpen ? '' : 'hidden'}`}>
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold">Transaction Details</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Risk Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Risk Assessment</h3>
                <span className={`px-3 py-1 rounded text-sm font-medium ${getRiskColor(transaction.riskCategory)}`}>
                  {transaction.riskCategory}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Risk Score</p>
                  <p className="text-xl font-bold">{transaction.riskScore.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Rule Score</p>
                  <p className="text-lg">{transaction.ruleScore?.toFixed(1) || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Statistical Score</p>
                  <p className="text-lg">{transaction.statisticalScore?.toFixed(1) || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ML Score</p>
                  <p className="text-lg">{transaction.mlScore ? (transaction.mlScore * 100).toFixed(1) : 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Transaction Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Transaction Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Transaction ID</p>
                  <p className="font-mono text-sm">{transaction.transactionId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">User ID</p>
                  <p className="font-mono text-sm">{transaction.userId || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="text-lg font-semibold">${transaction.amount?.toFixed(2) || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Timestamp</p>
                  <p className="text-sm">{formatDate(transaction.timestamp)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Merchant ID</p>
                  <p className="font-mono text-sm">{transaction.merchantId || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Merchant Category</p>
                  <p className="text-sm capitalize">{transaction.merchantCategory || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Device ID</p>
                  <p className="font-mono text-sm">{transaction.deviceId || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Channel</p>
                  <p className="text-sm">{transaction.channel || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="text-sm">{transaction.locationState || 'N/A'}, {transaction.locationCountry || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Z-Score</p>
                  <p className="text-sm">{transaction.zScore?.toFixed(2) || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Velocity Count</p>
                  <p className="text-sm">{transaction.velocityCount || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Alert Created</p>
                  <p className="text-sm">{transaction.alertCreated ? '⚠️ Yes' : 'No'}</p>
                </div>
              </div>
            </div>

            {/* Triggered Rules */}
            {transaction.triggeredRules && transaction.triggeredRules.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Triggered Rules ({transaction.triggeredRules.length})</h3>
                <div className="space-y-2">
                  {transaction.triggeredRules.map((rule, index) => (
                    <div key={index} className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{rule.ruleName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                          <p className="text-sm text-gray-600 mt-1">{rule.explanation}</p>
                        </div>
                        <span className="ml-4 text-sm font-semibold text-yellow-800">+{rule.points.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explanation */}
            {transaction.explanation && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Explanation</h3>
                <p className="text-sm text-gray-700 whitespace-pre-line">{transaction.explanation}</p>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
