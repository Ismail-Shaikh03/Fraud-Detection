import React, { useState } from 'react';
import type { FraudEvaluationResponse } from '../types';
import { TransactionDetailModal } from './TransactionDetailModal';
import { transactionApi } from '../services/api';

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
  filter: string;
  onFilterChange: (filter: string) => void;
  onSearch: (filters: SearchFilters) => void;
}

interface SearchFilters {
  transactionId?: string;
  userId?: string;
  merchantId?: string;
  startDate?: string;
  endDate?: string;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  pagination,
  onPageChange,
  filter,
  onFilterChange,
  onSearch,
}) => {
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [showSearch, setShowSearch] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<FraudEvaluationResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleSearchChange = (key: keyof SearchFilters, value: string) => {
    setSearchFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    onSearch(searchFilters);
  };

  const handleClearSearch = () => {
    setSearchFilters({});
    onSearch({});
  };

  const handleRowClick = async (transaction: FraudEvaluationResponse) => {
    // If we don't have full details, fetch them
    if (!transaction.userId) {
      try {
        const fullTransaction = await transactionApi.getTransactionById(transaction.transactionId);
        setSelectedTransaction(fullTransaction);
      } catch (error) {
        console.error('Failed to load transaction details:', error);
        setSelectedTransaction(transaction);
      }
    } else {
      setSelectedTransaction(transaction);
    }
    setShowDetailModal(true);
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
    <>
      <TransactionDetailModal
        transaction={selectedTransaction}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
      />

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold">Recent Transactions</h2>
            <p className="text-sm text-gray-600 mt-1">
              Showing {startItem}-{endItem} of {pagination.totalElements} transactions
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              {showSearch ? '✕ Hide Search' : '🔍 Search'}
            </button>
            <select
              value={filter}
              onChange={(e) => onFilterChange(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="all">All</option>
              <option value="APPROVED">Approved</option>
              <option value="MONITOR">Monitor</option>
              <option value="FLAGGED">Flagged</option>
            </select>
          </div>
        </div>

        {showSearch && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Transaction ID"
                value={searchFilters.transactionId || ''}
                onChange={(e) => handleSearchChange('transactionId', e.target.value)}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="User ID"
                value={searchFilters.userId || ''}
                onChange={(e) => handleSearchChange('userId', e.target.value)}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Merchant ID"
                value={searchFilters.merchantId || ''}
                onChange={(e) => handleSearchChange('merchantId', e.target.value)}
                className="border rounded px-3 py-2"
              />
              <input
                type="date"
                placeholder="Start Date"
                value={searchFilters.startDate || ''}
                onChange={(e) => handleSearchChange('startDate', e.target.value)}
                className="border rounded px-3 py-2"
              />
              <input
                type="date"
                placeholder="End Date"
                value={searchFilters.endDate || ''}
                onChange={(e) => handleSearchChange('endDate', e.target.value)}
                className="border rounded px-3 py-2"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Search
                </button>
                <button
                  onClick={handleClearSearch}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

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
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">
                  No transactions found
                </td>
              </tr>
            ) : (
              transactions.map((txn) => (
                <tr 
                  key={txn.transactionId} 
                  className="border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleRowClick(txn)}
                >
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
    </>
  );
};
