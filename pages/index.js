import { useState } from 'react';
import { supabase } from '../lib/supabase';

const STEPS = [
  { key: 'label_created', label: 'Label Created' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
];

export default function TrackingPage() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shipment, setShipment] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;

    setLoading(true);
    setError('');
    setShipment(null);
    setHistory([]);

    try {
      const { data: shipmentData, error: shipmentError } = await supabase
        .from('shipments')
        .select('*')
        .eq('tracking_number', trackingNumber.trim().toUpperCase())
        .single();

      if (shipmentError || !shipmentData) {
        setError('Tracking number not found. Please verify your code and try again.');
        setLoading(false);
        return;
      }

      setShipment(shipmentData);

      const { data: historyData, error: historyError } = await supabase
        .from('tracking_history')
        .select('*')
        .eq('shipment_id', shipmentData.id)
        .order('timestamp', { ascending: false });

      if (!historyError && historyData) {
        setHistory(historyData);
      }
    } catch (err) {
      setError('An unexpected error occurred while fetching tracking details.');
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = shipment
    ? STEPS.findIndex((s) => s.key === shipment.status)
    : -1;

  return (
    <div>
      <div className="hero-banner">
        <h1>Track Your Parcel in Real Time</h1>
        <p>Enter your shipment tracking ID below for live transit updates and delivery milestones.</p>
        <form onSubmit={handleTrack} className="search-box">
          <input
            type="text"
            placeholder="Enter Tracking Number (e.g., SHP-849201)"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Track Package'}
          </button>
        </form>
        {error && <div className="error">{error}</div>}
      </div>

      {shipment && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2>Tracking #{shipment.tracking_number}</h2>
            <span className={`badge ${shipment.status}`}>
              {shipment.status.replace(/_/g, ' ')}
            </span>
          </div>

          {shipment.status === 'returned' && (
            <div className="return-notice">
              <strong>Return in Progress:</strong> This package is being returned to the sender. See transit history below for scan details.
            </div>
          )}

          {shipment.status !== 'exception' && shipment.status !== 'returned' && (
            <div className="progress-tracker">
              {STEPS.map((step, index) => {
                let stateClass = '';
                if (index < currentStepIndex || shipment.status === 'delivered') {
                  stateClass = 'completed';
                } else if (index === currentStepIndex) {
                  stateClass = 'active';
                }

                return (
                  <div key={step.key} className={`progress-step ${stateClass}`}>
                    <div className="step-dot">{index + 1}</div>
                    <div className="step-label">{step.label}</div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="info-grid">
            <div className="info-item">
              <small>Sender</small>
              <span>{shipment.sender_name}</span>
            </div>
            <div className="info-item">
              <small>Recipient</small>
              <span>{shipment.recipient_name}</span>
            </div>
            <div className="info-item">
              <small>Package Weight</small>
              <span>{shipment.weight_kg} kg</span>
            </div>
            <div className="info-item">
              <small>Destination Address</small>
              <span>{shipment.recipient_address}</span>
            </div>
          </div>

          <h3>Transit History</h3>
          {history.length === 0 ? (
            <p>No tracking updates recorded yet.</p>
          ) : (
            <div className="timeline">
              {history.map((item) => (
                <div key={item.id} className="timeline-item">
                  <strong>{item.status_update.replace(/_/g, ' ').toUpperCase()}</strong> — {item.location_city_state}
                  <p>{item.description}</p>
                  <small style={{ color: '#64748b' }}>
                    {new Date(item.timestamp).toLocaleString()}
                  </small>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
