import React, { useState } from 'react';
import { transactionApi } from '../services/api';
import type { TransactionRequest, FraudEvaluationResponse } from '../types';

interface TransactionFormProps {
  onTransactionProcessed?: (result: FraudEvaluationResponse) => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onTransactionProcessed,
}) => {
  const [formData, setFormData] = useState<TransactionRequest>({
    transactionId: `txn_${Date.now()}`,
    userId: 'user_123',
    amount: 50.0,
    merchantId: 'merchant_001',
    merchantCategory: 'groceries',
    timestamp: new Date().toISOString().slice(0, 16),
    deviceId: 'device_001',
    locationState: 'CA',
    locationCountry: 'US',
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FraudEvaluationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const transaction: TransactionRequest = {
        ...formData,
        timestamp: new Date(formData.timestamp).toISOString(),
      };

      const response = await transactionApi.processTransaction(transaction);
      setResult(response);
      if (onTransactionProcessed) {
        onTransactionProcessed(response);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) : value,
    }));
  };

  const randomizeFields = () => {
    const merchantCategories = [
      'groceries', 'restaurant', 'gas', 'retail', 
      'electronics', 'crypto', 'gift_cards', 'jewelry'
    ];
    
    const usStates = [
      'CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 
      'NC', 'MI', 'NJ', 'VA', 'WA', 'AZ', 'MA', 'TN'
    ];
    
    const countries = ['US', 'CA', 'MX', 'GB', 'AU'];
    
    // Generate random amount between $10 and $10000
    const amount = Math.round((Math.random() * 9990 + 10) * 100) / 100;
    
    // Random timestamp within last 7 days
    const now = new Date();
    const daysAgo = Math.floor(Math.random() * 7);
    const hoursAgo = Math.floor(Math.random() * 24);
    const randomDate = new Date(now);
    randomDate.setDate(now.getDate() - daysAgo);
    randomDate.setHours(now.getHours() - hoursAgo);
    
    setFormData({
      transactionId: `txn_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      userId: `user_${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
      amount: amount,
      merchantId: `merchant_${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
      merchantCategory: merchantCategories[Math.floor(Math.random() * merchantCategories.length)],
      timestamp: randomDate.toISOString().slice(0, 16),
      deviceId: `device_${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
      locationState: usStates[Math.floor(Math.random() * usStates.length)],
      locationCountry: countries[Math.floor(Math.random() * countries.length)],
    });
    
    // Clear any previous result
    setResult(null);
    setError(null);
  };

  const riskColorClass = result
    ? result.riskCategory === 'APPROVED'
      ? 'text-green-600'
      : result.riskCategory === 'MONITOR'
      ? 'text-yellow-600'
      : 'text-red-600'
    : '';

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">Process New Transaction</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Transaction ID
            </label>
            <input
              type="text"
              name="transactionId"
              value={formData.transactionId}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">User ID</label>
            <input
              type="text"
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Amount ($)</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              step="0.01"
              min="0.01"
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Merchant ID
            </label>
            <input
              type="text"
              name="merchantId"
              value={formData.merchantId}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Merchant Category
            </label>
            <select
              name="merchantCategory"
              value={formData.merchantCategory}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="groceries">Groceries</option>
              <option value="restaurant">Restaurant</option>
              <option value="gas">Gas</option>
              <option value="retail">Retail</option>
              <option value="electronics">Electronics</option>
              <option value="crypto">Crypto</option>
              <option value="gift_cards">Gift Cards</option>
              <option value="jewelry">Jewelry</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Device ID</label>
            <input
              type="text"
              name="deviceId"
              value={formData.deviceId}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Location State</label>
            <input
              type="text"
              name="locationState"
              value={formData.locationState}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Location Country
            </label>
            <input
              type="text"
              name="locationCountry"
              value={formData.locationCountry}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Timestamp</label>
            <input
              type="datetime-local"
              name="timestamp"
              value={formData.timestamp}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={randomizeFields}
            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
          >
            🎲 Randomize Fields
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Process Transaction'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {result && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-bold mb-3">Evaluation Result</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Risk Score:</span>
              <span className={`font-bold ${riskColorClass}`}>
                {result.riskScore.toFixed(1)}/100 ({result.riskCategory})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Rule Score:</span>
              <span>{result.ruleScore.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Statistical Score:</span>
              <span>{result.statisticalScore.toFixed(1)}</span>
            </div>
            {result.mlScore !== null && (
              <div className="flex justify-between">
                <span className="font-medium">ML Score:</span>
                <span>{result.mlScore.toFixed(1)}</span>
              </div>
            )}
            {result.triggeredRules.length > 0 && (
              <div className="mt-3">
                <span className="font-medium">Triggered Rules:</span>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {result.triggeredRules.map((rule, idx) => (
                    <li key={idx} className="text-sm">
                      <strong>{rule.ruleName}:</strong> {rule.explanation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.alertCreated && (
              <div className="mt-3 p-2 bg-red-100 text-red-700 rounded text-sm">
                ⚠️ Alert created for this transaction
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
