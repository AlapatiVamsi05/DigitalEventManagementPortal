import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

const Messages = () => {
    const [deletionRequests, setDeletionRequests] = useState([]);
    const [allMessages, setAllMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('deletionRequests');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            if (activeTab === 'deletionRequests') {
                const requests = await adminService.getDeletionRequests();
                setDeletionRequests(requests);
            } else {
                const messages = await adminService.getAllMessages();
                setAllMessages(messages);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleExecuteDeletion = async (messageId) => {
        if (!window.confirm('Are you sure you want to delete this user account? This action cannot be undone.')) {
            return;
        }

        try {
            setLoading(true);
            const result = await adminService.executeDeletionRequest(messageId);
            setSuccess(`Account deleted: ${result.deletedUser.username}`);
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete account');
        } finally {
            setLoading(false);
        }
    };

    const handleDismissRequest = async (messageId) => {
        try {
            setLoading(true);
            await adminService.dismissDeletionRequest(messageId);
            setSuccess('Request dismissed');
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to dismiss request');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!window.confirm('Are you sure you want to delete this message?')) {
            return;
        }

        try {
            setLoading(true);
            await adminService.deleteMessage(messageId);
            setSuccess('Message deleted');
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete message');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1>Messages & Deletion Requests</h1>

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

            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <button
                    onClick={() => setActiveTab('deletionRequests')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: activeTab === 'deletionRequests' ? '#2196F3' : '#ccc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Deletion Requests ({deletionRequests.length})
                </button>
                <button
                    onClick={() => setActiveTab('allMessages')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: activeTab === 'allMessages' ? '#2196F3' : '#ccc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    All Messages
                </button>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <>
                    {activeTab === 'deletionRequests' && (
                        <div>
                            <h2>Account Deletion Requests</h2>
                            {deletionRequests.length === 0 ? (
                                <p>No pending deletion requests.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {deletionRequests.map((request) => (
                                        <div
                                            key={request._id}
                                            style={{
                                                border: '1px solid #ddd',
                                                borderRadius: '8px',
                                                padding: '15px',
                                                backgroundColor: '#fff3cd'
                                            }}
                                        >
                                            <div style={{ marginBottom: '10px' }}>
                                                <strong>User:</strong> {request.userId?.username} ({request.userId?.email})<br />
                                                <strong>Role:</strong> {request.userId?.role}<br />
                                                <strong>Request Type:</strong> {request.requestType?.replace('_', ' ')}<br />
                                                <strong>Submitted:</strong> {new Date(request.submittedAt).toLocaleString()}
                                            </div>
                                            <div style={{
                                                padding: '10px',
                                                backgroundColor: '#fff',
                                                borderRadius: '4px',
                                                marginBottom: '10px'
                                            }}>
                                                {request.message}
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button
                                                    onClick={() => handleExecuteDeletion(request._id)}
                                                    style={{
                                                        padding: '8px 16px',
                                                        backgroundColor: '#f44336',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Delete Account
                                                </button>
                                                <button
                                                    onClick={() => handleDismissRequest(request._id)}
                                                    style={{
                                                        padding: '8px 16px',
                                                        backgroundColor: '#9e9e9e',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Dismiss Request
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'allMessages' && (
                        <div>
                            <h2>All Messages</h2>
                            {allMessages.length === 0 ? (
                                <p>No messages found.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {allMessages.map((message) => (
                                        <div
                                            key={message._id}
                                            style={{
                                                border: '1px solid #ddd',
                                                borderRadius: '8px',
                                                padding: '15px',
                                                backgroundColor: message.type === 'account_deletion_request'
                                                    ? '#fff3cd'
                                                    : '#f5f5f5'
                                            }}
                                        >
                                            <div style={{ marginBottom: '10px' }}>
                                                <strong>User:</strong> {message.userId?.username} ({message.userId?.email})<br />
                                                <strong>Type:</strong> {message.type}<br />
                                                <strong>Status:</strong> {message.status}<br />
                                                <strong>Submitted:</strong> {new Date(message.submittedAt).toLocaleString()}
                                            </div>
                                            <div style={{
                                                padding: '10px',
                                                backgroundColor: '#fff',
                                                borderRadius: '4px',
                                                marginBottom: '10px'
                                            }}>
                                                {message.message}
                                            </div>
                                            <button
                                                onClick={() => handleDeleteMessage(message._id)}
                                                style={{
                                                    padding: '8px 16px',
                                                    backgroundColor: '#f44336',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Delete Message
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Messages;
