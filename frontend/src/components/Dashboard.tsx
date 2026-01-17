import React, { useState, useEffect } from 'react';
import { TransactionForm } from './TransactionForm';
import { TransactionList } from './TransactionList';
import { AlertManager } from './AlertManager';
import { RiskScoreChart } from './RiskScoreChart';
import { StatsCard } from './StatsCard';
import { Modal } from './Modal';
import { Toast } from './Toast';
import { transactionApi, adminApi } from '../services/api';
import type { FraudEvaluationResponse } from '../types';

export const Dashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<FraudEvaluationResponse[]>([]);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 15,
    totalElements: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    monitor: 0,
    flagged: 0,
  });
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false,
  });

  // Load transactions and stats from backend on mount and periodically
  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadStats(); // Only refresh stats, not transactions list (to preserve pagination)
    }, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Reload transactions when page or filter changes
  useEffect(() => {
    loadTransactions();
  }, [pagination.page, filter]);

  const loadStats = async () => {
    try {
      const statsData = await transactionApi.getTransactionStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await transactionApi.getTransactions(
        pagination.page, 
        pagination.size,
        filter !== 'all' ? filter : undefined
      );
      setTransactions(response.content);
      setPagination({
        page: response.page,
        size: response.size,
        totalElements: response.totalElements,
        totalPages: response.totalPages,
        hasNext: response.hasNext,
        hasPrevious: response.hasPrevious,
      });
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    await Promise.all([loadStats(), loadTransactions()]);
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setPagination((prev) => ({ ...prev, page: 0 })); // Reset to first page
  };

  const handleTransactionProcessed = (_result: FraudEvaluationResponse) => {
    // Refresh data from backend
    loadData();
    // Reset to first page to show the new transaction
    setPagination((prev) => ({ ...prev, page: 0 }));
  };

  const handleLoadDataset = async () => {
    setShowModal(true);
  };

  const handleResetData = () => {
    setShowResetModal(true);
  };

  const confirmResetData = async () => {
    setResetting(true);
    setToast({ message: '', type: 'info', isVisible: false });
    
    try {
      const resetResult = await adminApi.resetData();
      setToast({
        message: `Successfully reset all data. Deleted: ${resetResult.deleted.transactions} transactions, ${resetResult.deleted.alerts} alerts, ${resetResult.deleted.userBaselines} baselines`,
        type: 'success',
        isVisible: true,
      });
      
      // Reload data after reset (everything should be empty now)
      await loadData();
      // Reset to first page
      setPagination((prev) => ({ ...prev, page: 0 }));
    } catch (error: any) {
      setToast({
        message: `Error: ${error.response?.data?.error || error.message}`,
        type: 'error',
        isVisible: true,
      });
    } finally {
      setResetting(false);
    }
  };

  const confirmLoadDataset = async () => {
    setSeeding(true);
    setToast({ message: '', type: 'info', isVisible: false });
    
    try {
      const seedResult = await transactionApi.seedDataset(1000);
      setToast({
        message: `Successfully generated ${seedResult.total} transactions: ${seedResult.approved} approved, ${seedResult.monitor} monitor, ${seedResult.flagged} flagged`,
        type: 'success',
        isVisible: true,
      });
      
      // Reload data after seeding (stats will now reflect all 1000+ transactions)
      await loadData();
      // Reset to first page
      setPagination((prev) => ({ ...prev, page: 0 }));
    } catch (error: any) {
      setToast({
        message: `Error: ${error.response?.data?.error || error.message}`,
        type: 'error',
        isVisible: true,
      });
    } finally {
      setSeeding(false);
    }
  };

  const chartData = [
    { name: 'APPROVED', value: stats.approved },
    { name: 'MONITOR', value: stats.monitor },
    { name: 'FLAGGED', value: stats.flagged },
  ];

  if (loading && transactions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
      
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={confirmLoadDataset}
        title="Load Dataset"
        message="This will generate 1000 transactions through the fraud detection system. This may take a moment. Continue?"
        confirmText="Load Dataset"
        cancelText="Cancel"
        confirmColor="blue"
      />

      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={confirmResetData}
        title="Reset All Data"
        message="This will permanently delete ALL transactions, alerts, and user baselines. This action cannot be undone. Continue?"
        confirmText="Reset All Data"
        cancelText="Cancel"
        confirmColor="red"
      />

      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🛡️ Fraud Detection Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Real-time transaction monitoring and fraud analysis
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleResetData}
                disabled={resetting || seeding}
                className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {resetting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Resetting...</span>
                  </>
                ) : (
                  <span>🗑️ Reset Data</span>
                )}
              </button>
              <button
                onClick={handleLoadDataset}
                disabled={seeding || resetting}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {seeding ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Loading Dataset...</span>
                  </>
                ) : (
                  <span>📊 Load Dataset (1000)</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Total Transactions"
            value={stats.total}
            color="blue"
          />
          <StatsCard
            title="Approved"
            value={stats.approved}
            color="green"
            subtitle={`${stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(1) : 0}% of total`}
          />
          <StatsCard
            title="Monitor"
            value={stats.monitor}
            color="yellow"
            subtitle={`${stats.total > 0 ? ((stats.monitor / stats.total) * 100).toFixed(1) : 0}% of total`}
          />
          <StatsCard
            title="Flagged"
            value={stats.flagged}
            color="red"
            subtitle={`${stats.total > 0 ? ((stats.flagged / stats.total) * 100).toFixed(1) : 0}% of total`}
          />
        </div>

        {stats.total > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Risk Distribution</h2>
            <RiskScoreChart data={chartData} />
          </div>
        )}

        <TransactionForm onTransactionProcessed={handleTransactionProcessed} />

        <div className="mb-6">
          <TransactionList
            transactions={transactions}
            pagination={pagination}
            onPageChange={handlePageChange}
            filter={filter}
            onFilterChange={handleFilterChange}
          />
        </div>

        <AlertManager />
      </main>
    </div>
  );
};
