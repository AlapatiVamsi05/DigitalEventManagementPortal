import { useState } from 'react';
import { adminService } from '../services/adminService';

const EventReminders = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedIntervals, setSelectedIntervals] = useState([]);

    const intervals = [
        { value: 48, label: '48 hours' },
        { value: 24, label: '24 hours' },
        { value: 12, label: '12 hours' },
        { value: 6, label: '6 hours' },
        { value: 3, label: '3 hours' },
        { value: 1, label: '1 hour' },
        { value: 10 / 60, label: '10 minutes' },
        { value: 0, label: 'Live Events (happening now)' }
    ];

    const handleIntervalToggle = (value) => {
        if (selectedIntervals.includes(value)) {
            setSelectedIntervals(selectedIntervals.filter(v => v !== value));
        } else {
            setSelectedIntervals([...selectedIntervals, value]);
        }
    };

    const handleSendReminders = async () => {
        if (selectedIntervals.length === 0) {
            setError('Please select at least one time interval');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const result = await adminService.sendEventReminders(selectedIntervals);
            const totalEmails = Object.values(result.results).reduce((sum, count) => sum + count, 0);
            setSuccess(`Successfully sent ${totalEmails} reminder emails!`);
            setSelectedIntervals([]);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reminder emails');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h1>Send Event Reminder Emails</h1>
            <p style={{ color: '#666', marginBottom: '20px' }}>
                Send reminder emails to all users registered for events starting at the selected time intervals.
            </p>

            {error && (
                <div style={{
                    padding: '10px',
                    marginBottom: '20px',
                    backgroundColor: '#ffebee',
                    color: '#c62828',
                    borderRadius: '4px'
                }}>
                    {error}
                </div>
            )}

            {success && (
                <div style={{
                    padding: '10px',
                    marginBottom: '20px',
                    backgroundColor: '#e8f5e9',
                    color: '#2e7d32',
                    borderRadius: '4px'
                }}>
                    {success}
                </div>
            )}

            <div style={{ marginBottom: '20px' }}>
                <h3>Select Time Intervals:</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {intervals.map((interval) => (
                        <label
                            key={interval.value}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                backgroundColor: selectedIntervals.includes(interval.value) ? '#e3f2fd' : 'white'
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={selectedIntervals.includes(interval.value)}
                                onChange={() => handleIntervalToggle(interval.value)}
                                style={{ marginRight: '10px', cursor: 'pointer' }}
                            />
                            <span>
                                {interval.value === 0
                                    ? interval.label
                                    : `${interval.label} before event`}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            <div style={{
                padding: '15px',
                backgroundColor: '#fff3cd',
                borderRadius: '4px',
                marginBottom: '20px'
            }}>
                <strong>Note:</strong> This will send emails to all users registered for events that match the selected time intervals.
            </div>

            <button
                onClick={handleSendReminders}
                disabled={loading || selectedIntervals.length === 0}
                style={{
                    padding: '12px 24px',
                    backgroundColor: selectedIntervals.length === 0 ? '#ccc' : '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '16px',
                    cursor: selectedIntervals.length === 0 ? 'not-allowed' : 'pointer',
                    width: '100%'
                }}
            >
                {loading ? 'Sending...' : `Send Reminders (${selectedIntervals.length} intervals selected)`}
            </button>
        </div>
    );
};

export default EventReminders;
