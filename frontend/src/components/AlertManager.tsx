import React, { useState, useEffect } from 'react';
import { alertApi } from '../services/api';
import { format } from 'date-fns';
import type { Alert } from '../types';

interface PaginationInfo {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export const AlertManager: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 0,
    size: 15,
    totalElements: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<Alert['status']>('NEW');

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 10000);
    return () => clearInterval(interval);
  }, [filter, pagination.page]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const alertStatus = filter === 'all' ? undefined : (filter as Alert['status']);
      const response = await alertApi.getAlerts(pagination.page, pagination.size, alertStatus);
      setAlerts(response.content);
      setPagination({
        page: response.page,
        size: response.size,
        totalElements: response.totalElements,
        totalPages: response.totalPages,
        hasNext: response.hasNext,
        hasPrevious: response.hasPrevious,
      });
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setPagination((prev) => ({ ...prev, page: 0 })); // Reset to first page
  };

  const handleUpdateStatus = async () => {
    if (!selectedAlert) return;

    try {
      await alertApi.updateAlertStatus(selectedAlert.id, status, notes);
      setSelectedAlert(null);
      setNotes('');
      loadAlerts();
    } catch (error) {
      console.error('Failed to update alert:', error);
      alert('Failed to update alert status');
    }
  };

  const getStatusColor = (status: Alert['status']) => {
    switch (status) {
      case 'NEW':
        return 'bg-red-100 text-red-800';
      case 'INVESTIGATING':
        return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'FALSE_POSITIVE':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePrevious = () => {
    if (pagination.hasPrevious) {
      handlePageChange(pagination.page - 1);
    }
  };

  const handleNext = () => {
    if (pagination.hasNext) {
      handlePageChange(pagination.page + 1);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const totalPages = pagination.totalPages;
    const currentPage = pagination.page;

    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
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
          <h2 className="text-2xl font-bold">Fraud Alerts</h2>
          <p className="text-sm text-gray-600 mt-1">
            Showing {startItem}-{endItem} of {pagination.totalElements} alerts
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="all">All Status</option>
          <option value="NEW">New</option>
          <option value="INVESTIGATING">Investigating</option>
          <option value="RESOLVED">Resolved</option>
          <option value="FALSE_POSITIVE">False Positive</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading alerts...</div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No alerts found</div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedAlert(alert);
                setStatus(alert.status);
                setNotes(alert.analystNotes || '');
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold">Alert #{alert.id}</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                        alert.status
                      )}`}
                    >
                      {alert.status}
                    </span>
                    <span className="text-red-600 font-bold">
                      Risk: {alert.riskScore.toFixed(1)}/100
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Transaction: <span className="font-mono">{alert.transactionId}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    User: {alert.userId}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Created: {format(new Date(alert.createdAt), 'PPpp')}
                  </p>
                  {alert.analystNotes && (
                    <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded">
                      Notes: {alert.analystNotes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
                    onClick={() => handlePageChange(page)}
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

      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Update Alert Status</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Alert['status'])}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="NEW">New</option>
                  <option value="INVESTIGATING">Investigating</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="FALSE_POSITIVE">False Positive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Analyst Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  rows={4}
                  placeholder="Add notes about this alert..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleUpdateStatus}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                >
                  Update
                </button>
                <button
                  onClick={() => {
                    setSelectedAlert(null);
                    setNotes('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
