import React, { useState } from 'react';
import { X, Upload, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { Event } from '../types';

interface UploadTicketsModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onTicketsUploaded: () => void;
}

const UploadTicketsModal: React.FC<UploadTicketsModalProps> = ({
  event,
  isOpen,
  onClose,
  onTicketsUploaded,
}) => {
  const [ticketsText, setTicketsText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Parse tickets from text (one per line)
      const tickets = ticketsText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (tickets.length === 0) {
        throw new Error('No tickets to upload');
      }

      // Validate format
      for (const ticket of tickets) {
        if (!ticket.includes(':')) {
          throw new Error(`Invalid format: "${ticket}". Expected email:password`);
        }
      }

      const response = await fetch(`/api/events/${event.id}/tickets/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ tickets }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload tickets');
      }

      const result = await response.json();
      setSuccess(result.message);
      setTicketsText('');
      onTicketsUploaded();
      
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload tickets');
    } finally {
      setLoading(false);
    }
  };

  const ticketCount = ticketsText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0).length;

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-purple-500/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center space-x-3 mb-2">
            <Upload className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Upload Tickets</h2>
          </div>
          
          <h3 className="text-lg font-semibold text-purple-300">{event.title}</h3>
          <p className="text-gray-400">{event.venue} • {event.date.toLocaleDateString()}</p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <FileText className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <h4 className="text-blue-300 font-medium mb-2">Ticket Format Instructions</h4>
                <p className="text-blue-200/80 text-sm mb-2">
                  Enter one ticket per line in the format: <code className="bg-blue-900/50 px-1 py-0.5 rounded">email:password</code>
                </p>
                <p className="text-blue-200/60 text-xs">
                  Example:<br />
                  john@example.com:password123<br />
                  jane@example.com:mypass456
                </p>
              </div>
            </div>
          </div>

          {/* Textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Tickets ({ticketCount} entered)
            </label>
            <textarea
              value={ticketsText}
              onChange={(e) => setTicketsText(e.target.value)}
              rows={12}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-mono text-sm"
              placeholder="email1@example.com:password1&#10;email2@example.com:password2&#10;email3@example.com:password3"
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              Each line should contain one ticket in email:password format
            </p>
          </div>

          {/* Validation Info */}
          {ticketCount > 0 && (
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-gray-300">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm">Ready to upload {ticketCount} tickets</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                <p className="text-green-400 text-sm">{success}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || ticketCount === 0}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Upload {ticketCount} Tickets</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadTicketsModal;