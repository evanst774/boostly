// src/app/admin/subscriptions/plans/page.tsx

'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TIERS,
  TIER_OPTIONS,
} from '@/lib/constants/tiers';

interface Plan {
  id: string;
  name: string;
  tier: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  dailyEarnings: number;
  features: string[];
  maxDailyVideos: number;
  maxDailyGames: number;
  maxDailyAds: number;
  maxDailySurveys: number;
  badgeBoost: number;
  priorityWithdrawal: boolean;
  vipSupport: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PlanFormData {
  name: string;
  tier: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  dailyEarnings: number;
  features: string[];
  maxDailyVideos: number;
  maxDailyGames: number;
  maxDailyAds: number;
  maxDailySurveys: number;
  badgeBoost: number;
  priorityWithdrawal: boolean;
  vipSupport: boolean;
  isActive: boolean;
}

const defaultFormData: PlanFormData = {
  name: '',
  tier: 'STARTER',
  description: '',
  priceMonthly: 0,
  priceYearly: 0,
  dailyEarnings: 0,
  features: [''],
  maxDailyVideos: 10,
  maxDailyGames: 5,
  maxDailyAds: 10,
  maxDailySurveys: 3,
  badgeBoost: 0,
  priorityWithdrawal: false,
  vipSupport: false,
  isActive: true,
};

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<PlanFormData>(defaultFormData);
  const [expandedFeatures, setExpandedFeatures] = useState<
    Record<string, boolean>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/subscriptions/plans');
      if (!response.ok) throw new Error('Failed to fetch plans');
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (err) {
      setError('Failed to load plans. Please try again.');
      console.error('Error fetching plans:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const filteredFeatures = formData.features.filter((f) => f.trim() !== '');

      const payload = {
        ...formData,
        features: filteredFeatures,
        priceYearly: formData.priceYearly || formData.priceMonthly * 10,
      };

      const url = editingPlan
        ? `/api/subscriptions/plans/${editingPlan.id}`
        : '/api/subscriptions/plans';

      const method = editingPlan ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save plan');
      }

      setSuccess(
        editingPlan
          ? 'Plan updated successfully!'
          : 'Plan created successfully!',
      );
      await fetchPlans();
      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this plan? This action cannot be undone.',
      )
    )
      return;

    try {
      const response = await fetch(`/api/subscriptions/plans/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete plan');
      }

      setSuccess('Plan deleted successfully!');
      await fetchPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete plan');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/subscriptions/plans/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle plan');
      }

      await fetchPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle plan');
    }
  };

  const handleOpenCreate = () => {
    setFormData(defaultFormData);
    setIsCreating(true);
    setEditingPlan(null);
    setError(null);
    setSuccess(null);
  };

  const handleOpenEdit = (plan: Plan) => {
    setFormData({
      name: plan.name,
      tier: plan.tier,
      description: plan.description || '',
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly || plan.priceMonthly * 10,
      dailyEarnings: plan.dailyEarnings,
      features: plan.features.length > 0 ? plan.features : [''],
      maxDailyVideos: plan.maxDailyVideos || 10,
      maxDailyGames: plan.maxDailyGames || 5,
      maxDailyAds: plan.maxDailyAds || 10,
      maxDailySurveys: plan.maxDailySurveys || 3,
      badgeBoost: plan.badgeBoost || 0,
      priorityWithdrawal: plan.priorityWithdrawal || false,
      vipSupport: plan.vipSupport || false,
      isActive: plan.isActive,
    });
    setEditingPlan(plan);
    setIsCreating(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseModal = () => {
    setIsCreating(false);
    setEditingPlan(null);
    setFormData(defaultFormData);
    setError(null);
    setSuccess(null);
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const removeFeature = (index: number) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  // Get tier display info
  const getTierDisplay = (tier: string) => {
    const config = TIERS[tier];
    if (!config) return { emoji: '📋', color: '#6B7280', label: tier };
    return {
      emoji: config.emoji,
      color: config.color,
      label: config.label,
      bgColor: config.bgColor,
      borderColor: config.borderColor,
      textColor: config.textColor,
      badgeColor: config.badgeColor,
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Subscription Plans</h1>
          <p className="text-text-secondary text-sm">
            Manage your subscription plans and pricing
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-gold hover:bg-gold-hover text-navy font-bold px-4 py-2.5 rounded-full flex items-center gap-2 transition shadow-gold hover:shadow-gold/50"
        >
          <Plus size={18} />
          Add Plan
        </button>
      </div>

      {/* Success/Error Messages */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-xl flex items-center gap-2"
          >
            <Check size={18} />
            {success}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl flex items-center gap-2"
          >
            <AlertCircle size={18} />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plans Table */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
        {plans.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-text-secondary font-medium">
              No plans created yet
            </p>
            <p className="text-sm text-text-muted mt-1">
              Create your first subscription plan
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-4 bg-gold hover:bg-gold-hover text-navy font-bold px-6 py-2 rounded-full transition"
            >
              Create Plan
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                    Daily Earnings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                    Features
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-text-muted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {plans.map((plan) => {
                  const tierDisplay = getTierDisplay(plan.tier);

                  return (
                    <tr key={plan.id} className="hover:bg-bg transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                            style={{
                              backgroundColor: `${tierDisplay.color}15`,
                            }}
                          >
                            {tierDisplay.emoji}
                          </div>
                          <div>
                            <p className="font-bold text-navy">{plan.name}</p>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tierDisplay.badgeColor}`}
                            >
                              {tierDisplay.label}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium">
                          {plan.priceMonthly.toLocaleString()} RWF
                        </p>
                        <p className="text-xs text-text-muted">/month</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-success">
                          {plan.dailyEarnings.toLocaleString()} RWF
                        </p>
                        <p className="text-xs text-text-muted">/day</p>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            setExpandedFeatures((prev) => ({
                              ...prev,
                              [plan.id]: !prev[plan.id],
                            }))
                          }
                          className="flex items-center gap-1 text-sm text-text-secondary hover:text-navy transition"
                        >
                          {plan.features.length} features
                          {expandedFeatures[plan.id] ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </button>
                        {expandedFeatures[plan.id] && (
                          <ul className="mt-2 space-y-1">
                            {plan.features.map((feature, idx) => (
                              <li
                                key={idx}
                                className="text-xs text-text-secondary flex items-center gap-1.5"
                              >
                                <Check size={12} className="text-success" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            handleToggleActive(plan.id, plan.isActive)
                          }
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                            plan.isActive
                              ? 'bg-success/10 text-success hover:bg-success/20'
                              : 'bg-text-muted/10 text-text-muted hover:bg-text-muted/20'
                          }`}
                        >
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(plan)}
                            className="p-2 rounded-lg hover:bg-bg transition"
                            title="Edit"
                          >
                            <Edit2 size={16} className="text-text-muted" />
                          </button>
                          <button
                            onClick={() => handleDelete(plan.id)}
                            className="p-2 rounded-lg hover:bg-danger/10 transition"
                            title="Delete"
                          >
                            <Trash2 size={16} className="text-danger" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h2 className="text-xl font-bold text-navy">
                  {editingPlan ? 'Edit Plan' : 'Create New Plan'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-lg hover:bg-bg transition"
                >
                  <X size={20} className="text-text-muted" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Plan Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-border rounded-xl focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition"
                        placeholder="e.g. Starter Plan"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Tier *
                      </label>
                      <select
                        required
                        value={formData.tier}
                        onChange={(e) =>
                          setFormData({ ...formData, tier: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-border rounded-xl focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition bg-white"
                      >
                        {TIER_OPTIONS.map((tier) => {
                          const display = getTierDisplay(tier);
                          return (
                            <option key={tier} value={tier}>
                              {display.emoji} {display.label} ({tier})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  {/* Tier Preview */}
                  {formData.tier && (
                    <div
                      className="p-4 rounded-xl border"
                      style={{
                        backgroundColor: getTierDisplay(formData.tier).bgColor,
                        borderColor: getTierDisplay(formData.tier).borderColor,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {getTierDisplay(formData.tier).emoji}
                        </span>
                        <div>
                          <p
                            className="font-bold"
                            style={{
                              color: getTierDisplay(formData.tier).color,
                            }}
                          >
                            {getTierDisplay(formData.tier).label}
                          </p>
                          <p className="text-xs text-text-muted">
                            {TIERS[formData.tier]?.description || ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-border rounded-xl focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition resize-none h-20"
                      placeholder="Describe the plan..."
                    />
                  </div>

                  {/* Pricing */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Monthly Price (RWF) *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="100"
                        value={formData.priceMonthly}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            priceMonthly: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-2 border border-border rounded-xl focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Yearly Price (RWF)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={formData.priceYearly}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            priceYearly: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-2 border border-border rounded-xl focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Daily Earnings (RWF) *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="10"
                        value={formData.dailyEarnings}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dailyEarnings: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-2 border border-border rounded-xl focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Limits */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Max Videos
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.maxDailyVideos}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxDailyVideos: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-2 border border-border rounded-xl focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Max Games
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.maxDailyGames}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxDailyGames: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-2 border border-border rounded-xl focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Max Ads
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.maxDailyAds}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxDailyAds: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-2 border border-border rounded-xl focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Max Surveys
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.maxDailySurveys}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxDailySurveys: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-2 border border-border rounded-xl focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Badge Boost */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Badge Boost (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="5"
                      value={formData.badgeBoost * 100}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          badgeBoost: parseInt(e.target.value) / 100 || 0,
                        })
                      }
                      className="w-full px-4 py-2 border border-border rounded-xl focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition"
                    />
                    <p className="text-xs text-text-muted mt-1">
                      0-100% boost applied to badge earnings
                    </p>
                  </div>

                  {/* Features */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-text-secondary">
                        Features
                      </label>
                      <button
                        type="button"
                        onClick={addFeature}
                        className="text-xs font-semibold text-gold hover:underline"
                      >
                        + Add Feature
                      </button>
                    </div>
                    <div className="space-y-2">
                      {formData.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={feature}
                            onChange={(e) =>
                              updateFeature(index, e.target.value)
                            }
                            className="flex-1 px-4 py-2 border border-border rounded-xl focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition"
                            placeholder="e.g. Daily earning up to 80 RWF"
                          />
                          {formData.features.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeFeature(index)}
                              className="p-2 rounded-lg hover:bg-danger/10 transition"
                            >
                              <X size={16} className="text-danger" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            priorityWithdrawal: !formData.priorityWithdrawal,
                          })
                        }
                        className={`w-12 h-7 rounded-full transition ${formData.priorityWithdrawal ? 'bg-gold' : 'bg-border'}`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow-sm transition ${formData.priorityWithdrawal ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                      <span className="text-sm font-medium">
                        Priority Withdrawal
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            vipSupport: !formData.vipSupport,
                          })
                        }
                        className={`w-12 h-7 rounded-full transition ${formData.vipSupport ? 'bg-gold' : 'bg-border'}`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow-sm transition ${formData.vipSupport ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                      <span className="text-sm font-medium">VIP Support</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            isActive: !formData.isActive,
                          })
                        }
                        className={`w-12 h-7 rounded-full transition ${formData.isActive ? 'bg-success' : 'bg-border'}`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow-sm transition ${formData.isActive ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                      <span className="text-sm font-medium">Active</span>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-border text-text-secondary font-medium hover:bg-bg transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-gold hover:bg-gold-hover text-navy font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Saving...
                        </>
                      ) : editingPlan ? (
                        'Update Plan'
                      ) : (
                        'Create Plan'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
