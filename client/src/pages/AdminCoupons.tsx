import React, { useState, useEffect } from 'react';
import { Plus, Tag, Calendar, Edit, Trash2, Copy, AlertCircle } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface Coupon {
  id: string;
  name: string;
  percentOff: number | null;
  amountOff: number | null;
  duration: string;
  durationInMonths: number | null;
  maxRedemptions: number | null;
  timesRedeemed: number;
  valid: boolean;
  created: number;
  currency: string;
}

const AdminCoupons: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { toast } = useToast();

  const [newCoupon, setNewCoupon] = useState({
    id: '',
    name: '',
    discountType: 'percent' as 'percent' | 'amount',
    percentOff: 50,
    amountOff: 500, // In pence
    duration: 'once' as 'once' | 'repeating' | 'forever',
    durationInMonths: 3,
    maxRedemptions: null as number | null
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await fetch('/api/admin/coupons', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setCoupons(data.coupons || []);
      }
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
      toast({
        title: "Error",
        description: "Failed to load coupons",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCoupon = async () => {
    try {
      const couponData = {
        id: newCoupon.id.toUpperCase(),
        name: newCoupon.name,
        duration: newCoupon.duration,
        ...(newCoupon.discountType === 'percent' 
          ? { percent_off: newCoupon.percentOff }
          : { amount_off: newCoupon.amountOff, currency: 'gbp' }
        ),
        ...(newCoupon.duration === 'repeating' && { duration_in_months: newCoupon.durationInMonths }),
        ...(newCoupon.maxRedemptions && { max_redemptions: newCoupon.maxRedemptions })
      };

      const response = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(couponData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Coupon created successfully",
        });
        setShowCreateModal(false);
        setNewCoupon({
          id: '',
          name: '',
          discountType: 'percent',
          percentOff: 50,
          amountOff: 500,
          duration: 'once',
          durationInMonths: 3,
          maxRedemptions: null
        });
        fetchCoupons();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to create coupon",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to create coupon:', error);
      toast({
        title: "Error",
        description: "Failed to create coupon",
        variant: "destructive",
      });
    }
  };

  const deleteCoupon = async (couponId: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Coupon deleted successfully",
        });
        fetchCoupons();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete coupon",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to delete coupon:', error);
      toast({
        title: "Error",
        description: "Failed to delete coupon",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Coupon code copied to clipboard",
    });
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.percentOff) {
      return `${coupon.percentOff}% off`;
    }
    if (coupon.amountOff) {
      return `£${(coupon.amountOff / 100).toFixed(2)} off`;
    }
    return 'Unknown discount';
  };

  const formatDuration = (coupon: Coupon) => {
    switch (coupon.duration) {
      case 'once':
        return 'One-time use';
      case 'forever':
        return 'Forever';
      case 'repeating':
        return `${coupon.durationInMonths} months`;
      default:
        return coupon.duration;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Coupon Management</h2>
          <p className="text-gray-400">Create and manage discount coupons for membership signups</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-600 hover:to-cyan-600 transition-all duration-200 shadow-lg hover:shadow-purple-500/25 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* Coupons List */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Discount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <Tag className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400">No coupons created yet</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="text-purple-400 hover:text-purple-300 mt-2"
                    >
                      Create your first coupon
                    </button>
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <code className="bg-gray-800 text-purple-400 px-2 py-1 rounded text-sm font-mono">
                          {coupon.id}
                        </code>
                        <button
                          onClick={() => copyToClipboard(coupon.id)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      {coupon.name && (
                        <div className="text-gray-400 text-sm mt-1">{coupon.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-green-400 font-medium">
                        {formatDiscount(coupon)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white">{formatDuration(coupon)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white">
                        {coupon.timesRedeemed}
                        {coupon.maxRedemptions && ` / ${coupon.maxRedemptions}`}
                      </div>
                      {coupon.maxRedemptions && (
                        <div className="w-20 bg-gray-700 rounded-full h-2 mt-1">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((coupon.timesRedeemed / coupon.maxRedemptions) * 100, 100)}%` }}
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        coupon.valid 
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {coupon.valid ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => deleteCoupon(coupon.id)}
                          className="text-red-400 hover:text-red-300 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Coupon Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Create New Coupon</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  value={newCoupon.id}
                  onChange={(e) => setNewCoupon({ ...newCoupon, id: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  placeholder="e.g., WELCOME50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={newCoupon.name}
                  onChange={(e) => setNewCoupon({ ...newCoupon, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  placeholder="e.g., Welcome discount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Discount Type *
                </label>
                <select
                  value={newCoupon.discountType}
                  onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value as 'percent' | 'amount' })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="percent">Percentage</option>
                  <option value="amount">Fixed Amount</option>
                </select>
              </div>

              {newCoupon.discountType === 'percent' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Percentage Off *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newCoupon.percentOff}
                    onChange={(e) => setNewCoupon({ ...newCoupon, percentOff: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount Off (£) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newCoupon.amountOff / 100}
                    onChange={(e) => setNewCoupon({ ...newCoupon, amountOff: Math.round(parseFloat(e.target.value) * 100) })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Duration *
                </label>
                <select
                  value={newCoupon.duration}
                  onChange={(e) => setNewCoupon({ ...newCoupon, duration: e.target.value as 'once' | 'repeating' | 'forever' })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="once">One-time use</option>
                  <option value="repeating">Repeating</option>
                  <option value="forever">Forever</option>
                </select>
              </div>

              {newCoupon.duration === 'repeating' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Duration (Months) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newCoupon.durationInMonths}
                    onChange={(e) => setNewCoupon({ ...newCoupon, durationInMonths: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Redemptions (Optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={newCoupon.maxRedemptions || ''}
                  onChange={(e) => setNewCoupon({ ...newCoupon, maxRedemptions: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createCoupon}
                disabled={!newCoupon.id}
                className="flex-1 bg-gradient-to-r from-purple-500 to-cyan-500 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-600 hover:to-cyan-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Coupon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;