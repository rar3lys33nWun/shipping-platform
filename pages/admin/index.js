import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const [senderName, setSenderName] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [initialLocation, setInitialLocation] = useState('');
  const [createMsg, setCreateMsg] = useState('');

  const [updateTrackingNum, setUpdateTrackingNum] = useState('');
  const [newStatus, setNewStatus] = useState('in_transit');
  const [locationCityState, setLocationCityState] = useState('');
  const [description, setDescription] = useState('');
  const [updateMsg, setUpdateMsg] = useState('');

  const generateTrackingNumber = () => {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    return `SHP-${randomDigits}`;
  };

  const handleCreateShipment = async (e) => {
    e.preventDefault();
    setCreateMsg('');
    const trackingNumber = generateTrackingNumber();

    const { data, error } = await supabase
      .from('shipments')
      .insert([
        {
          tracking_number: trackingNumber,
          sender_name: senderName,
          recipient_name: recipientName,
          recipient_address: recipientAddress,
          weight_kg: parseFloat(weightKg),
          status: 'label_created',
        },
      ])
      .select()
      .single();

    if (error) {
      setCreateMsg(`Error: ${error.message}`);
      return;
    }

    await supabase.from('tracking_history').insert([
      {
        shipment_id: data.id,
        location_city_state: initialLocation || 'Origin Facility',
        status_update: 'label_created',
        description: 'Shipping label created and shipment registered in system.',
      },
    ]);

    setCreateMsg(`Success! Created shipment with Tracking Number: ${trackingNumber}`);
    setSenderName('');
    setRecipientName('');
    setRecipientAddress('');
    setWeightKg('');
    setInitialLocation('');
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

    const { error: historyError } = await supabase
      .from('tracking_history')
      .insert([
        {
          shipment_id: shipment.id,
          location_city_state: locationCityState,
          status_update: newStatus,
          description: description,
        },
      ]);

    if (historyError) {
      setUpdateMsg(`Status updated, but failed to log history: ${historyError.message}`);
      return;
    }

    setUpdateMsg(`Tracking updated for ${updateTrackingNum.toUpperCase()}!`);
    setUpdateTrackingNum('');
    setLocationCityState('');
    setDescription('');
  };

  return (
    <div>
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
            <input placeholder="e.g., Lagos, LA" value={initialLocation} onChange={(e) => setInitialLocation(e.target.value)} required />
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
            </select>
          </div>
          <div className="form-group">
            <label>Current Location (City, State)</label>
            <input placeholder="e.g., Warri, DE" value={locationCityState} onChange={(e) => setLocationCityState(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Scan Description</label>
            <input placeholder="e.g., Arrived at regional sorting facility" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <button type="submit">Update Shipment</button>
        </form>
        {updateMsg && <div className={updateMsg.startsWith('Error') ? 'error' : 'success'}>{updateMsg}</div>}
      </div>
    </div>
  );
}
