import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Container, Row, Col, Card, Button, Badge, Spinner } from 'react-bootstrap';
import { format } from 'date-fns';

const Home = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const data = await eventService.getAllEvents();
            // Ensure data is an array
            if (Array.isArray(data)) {
                setEvents(data);
            } else {
                console.error('Invalid data format:', data);
                setEvents([]);
                toast.error('Failed to load events - invalid data format');
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            setEvents([]);
            toast.error('Failed to load events');
        } finally {
            setLoading(false);
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
        <Container fluid className="py-4 animated-gradient-bg" style={{ minHeight: '100vh' }}>
            <div className="bg-primary text-white text-center py-5 mb-4 rounded animated-gradient-primary">
                <h1 className="display-4">Digital Event Management Portal</h1>
                <p className="lead">Discover and register for amazing events</p>
                {user && (
                    <Button
                        variant="light"
                        size="lg"
                        onClick={() => navigate('/create-event')}
                    >
                        Create Event
                    </Button>
                )}
            </div>

            <Container>
                <h2 className="mb-4">Upcoming Events</h2>

                {events.length === 0 ? (
                    <Card className="text-center py-5">
                        <Card.Body>
                            <p className="text-muted">No events available</p>
                        </Card.Body>
                    </Card>
                ) : (
                    <Row>
                        {events.map((event) => (
                            <Col md={6} lg={4} key={event._id} className="mb-4">
                                <Card className="h-100 shadow-sm">
                                    {event.imageUrl && (
                                        <Card.Img
                                            variant="top"
                                            src={event.imageUrl}
                                            alt={event.title}
                                            style={{ height: '200px', objectFit: 'cover' }}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    )}
                                    {!event.imageUrl && (
                                        <div className="bg-light d-flex align-items-center justify-content-center" style={{ height: '200px' }}>
                                            <span className="text-muted">No Image</span>
                                        </div>
                                    )}
                                    <Card.Body>
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <Card.Title className="h5">{event.title}</Card.Title>
                                            <Badge bg="success">Approved</Badge>
                                        </div>

                                        <Card.Text className="text-muted">
                                            {event.description.substring(0, 120)}...
                                        </Card.Text>

                                        <div className="mb-3">
                                            <small className="d-block mb-1">
                                                <strong>📍</strong> {event.location}
                                            </small>
                                            <small className="d-block mb-1">
                                                <strong>📅</strong> {event.startDateTime ? format(new Date(event.startDateTime), 'PPP') : 'TBA'}
                                            </small>
                                            <small className="d-block">
                                                <strong>👥</strong> {event.participants?.length || 0} registered
                                            </small>
                                        </div>

                                        <Button
                                            variant="primary"
                                            className="w-100"
                                            onClick={() => navigate(`/events/${event._id}`)}
                                        >
                                            View Details
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </Container>
        </Container>
    );
};

export default Home;
