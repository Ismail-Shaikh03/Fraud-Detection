import React, { useState, useEffect } from 'react';
import type { FraudEvaluationResponse } from '../types';

interface PaginationInfo {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface TransactionListProps {
  transactions: FraudEvaluationResponse[];
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  pagination,
  onPageChange,
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [filteredTransactions, setFilteredTransactions] = useState(transactions);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredTransactions(transactions);
    } else {
      setFilteredTransactions(
        transactions.filter((t) => t.riskCategory === filter)
      );
    }
  }, [filter, transactions]);

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

  const handlePrevious = () => {
    if (pagination.hasPrevious) {
      onPageChange(pagination.page - 1);
    }
  };

  const handleNext = () => {
    if (pagination.hasNext) {
      onPageChange(pagination.page + 1);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const totalPages = pagination.totalPages;
    const currentPage = pagination.page;

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page, ellipsis, current page range, ellipsis, last page
      pages.push(0);
      if (currentPage > 2) {
        pages.push('...');
      }
      for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages - 2, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 3) {
        pages.push('...');
      }
      pages.push(totalPages - 1);
    }
    return pages;
  };

  const startItem = pagination.page * pagination.size + 1;
  const endItem = Math.min((pagination.page + 1) * pagination.size, pagination.totalElements);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold">Recent Transactions</h2>
          <p className="text-sm text-gray-600 mt-1">
            Showing {startItem}-{endItem} of {pagination.totalElements} transactions
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="all">All</option>
          <option value="APPROVED">Approved</option>
          <option value="MONITOR">Monitor</option>
          <option value="FLAGGED">Flagged</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-3">Transaction ID</th>
              <th className="text-left py-2 px-3">Risk Score</th>
              <th className="text-left py-2 px-3">Category</th>
              <th className="text-left py-2 px-3">Rules Triggered</th>
              <th className="text-left py-2 px-3">Alert</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">
                  No transactions found
                </td>
              </tr>
            ) : (
              filteredTransactions.map((txn) => (
                <tr key={txn.transactionId} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3 font-mono text-sm">
                    {txn.transactionId}
                  </td>
                  <td className="py-2 px-3">
                    <span className="font-bold">{txn.riskScore.toFixed(1)}</span>
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(
                        txn.riskCategory
                      )}`}
                    >
                      {txn.riskCategory}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <span className="text-sm">
                      {txn.triggeredRules.length} rule(s)
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    {txn.alertCreated ? (
                      <span className="text-red-600 font-bold">⚠️ Alert</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              disabled={!pagination.hasPrevious}
              className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {getPageNumbers().map((pageNum, index) => {
                if (pageNum === '...') {
                  return (
                    <span key={`ellipsis-${index}`} className="px-2">
                      ...
                    </span>
                  );
                }
                const page = pageNum as number;
                const isActive = page === pagination.page;
                return (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-2 border rounded ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {page + 1}
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleNext}
              disabled={!pagination.hasNext}
              className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="text-sm text-gray-600">
            Page {pagination.page + 1} of {pagination.totalPages}
          </div>
        </div>
      )}
    </div>
  );
};
