import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  // Auth State
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Create Shipment State
  const [senderName, setSenderName] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [initialLocation, setInitialLocation] = useState('');
  const [initialDateTime, setInitialDateTime] = useState('');
  const [createMsg, setCreateMsg] = useState('');

  // Update Shipment State
  const [updateTrackingNum, setUpdateTrackingNum] = useState('');
  const [newStatus, setNewStatus] = useState('in_transit');
  const [locationCityState, setLocationCityState] = useState('');
  const [description, setDescription] = useState('');
  const [customDateTime, setCustomDateTime] = useState('');
  const [updateMsg, setUpdateMsg] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const generateTrackingNumber = () => {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    return `SHP-${randomDigits}`;
  };

  const handleCreateShipment = async (e) => {
    e.preventDefault();
    setCreateMsg('');
    const trackingNumber = generateTrackingNumber();

    const shipmentPayload = {
      tracking_number: trackingNumber,
      sender_name: senderName,
      recipient_name: recipientName,
      recipient_address: recipientAddress,
      weight_kg: parseFloat(weightKg),
      status: 'label_created',
    };

    if (initialDateTime) {
      shipmentPayload.created_at = new Date(initialDateTime).toISOString();
    }

    const { data, error } = await supabase
      .from('shipments')
      .insert([shipmentPayload])
      .select()
      .single();

    if (error) {
      setCreateMsg(`Error: ${error.message}`);
      return;
    }

    const historyPayload = {
      shipment_id: data.id,
      location_city_state: initialLocation || 'Origin Facility',
      status_update: 'label_created',
      description: 'Shipping label created and shipment registered in system.',
    };

    if (initialDateTime) {
      historyPayload.timestamp = new Date(initialDateTime).toISOString();
    }

    await supabase.from('tracking_history').insert([historyPayload]);

    setCreateMsg(`Success! Created shipment with Tracking Number: ${trackingNumber}`);
    setSenderName('');
    setRecipientName('');
    setRecipientAddress('');
    setWeightKg('');
    setInitialLocation('');
    setInitialDateTime('');
  };

  const handleUpdateTracking = async (e) => {
    e.preventDefault();
    setUpdateMsg('');

    const { data: shipment, error: findError } = await supabase
      .from('shipments')
      .select('id')
      .eq('tracking_number', updateTrackingNum.trim().toUpperCase())
      .single();

    if (findError || !shipment) {
      setUpdateMsg('Error: Tracking number not found.');
      return;
    }

    const { error: updateError } = await supabase
      .from('shipments')
      .update({ status: newStatus })
      .eq('id', shipment.id);

    if (updateError) {
      setUpdateMsg(`Error updating status: ${updateError.message}`);
      return;
    }

    const historyPayload = {
      shipment_id: shipment.id,
      location_city_state: locationCityState,
      status_update: newStatus,
      description: description,
    };

    // Apply custom date and time if selected by admin
    if (customDateTime) {
      historyPayload.timestamp = new Date(customDateTime).toISOString();
    }

    const { error: historyError } = await supabase
      .from('tracking_history')
      .insert([historyPayload]);

    if (historyError) {
      setUpdateMsg(`Status updated, but failed to log history: ${historyError.message}`);
      return;
    }

    setUpdateMsg(`Tracking updated for ${updateTrackingNum.toUpperCase()}!`);
    setUpdateTrackingNum('');
    setLocationCityState('');
    setDescription('');
    setCustomDateTime('');
  };

  if (authLoading) {
    return <div className="card"><p>Checking admin session...</p></div>;
  }

  // Show Login Form if not authenticated
  if (!session) {
    return (
      <div className="card" style={{ maxWidth: '420px', margin: '2rem auto' }}>
        <h2>Admin Portal Login</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" style={{ width: '100%' }}>Sign In</button>
        </form>
        {authError && <div className="error">{authError}</div>}
      </div>
    );
  }

  // Authenticated Admin Dashboard
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span>Logged in as <strong>{session.user.email}</strong></span>
        <button onClick={handleLogout} style={{ backgroundColor: '#475569', padding: '0.5rem 1rem' }}>
          Sign Out
        </button>
      </div>

      <div className="card">
        <h2>Create New Shipment</h2>
        <form onSubmit={handleCreateShipment}>
          <div className="form-group">
            <label>Sender Name</label>
            <input value={senderName} onChange={(e) => setSenderName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Recipient Name</label>
            <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Recipient Full Address</label>
            <textarea rows="2" value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Weight (kg)</label>
            <input type="number" step="0.01" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Origin Hub (City, State)</label>
            <input placeholder="e.g., Benin City, ED" value={initialLocation} onChange={(e) => setInitialLocation(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Custom Date & Time (Optional — defaults to now)</label>
            <input
              type="datetime-local"
              value={initialDateTime}
              onChange={(e) => setInitialDateTime(e.target.value)}
            />
          </div>
          <button type="submit">Generate Label & Tracking ID</button>
        </form>
        {createMsg && <div className={createMsg.startsWith('Error') ? 'error' : 'success'}>{createMsg}</div>}
      </div>

      <div className="card">
        <h2>Post Tracking Update</h2>
        <form onSubmit={handleUpdateTracking}>
          <div className="form-group">
            <label>Tracking Number</label>
            <input placeholder="e.g., SHP-849201" value={updateTrackingNum} onChange={(e) => setUpdateTrackingNum(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>New Status</label>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              <option value="label_created">Label Created</option>
              <option value="picked_up">Picked Up</option>
              <option value="in_transit">In Transit</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="exception">Exception</option>
<option value="returned">Returned to Sender</option>
            </select>
          </div>
          <div className="form-group">
            <label>Current Location (City, State)</label>
            <input placeholder="e.g., Lagos, LA" value={locationCityState} onChange={(e) => setLocationCityState(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Scan Description</label>
            <input placeholder="e.g., Departed sorting facility" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Custom Date & Time (Optional — defaults to now)</label>
            <input
              type="datetime-local"
              value={customDateTime}
              onChange={(e) => setCustomDateTime(e.target.value)}
            />
          </div>
          <button type="submit">Update Shipment</button>
        </form>
        {updateMsg && <div className={updateMsg.startsWith('Error') ? 'error' : 'success'}>{updateMsg}</div>}
      </div>
    </div>
  );
}
