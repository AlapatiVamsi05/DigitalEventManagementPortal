import { useState, useEffect } from 'react';
import { logService } from '../services/logService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Container, Row, Col, Card, Button, Spinner, Table, Form, Badge } from 'react-bootstrap';
import { format } from 'date-fns';

const AdminLogs = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState([]);
    const [filters, setFilters] = useState({
        type: '',
        adminId: ''
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        total: 0
    });

    useEffect(() => {
        if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
            toast.error('Unauthorized access');
            return;
        }
        loadData();
    }, [user, filters, pagination.currentPage]);

    const loadData = async () => {
        setLoading(true);
        try {
            const logsData = await logService.getLogs({
                ...filters,
                page: pagination.currentPage,
                limit: 10
            });

            // Ensure we have the expected structure
            const logsArray = Array.isArray(logsData.logs) ? logsData.logs : [];
            setLogs(logsArray);

            setPagination({
                currentPage: logsData.currentPage || 1,
                totalPages: logsData.totalPages || 1,
                total: logsData.total || 0
            });

            const statsData = await logService.getLogStats();
            const statsArray = Array.isArray(statsData) ? statsData : [];
            setStats(statsArray);
        } catch (error) {
            console.error('Error loading logs:', error);
            toast.error(error.response?.data?.message || 'Failed to load logs. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters({
            ...filters,
            [e.target.name]: e.target.value
        });
        setPagination({ ...pagination, currentPage: 1 }); // Reset to first page when filters change
    };

    const handlePageChange = (newPage) => {
        setPagination({ ...pagination, currentPage: newPage });
    };

    const getLogTypeBadgeVariant = (type) => {
        switch (type) {
            case 'event_approval': return 'success';
            case 'event_deletion': return 'danger';
            case 'user_to_organizer_approval': return 'info';
            case 'user_to_admin_approval': return 'primary';
            default: return 'secondary';
        }
    };

    // Safe date formatting function
    const formatLogDate = (dateString) => {
        if (!dateString) return 'No date';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Invalid Date';
            }
            return format(date, 'PPpp');
        } catch (error) {
            return 'Invalid Date';
        }
    };

    // Safe admin info display
    const renderAdminInfo = (admin) => {
        if (!admin) return 'Unknown Admin';

        // If it's a populated user object
        if (admin.username) {
            return (
                <>
                    <div>{admin.username}</div>
                    {admin.email && <div className="small text-muted">{admin.email}</div>}
                </>
            );
        }

        // If it's just an ID
        return 'Admin User';
    };

    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
        return null;
    }

    return (
        <Container className="py-4">
            <Row className="mb-4">
                <Col>
                    <h2>Admin Activity Logs</h2>
                    <p className="text-muted">Track all administrative actions in the system</p>
                </Col>
            </Row>

            <Row className="mb-4">
                <Col md={8}>
                    <Card className="shadow">
                        <Card.Header className="bg-dark text-white">
                            <h5 className="mb-0">Log Statistics</h5>
                        </Card.Header>
                        <Card.Body>
                            {stats.length === 0 ? (
                                <p className="text-muted">No log statistics available</p>
                            ) : (
                                <Table responsive striped hover>
                                    <thead>
                                        <tr>
                                            <th>Activity Type</th>
                                            <th>Count</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.map((stat, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <Badge bg={getLogTypeBadgeVariant(stat._id)}>
                                                        {stat._id || 'Other'}
                                                    </Badge>
                                                </td>
                                                <td>{stat.count || 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="shadow">
                        <Card.Header className="bg-dark text-white">
                            <h5 className="mb-0">Filters</h5>
                        </Card.Header>
                        <Card.Body>
                            <Form>
                                <Form.Group className="mb-3">
                                    <Form.Label>Activity Type</Form.Label>
                                    <Form.Select
                                        name="type"
                                        value={filters.type}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="">All Types</option>
                                        <option value="event_approval">Event Approval</option>
                                        <option value="event_deletion">Event Deletion</option>
                                        <option value="user_to_organizer_approval">User to Organizer</option>
                                        <option value="user_to_admin_approval">User to Admin</option>
                                        <option value="other">Other</option>
                                    </Form.Select>
                                </Form.Group>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col>
                    <Card className="shadow">
                        <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Activity Logs</h5>
                            <span className="small">Total: {pagination.total}</span>
                        </Card.Header>
                        <Card.Body>
                            {loading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="primary" />
                                    <p className="mt-2">Loading logs...</p>
                                </div>
                            ) : logs.length === 0 ? (
                                <p className="text-muted">No logs found</p>
                            ) : (
                                <>
                                    <Table responsive striped hover>
                                        <thead>
                                            <tr>
                                                <th>Date & Time</th>
                                                <th>Admin</th>
                                                <th>Activity Type</th>
                                                <th>Message</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {logs.map((log) => (
                                                <tr key={log._id || log.id || Math.random()}>
                                                    <td>{formatLogDate(log.createdAt)}</td>
                                                    <td>{renderAdminInfo(log.adminId)}</td>
                                                    <td>
                                                        <Badge bg={getLogTypeBadgeVariant(log.type)}>
                                                            {log.type ? log.type.replace(/_/g, ' ') : 'Unknown'}
                                                        </Badge>
                                                    </td>
                                                    <td>{log.message || 'No message'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>

                                    {pagination.totalPages > 1 && (
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                Page {pagination.currentPage} of {pagination.totalPages}
                                            </div>
                                            <div>
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                                    disabled={pagination.currentPage === 1}
                                                    className="me-2"
                                                >
                                                    Previous
                                                </Button>
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                                    disabled={pagination.currentPage === pagination.totalPages}
                                                >
                                                    Next
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default AdminLogs;