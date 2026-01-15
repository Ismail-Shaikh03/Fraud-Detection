import React, { useState, useEffect } from 'react';
import { alertApi } from '../services/api';
import { format } from 'date-fns';
import type { Alert } from '../types';

export const AlertManager: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<Alert['status']>('NEW');

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 10000);
    return () => clearInterval(interval);
  }, [filter]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const alertStatus = filter === 'all' ? undefined : (filter as Alert['status']);
      const data = await alertApi.getAlerts(alertStatus);
      setAlerts(data);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
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

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(a => a.status === filter);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Fraud Alerts</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
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
      ) : filteredAlerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No alerts found</div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
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
