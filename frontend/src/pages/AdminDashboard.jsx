import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
                case 'users':
                    const users = await adminService.getAllUsers();
                    setAllUsers(users);
                    break;
                case 'organizers':
                    const orgs = await adminService.getOrganizers();
                    setOrganizers(orgs);
                    break;
                case 'admins':
                    const adms = await adminService.getAdmins();
                    setAdmins(adms);
                    break;
            }
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleApproveEvent = async (eventId) => {
        try {
            await adminService.approveEvent(eventId);
            toast.success('Event approved successfully');
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

    const getRoleBadgeVariant = (role) => {
        switch (role) {
            case 'owner': return 'danger';
            case 'admin': return 'primary';
            case 'organizer': return 'info';
            default: return 'secondary';
        }
    };

    // Filter users based on search query
    const filteredUsers = allUsers.filter(user =>
        user.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
            </Container>
        );
    }

    return (
        <Container fluid className="py-4">
            <h1 className="mb-4">Admin Dashboard</h1>

            <Nav variant="tabs" className="mb-4">
                <Nav.Item>
                    <Nav.Link
                        active={activeTab === 'pending-events'}
                        onClick={() => setActiveTab('pending-events')}
                    >
                        Pending Events
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link
                        active={activeTab === 'users'}
                        onClick={() => setActiveTab('users')}
                    >
                        All Users
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link
                        active={activeTab === 'organizers'}
                        onClick={() => setActiveTab('organizers')}
                    >
                        Organizers
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link
                        active={activeTab === 'admins'}
                        onClick={() => setActiveTab('admins')}
                    >
                        Admins
                    </Nav.Link>
                </Nav.Item>
            </Nav>

            {/* Pending Events Tab */}
            {activeTab === 'pending-events' && (
                <Card className="shadow">
                    <Card.Header className="bg-warning text-dark">
                        <h5 className="mb-0">Pending Events Approval</h5>
                    </Card.Header>
                    <Card.Body>
                        {pendingEvents.length === 0 ? (
                            <p className="text-muted">No pending events</p>
                        ) : (
                            <Table responsive striped hover>
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Host Info</th>
                                        <th>Location</th>
                                        <th>Start Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingEvents.map((event) => (
                                        <tr key={event._id}>
                                            <td>{event.title}</td>
                                            <td>
                                                <div>
                                                    <strong>{event.hostId?.username || 'N/A'}</strong>
                                                    <br />
                                                    <small className="text-muted">{event.hostId?.email || 'N/A'}</small>
                                                    <br />
                                                    {event.hostId && (
                                                        <Badge bg={getRoleBadgeVariant(event.hostId.role)} className="mt-1">
                                                            {event.hostId.role?.toUpperCase()}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td>{event.location}</td>
                                            <td>{event.startDateTime ? format(new Date(event.startDateTime), 'PP') : 'TBA'}</td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        onClick={() => handleApproveEvent(event._id)}
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        variant="warning"
                                                        size="sm"
                                                        onClick={() => handleRejectEvent(event._id)}
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
                                                    <Button
                                                        variant="info"
                                                        size="sm"
                                                        onClick={() => navigate(`/events/${event._id}`)}
                                                    >
                                                        View
                                                    </Button>
                                                </div>
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
            {activeTab === 'users' && (
                <Card className="shadow">
                    <Card.Header className="bg-primary text-white">
                        <h5 className="mb-0">All Users</h5>
                    </Card.Header>
                    <Card.Body>
                        {/* Search Box */}
                        <Form.Group className="mb-3">
                            <Form.Control
                                type="text"
                                placeholder="Search by username or email..."
                                value={userSearchQuery}
                                onChange={(e) => setUserSearchQuery(e.target.value)}
                                size="lg"
                            />
                            {userSearchQuery && (
                                <small className="text-muted">
                                    Found {filteredUsers.length} user(s)
                                </small>
                            )}
                        </Form.Group>

                        {filteredUsers.length === 0 ? (
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
                    <Card.Header className="bg-info text-white">
                        <h5 className="mb-0">Organizers</h5>
                    </Card.Header>
                    <Card.Body>
                        {organizers.length === 0 ? (
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
                    <Card.Header className="bg-dark text-white">
                        <h5 className="mb-0">Admins</h5>
                    </Card.Header>
                    <Card.Body>
                        {admins.length === 0 ? (
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

            {/* User Management Modal */}
            <Modal show={showUserModal} onHide={() => setShowUserModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>User Details & Management</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {selectedUser && (
                        <div>
                            {/* Basic Info Card */}
                            <Card className="mb-3">
                                <Card.Body>
                                    <Row>
                                        <Col md={8}>
                                            <h5>{selectedUser.username}</h5>
                                            <p className="text-muted mb-1">
                                                <strong>Email:</strong> {selectedUser.email}
                                            </p>
                                            <p className="text-muted mb-1">
                                                <strong>User ID:</strong> <small>{selectedUser._id}</small>
                                            </p>
                                            <p className="text-muted mb-1">
                                                <strong>Joined:</strong> {selectedUser.dateJoined ? format(new Date(selectedUser.dateJoined), 'PPP') : 'N/A'}
                                            </p>
                                            {selectedUser.verifiedBadge && (
                                                <Badge bg="success" className="mt-2">
                                                    ✓ Verified
                                                </Badge>
                                            )}
                                        </Col>
                                        <Col md={4} className="text-end">
                                            <Badge bg={getRoleBadgeVariant(selectedUser.role)} style={{ fontSize: '1.2rem', padding: '10px 20px' }}>
                                                {selectedUser.role.toUpperCase()}
                                            </Badge>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Bio Section */}
                            {selectedUser.bio && (
                                <Card className="mb-3">
                                    <Card.Header className="bg-light">
                                        <strong>Bio</strong>
                                    </Card.Header>
                                    <Card.Body>
                                        <p className="mb-0">{selectedUser.bio}</p>
                                    </Card.Body>
                                </Card>
                            )}

                            {/* Skills Section */}
                            {selectedUser.skills && selectedUser.skills.length > 0 && (
                                <Card className="mb-3">
                                    <Card.Header className="bg-light">
                                        <strong>Skills</strong>
                                    </Card.Header>
                                    <Card.Body>
                                        <div className="d-flex flex-wrap gap-2">
                                            {selectedUser.skills.map((skill, index) => (
                                                <Badge key={index} bg="secondary" style={{ fontSize: '0.9rem' }}>
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </Card.Body>
                                </Card>
                            )}

                            {/* Experience Section */}
                            {selectedUser.experience && selectedUser.experience.length > 0 && (
                                <Card className="mb-3">
                                    <Card.Header className="bg-light">
                                        <strong>Experience</strong>
                                    </Card.Header>
                                    <Card.Body>
                                        {selectedUser.experience.map((exp, index) => (
                                            <div key={index} className={index < selectedUser.experience.length - 1 ? 'mb-3 pb-3 border-bottom' : 'mb-0'}>
                                                <h6 className="mb-1">{exp.title}</h6>
                                                {exp.year && <small className="text-muted">Year: {exp.year}</small>}
                                                {exp.description && <p className="mb-0 mt-2">{exp.description}</p>}
                                            </div>
                                        ))}
                                    </Card.Body>
                                </Card>
                            )}

                            {/* Portfolio Links Section */}
                            {selectedUser.portfolioLinks && selectedUser.portfolioLinks.length > 0 && (
                                <Card className="mb-3">
                                    <Card.Header className="bg-light">
                                        <strong>Portfolio Links</strong>
                                    </Card.Header>
                                    <Card.Body>
                                        <ul className="list-unstyled mb-0">
                                            {selectedUser.portfolioLinks.map((link, index) => (
                                                <li key={index} className="mb-2">
                                                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-primary">
                                                        🔗 {link}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </Card.Body>
                                </Card>
                            )}

                            {/* Certifications Section */}
                            {selectedUser.certifications && selectedUser.certifications.length > 0 && (
                                <Card className="mb-3">
                                    <Card.Header className="bg-light">
                                        <strong>Certifications</strong>
                                    </Card.Header>
                                    <Card.Body>
                                        {selectedUser.certifications.map((cert, index) => (
                                            <div key={index} className={index < selectedUser.certifications.length - 1 ? 'mb-3 pb-3 border-bottom' : 'mb-0'}>
                                                <h6 className="mb-1">{cert.name}</h6>
                                                {cert.issuedBy && <p className="text-muted mb-1"><small>Issued by: {cert.issuedBy}</small></p>}
                                                {cert.proofUrl && (
                                                    <a href={cert.proofUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                                                        View Proof
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </Card.Body>
                                </Card>
                            )}

                            {/* Role Management Section */}
                            <Card className="mb-0">
                                <Card.Header className="bg-primary text-white">
                                    <strong>Role Management</strong>
                                </Card.Header>
                                <Card.Body>
                                    <div className="d-grid gap-2">
                                        {selectedUser.role === 'user' && (
                                            <>
                                                <Button
                                                    variant="primary"
                                                    onClick={() => handlePromoteToAdmin(selectedUser._id)}
                                                >
                                                    Promote to Admin
                                                </Button>
                                                <Button
                                                    variant="info"
                                                    onClick={() => handlePromoteToOrganizer(selectedUser._id)}
                                                >
                                                    Promote to Organizer
                                                </Button>
                                            </>
                                        )}
                                        {selectedUser.role === 'organizer' && (
                                            <>
                                                <Button
                                                    variant="primary"
                                                    onClick={() => handlePromoteToAdmin(selectedUser._id)}
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
                                                    disabled={user.role !== 'owner'}
                                                >
                                                    Change to Organizer
                                                </Button>
                                                <Button
                                                    variant="warning"
                                                    onClick={() => handleDemoteUser(selectedUser._id)}
                                                    disabled={user.role !== 'owner'}
                                                >
                                                    Demote to User
                                                </Button>
                                            </>
                                        )}
                                        {user.role === 'owner' && selectedUser.role !== 'owner' && (
                                            <>
                                                <hr />
                                                <Button
                                                    variant="danger"
                                                    onClick={() => handleDeleteUser(selectedUser._id)}
                                                >
                                                    Delete User
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default AdminDashboard;
