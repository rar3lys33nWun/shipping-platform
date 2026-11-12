import { useState } from 'react';
import { supabase } from '../lib/supabase';

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
        setError('Tracking number not found. Please check and try again.');
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

  return (
    <div>
      <div className="card">
        <h1>Track Your Shipment</h1>
        <form onSubmit={handleTrack} className="search-box">
          <input
            type="text"
            placeholder="Enter Tracking Number (e.g., SHP-849201)"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>
        {error && <div className="error">{error}</div>}
      </div>

      {shipment && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Tracking #{shipment.tracking_number}</h2>
            <span className="badge">{shipment.status.replace(/_/g, ' ')}</span>
          </div>

          <p><strong>Sender:</strong> {shipment.sender_name}</p>
          <p><strong>Recipient:</strong> {shipment.recipient_name}</p>
          <p><strong>Destination:</strong> {shipment.recipient_address}</p>
          <p><strong>Weight:</strong> {shipment.weight_kg} kg</p>

          <hr style={{ margin: '1.5rem 0', borderColor: '#e2e8f0' }} />

          <h3>Shipment History</h3>
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
