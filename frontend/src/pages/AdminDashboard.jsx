import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Container, Row, Col, Card, Button, Badge, Spinner, Table, Nav, Modal, Form } from 'react-bootstrap';
import { format } from 'date-fns';

const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('pending-events');
    const [loading, setLoading] = useState(true);

    // State for different data
    const [pendingEvents, setPendingEvents] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [organizers, setOrganizers] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [userSearchQuery, setUserSearchQuery] = useState('');

    // Modal states
    const [showUserModal, setShowUserModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
            toast.error('Unauthorized access');
            navigate('/');
            return;
        }
        loadData();
    }, [user, activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            switch (activeTab) {
                case 'pending-events':
                    const events = await adminService.getPendingEvents();
                    setPendingEvents(events);
                    break;
                case 'all-users':
                    const users = await adminService.getAllUsers();
                    setAllUsers(users);
                    break;
                case 'organizers':
                    const orgs = await adminService.getOrganizers();
                    setOrganizers(orgs);
                    break;
                case 'admins':
                    const adminUsers = await adminService.getAdmins();
                    setAdmins(adminUsers);
                    break;
                default:
                    break;
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleApproveEvent = async (eventId) => {
        try {
            await adminService.approveEvent(eventId);
            toast.success('Event approved');
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to approve event');
        }
    };

    const handleRejectEvent = async (eventId) => {
        try {
            await adminService.rejectEvent(eventId);
            toast.success('Event rejected');
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reject event');
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            try {
                await adminService.deleteEvent(eventId);
                toast.success('Event deleted successfully');
                loadData();
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to delete event');
            }
        }
    };

    const handlePromoteToAdmin = async (userId) => {
        try {
            await adminService.promoteToAdmin(userId);
            toast.success('User promoted to admin');
            loadData();
            setShowUserModal(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to promote user');
        }
    };

    const handlePromoteToOrganizer = async (userId) => {
        try {
            await adminService.promoteToOrganizer(userId);
            toast.success('User promoted to organizer');
            loadData();
            setShowUserModal(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to promote user');
        }
    };

    const handleDemoteUser = async (userId) => {
        try {
            await adminService.demoteUser(userId);
            toast.success('User demoted successfully');
            loadData();
            setShowUserModal(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to demote user');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            try {
                await adminService.deleteUser(userId);
                toast.success('User deleted successfully');
                loadData();
                setShowUserModal(false);
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to delete user');
            }
        }
    };

    const openUserModal = (userObj) => {
        setSelectedUser(userObj);
        setShowUserModal(true);
    };

    const filteredUsers = allUsers.filter(user =>
        user.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
    );

    const getRoleBadgeVariant = (role) => {
        switch (role) {
            case 'owner': return 'danger';
            case 'admin': return 'primary';
            case 'organizer': return 'success';
            default: return 'secondary';
        }
    };

    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
        return null;
    }

    return (
        <Container className="py-4">
            <Row className="mb-4">
                <Col>
                    <h2>Admin Dashboard</h2>
                    <p className="text-muted">Manage events and users</p>
                </Col>
            </Row>

            <Row>
                <Col>
                    <Card className="shadow">
                        <Card.Header className="bg-dark text-white">
                            <Nav variant="tabs" defaultActiveKey={activeTab} onSelect={(key) => setActiveTab(key)}>
                                <Nav.Item>
                                    <Nav.Link eventKey="pending-events" className="text-white">Pending Events</Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="all-users" className="text-white">All Users</Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="organizers" className="text-white">Organizers</Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="admins" className="text-white">Admins</Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="logs" as={Link} to="/admin/logs" className="text-white">Activity Logs</Nav.Link>
                                </Nav.Item>
                            </Nav>
                        </Card.Header>
                        <Card.Body>
                            {/* Pending Events Tab */}
                            {activeTab === 'pending-events' && (
                                <Card className="shadow">
                                    <Card.Header className="bg-primary text-white">
                                        <h5 className="mb-0">Pending Events</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        {loading ? (
                                            <div className="text-center py-5">
                                                <Spinner animation="border" variant="primary" />
                                                <p className="mt-2">Loading pending events...</p>
                                            </div>
                                        ) : pendingEvents.length === 0 ? (
                                            <p className="text-muted">No pending events</p>
                                        ) : (
                                            <Table responsive striped hover>
                                                <thead>
                                                    <tr>
                                                        <th>Title</th>
                                                        <th>Host</th>
                                                        <th>Date</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {pendingEvents.map((event) => (
                                                        <tr key={event._id}>
                                                            <td>{event.title}</td>
                                                            <td>
                                                                {event.hostId ? (
                                                                    <>
                                                                        <div>{event.hostId.username}</div>
                                                                        <div className="small text-muted">{event.hostId.email}</div>
                                                                    </>
                                                                ) : 'Unknown'}
                                                            </td>
                                                            <td>{format(new Date(event.startDateTime), 'PP')}</td>
                                                            <td>
                                                                <Button
                                                                    variant="success"
                                                                    size="sm"
                                                                    onClick={() => handleApproveEvent(event._id)}
                                                                    className="me-2"
                                                                >
                                                                    Approve
                                                                </Button>
                                                                <Button
                                                                    variant="warning"
                                                                    size="sm"
                                                                    onClick={() => handleRejectEvent(event._id)}
                                                                    className="me-2"
                                                                >
                                                                    Reject
                                                                </Button>
                                                                <Button
                                                                    variant="danger"
                                                                    size="sm"
                                                                    onClick={() => handleDeleteEvent(event._id)}
                                                                >
                                                                    Delete
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        )}
                                    </Card.Body>
                                </Card>
                            )}

                            {/* All Users Tab */}
                            {activeTab === 'all-users' && (
                                <Card className="shadow">
                                    <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                                        <h5 className="mb-0">All Users</h5>
                                        <Form.Control
                                            type="text"
                                            placeholder="Search users..."
                                            value={userSearchQuery}
                                            onChange={(e) => setUserSearchQuery(e.target.value)}
                                            style={{ width: '300px' }}
                                        />
                                    </Card.Header>
                                    <Card.Body>
                                        {loading ? (
                                            <div className="text-center py-5">
                                                <Spinner animation="border" variant="primary" />
                                                <p className="mt-2">Loading users...</p>
                                            </div>
                                        ) : filteredUsers.length === 0 ? (
                                            <p className="text-muted">
                                                {userSearchQuery ? 'No users found matching your search' : 'No users found'}
                                            </p>
                                        ) : (
                                            <Table responsive striped hover>
                                                <thead>
                                                    <tr>
                                                        <th>Username</th>
                                                        <th>Email</th>
                                                        <th>Role</th>
                                                        <th>Joined</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredUsers.map((userItem) => (
                                                        <tr key={userItem._id}>
                                                            <td>{userItem.username}</td>
                                                            <td>{userItem.email}</td>
                                                            <td>
                                                                <Badge bg={getRoleBadgeVariant(userItem.role)}>
                                                                    {userItem.role.toUpperCase()}
                                                                </Badge>
                                                            </td>
                                                            <td>{userItem.dateJoined ? format(new Date(userItem.dateJoined), 'PP') : 'N/A'}</td>
                                                            <td>
                                                                <Button
                                                                    variant="outline-primary"
                                                                    size="sm"
                                                                    onClick={() => openUserModal(userItem)}
                                                                    disabled={userItem.role === 'owner'}
                                                                >
                                                                    Manage
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        )}
                                    </Card.Body>
                                </Card>
                            )}

                            {/* Organizers Tab */}
                            {activeTab === 'organizers' && (
                                <Card className="shadow">
                                    <Card.Header className="bg-primary text-white">
                                        <h5 className="mb-0">Organizers</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        {loading ? (
                                            <div className="text-center py-5">
                                                <Spinner animation="border" variant="primary" />
                                                <p className="mt-2">Loading organizers...</p>
                                            </div>
                                        ) : organizers.length === 0 ? (
                                            <p className="text-muted">No organizers found</p>
                                        ) : (
                                            <Row>
                                                {organizers.map((org) => (
                                                    <Col md={4} key={org._id} className="mb-3">
                                                        <Card>
                                                            <Card.Body>
                                                                <Card.Title>{org.username}</Card.Title>
                                                                <Card.Text className="text-muted small">
                                                                    {org.email}
                                                                </Card.Text>
                                                                <Button
                                                                    variant="outline-primary"
                                                                    size="sm"
                                                                    onClick={() => openUserModal(org)}
                                                                >
                                                                    Manage
                                                                </Button>
                                                            </Card.Body>
                                                        </Card>
                                                    </Col>
                                                ))}
                                            </Row>
                                        )}
                                    </Card.Body>
                                </Card>
                            )}

                            {/* Admins Tab */}
                            {activeTab === 'admins' && (
                                <Card className="shadow">
                                    <Card.Header className="bg-primary text-white">
                                        <h5 className="mb-0">Admins</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        {loading ? (
                                            <div className="text-center py-5">
                                                <Spinner animation="border" variant="primary" />
                                                <p className="mt-2">Loading admins...</p>
                                            </div>
                                        ) : admins.length === 0 ? (
                                            <p className="text-muted">No admins found</p>
                                        ) : (
                                            <Row>
                                                {admins.map((admin) => (
                                                    <Col md={4} key={admin._id} className="mb-3">
                                                        <Card>
                                                            <Card.Body>
                                                                <Card.Title>{admin.username}</Card.Title>
                                                                <Card.Text className="text-muted small">
                                                                    {admin.email}
                                                                </Card.Text>
                                                                {user.role === 'owner' && (
                                                                    <Button
                                                                        variant="outline-primary"
                                                                        size="sm"
                                                                        onClick={() => openUserModal(admin)}
                                                                    >
                                                                        Manage
                                                                    </Button>
                                                                )}
                                                            </Card.Body>
                                                        </Card>
                                                    </Col>
                                                ))}
                                            </Row>
                                        )}
                                    </Card.Body>
                                </Card>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* User Management Modal */}
            <Modal show={showUserModal} onHide={() => setShowUserModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>User Management</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedUser && (
                        <div>
                            <Row>
                                <Col md={6}>
                                    <h5>User Details</h5>
                                    <p><strong>Username:</strong> {selectedUser.username}</p>
                                    <p><strong>Email:</strong> {selectedUser.email}</p>
                                    <p><strong>Role:</strong>
                                        <Badge bg={getRoleBadgeVariant(selectedUser.role)} className="ms-2">
                                            {selectedUser.role.toUpperCase()}
                                        </Badge>
                                    </p>
                                    <p><strong>Joined:</strong> {selectedUser.dateJoined ? format(new Date(selectedUser.dateJoined), 'PP') : 'N/A'}</p>
                                </Col>
                                <Col md={6}>
                                    <h5>Actions</h5>
                                    {selectedUser.role === 'user' && (
                                        <>
                                            <Button
                                                variant="success"
                                                onClick={() => handlePromoteToOrganizer(selectedUser._id)}
                                                className="me-2 mb-2"
                                            >
                                                Promote to Organizer
                                            </Button>
                                            <Button
                                                variant="primary"
                                                onClick={() => handlePromoteToAdmin(selectedUser._id)}
                                            >
                                                Promote to Admin
                                            </Button>
                                        </>
                                    )}
                                    {selectedUser.role === 'organizer' && (
                                        <>
                                            <Button
                                                variant="primary"
                                                onClick={() => handlePromoteToAdmin(selectedUser._id)}
                                                className="me-2 mb-2"
                                            >
                                                Promote to Admin
                                            </Button>
                                            <Button
                                                variant="warning"
                                                onClick={() => handleDemoteUser(selectedUser._id)}
                                            >
                                                Demote to User
                                            </Button>
                                        </>
                                    )}
                                    {selectedUser.role === 'admin' && (
                                        <>
                                            <Button
                                                variant="info"
                                                onClick={() => handlePromoteToOrganizer(selectedUser._id)}
                                                className="me-2 mb-2"
                                                disabled={user.role !== 'owner'}
                                            >
                                                Demote to Organizer
                                            </Button>
                                            <Button
                                                variant="warning"
                                                onClick={() => handleDemoteUser(selectedUser._id)}
                                                className="me-2 mb-2"
                                                disabled={user.role !== 'owner'}
                                            >
                                                Demote to User
                                            </Button>
                                            <Button
                                                variant="danger"
                                                onClick={() => handleDeleteUser(selectedUser._id)}
                                                disabled={user.role !== 'owner'}
                                            >
                                                Delete User
                                            </Button>
                                        </>
                                    )}
                                </Col>
                            </Row>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowUserModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default AdminDashboard;