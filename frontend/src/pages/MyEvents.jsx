import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Container, Row, Col, Card, Button, Badge, Spinner, Table } from 'react-bootstrap';
import { format } from 'date-fns';

const MyEvents = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            toast.error('Please login to view your events');
            navigate('/login');
            return;
        }
        fetchMyEvents();
    }, [user]);

    const fetchMyEvents = async () => {
        try {
            const data = await eventService.getMyEvents();
            setEvents(data);
        } catch (error) {
            toast.error('Failed to load your events');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            try {
                await eventService.deleteEvent(id);
                toast.success('Event deleted successfully');
                fetchMyEvents();
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to delete event');
            }
        }
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>My Events</h1>
                <Button
                    variant="primary"
                    onClick={() => navigate('/create-event')}
                >
                    + Create New Event
                </Button>
            </div>

            {events.length === 0 ? (
                <Card className="text-center py-5">
                    <Card.Body>
                        <h5>No events found</h5>
                        <p className="text-muted">You haven't created any events yet</p>
                        <Button
                            variant="primary"
                            onClick={() => navigate('/create-event')}
                        >
                            Create Your First Event
                        </Button>
                    </Card.Body>
                </Card>
            ) : (
                <Row>
                    {events.map((event) => (
                        <Col md={6} lg={4} key={event._id} className="mb-4">
                            <Card className="h-100 shadow-sm">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <Card.Title className="h5">{event.title}</Card.Title>
                                        <Badge bg={event.isApproved ? 'success' : 'warning'}>
                                            {event.isApproved ? 'Approved' : 'Pending'}
                                        </Badge>
                                    </div>

                                    <Card.Text className="text-muted small">
                                        {event.description.substring(0, 100)}...
                                    </Card.Text>

                                    <div className="mb-3">
                                        <small className="d-block mb-1">
                                            <strong>📅</strong> {event.startDateTime ? format(new Date(event.startDateTime), 'PPP') : 'TBA'}
                                        </small>
                                        <small className="d-block mb-1">
                                            <strong>📍</strong> {event.location}
                                        </small>
                                        <small className="d-block">
                                            <strong>👥</strong> {event.participants?.length || 0} registered
                                        </small>
                                    </div>

                                    <div className="d-grid gap-2">
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => navigate(`/events/${event._id}`)}
                                        >
                                            View Details
                                        </Button>
                                        <div className="d-flex gap-2">
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                className="flex-grow-1"
                                                onClick={() => navigate(`/events/${event._id}/edit`)}
                                                disabled={new Date(event.startDateTime) < new Date()}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline-info"
                                                size="sm"
                                                className="flex-grow-1"
                                                onClick={() => navigate(`/events/${event._id}/analytics`)}
                                            >
                                                Analytics
                                            </Button>
                                        </div>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => handleDelete(event._id)}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {events.length > 0 && (
                <Card className="mt-4">
                    <Card.Header>
                        <h5 className="mb-0">Events Summary</h5>
                    </Card.Header>
                    <Card.Body>
                        <Table responsive striped hover>
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Registrations</th>
                                    <th>Attendance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.map((event) => (
                                    <tr key={event._id}>
                                        <td>{event.title}</td>
                                        <td>
                                            <Badge bg={event.isApproved ? 'success' : 'warning'}>
                                                {event.isApproved ? 'Approved' : 'Pending'}
                                            </Badge>
                                        </td>
                                        <td>{event.startDateTime ? format(new Date(event.startDateTime), 'PP') : 'TBA'}</td>
                                        <td>{event.participants?.length || 0}</td>
                                        <td>
                                            {event.participants?.filter(p => p.attended).length || 0} / {event.participants?.length || 0}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            )}
        </Container>
    );
};

export default MyEvents;
