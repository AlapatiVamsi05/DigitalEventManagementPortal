import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Container, Row, Col, Card, Button, Badge, Modal, Form, Spinner, ListGroup, ProgressBar } from 'react-bootstrap';
import { format } from 'date-fns';

const EventDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [showCheckinModal, setShowCheckinModal] = useState(false);
    const [feedbackData, setFeedbackData] = useState({ rating: 5, comment: '' });
    const [otp, setOtp] = useState('');
    const [generatedOTP, setGeneratedOTP] = useState('');
    const [isRegistered, setIsRegistered] = useState(false);

    useEffect(() => {
        fetchEventDetails();
        fetchFeedbacks();
    }, [id]);

    useEffect(() => {
        if (event && user) {
            const registered = event.participants?.some(p => p.userId === user._id);
            setIsRegistered(registered);
        }
    }, [event, user]);

    const fetchEventDetails = async () => {
        try {
            const data = await eventService.getEventById(id);
            setEvent(data);
        } catch (error) {
            toast.error('Failed to load event details');
        } finally {
            setLoading(false);
        }
    };

    const fetchFeedbacks = async () => {
        try {
            const data = await eventService.getFeedbacks(id);
            setFeedbacks(data);
        } catch (error) {
            console.error('Failed to load feedbacks');
        }
    };

    const handleRegister = async () => {
        if (!user) {
            toast.error('Please login to register');
            navigate('/login');
            return;
        }
        try {
            const response = await eventService.registerForEvent(id);
            toast.success(response.message);
            fetchEventDetails();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
        }
    };

    const handleGenerateOTP = async () => {
        try {
            const response = await eventService.generateOTP(id);
            setGeneratedOTP(response.otp);
            setShowOTPModal(true);
            toast.success('OTP generated successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate OTP');
        }
    };

    const handleCheckIn = async () => {
        try {
            await eventService.checkIn(id, otp);
            toast.success('Check-in successful!');
            setShowCheckinModal(false);
            setOtp('');
            fetchEventDetails();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Check-in failed');
        }
    };

    const handleSubmitFeedback = async (e) => {
        e.preventDefault();
        try {
            await eventService.submitFeedback(id, feedbackData.rating, feedbackData.comment);
            toast.success('Feedback submitted successfully!');
            setShowFeedbackModal(false);
            setFeedbackData({ rating: 5, comment: '' });
            fetchFeedbacks();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit feedback');
        }
    };

    const handleDeleteEvent = async () => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            try {
                await eventService.deleteEvent(id);
                toast.success('Event deleted successfully');
                navigate('/');
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to delete event');
            }
        }
    };

    const isHost = user && event && event.hostId === user._id;
    const isAdmin = user && (user.role === 'admin' || user.role === 'owner');
    const eventEnded = event && new Date(event.endDateTime) < new Date();
    const eventStarted = event && new Date(event.startDateTime) < new Date();

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
            </Container>
        );
    }

    if (!event) {
        return (
            <Container className="py-5 text-center">
                <h3>Event not found</h3>
                <Button variant="primary" onClick={() => navigate('/')}>Go Home</Button>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <Row>
                <Col lg={8}>
                    <Card className="shadow mb-4">
                        {event.imageUrl && (
                            <Card.Img
                                variant="top"
                                src={event.imageUrl}
                                alt={event.title}
                                style={{ maxHeight: '400px', objectFit: 'cover' }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        )}
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <h1 className="h2">{event.title}</h1>
                                    <Badge bg={event.isApproved ? 'success' : 'warning'} className="mb-2">
                                        {event.isApproved ? 'Approved' : 'Pending Approval'}
                                    </Badge>
                                </div>
                                {(isHost || isAdmin) && (
                                    <div className="d-flex gap-2">
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => navigate(`/events/${id}/edit`)}
                                            disabled={eventStarted}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={handleDeleteEvent}
                                        >
                                            Delete
                                        </Button>
                                        {(isHost || isAdmin) && (
                                            <Button
                                                variant="outline-info"
                                                size="sm"
                                                onClick={() => navigate(`/events/${id}/analytics`)}
                                            >
                                                Analytics
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <p className="text-muted">{event.description}</p>

                            <ListGroup variant="flush" className="mb-3">
                                <ListGroup.Item>
                                    <strong>📍 Location:</strong> {event.location}
                                </ListGroup.Item>
                                <ListGroup.Item>
                                    <strong>📅 Start:</strong> {event.startDateTime ? format(new Date(event.startDateTime), 'PPP p') : 'N/A'}
                                </ListGroup.Item>
                                <ListGroup.Item>
                                    <strong>🕐 End:</strong> {event.endDateTime ? format(new Date(event.endDateTime), 'PPP p') : 'N/A'}
                                </ListGroup.Item>
                                <ListGroup.Item>
                                    <strong>👥 Participants:</strong> {event.participants?.length || 0} registered
                                </ListGroup.Item>
                                <ListGroup.Item>
                                    <strong>📝 Registration Deadline:</strong> {event.registrationDeadline ? format(new Date(event.registrationDeadline), 'PPP') : 'N/A'}
                                </ListGroup.Item>
                                {event.tags && event.tags.length > 0 && (
                                    <ListGroup.Item>
                                        <strong>🏷️ Tags:</strong>{' '}
                                        {event.tags.map((tag, idx) => (
                                            <Badge key={idx} bg="secondary" className="me-1">{tag}</Badge>
                                        ))}
                                    </ListGroup.Item>
                                )}
                            </ListGroup>
                        </Card.Body>
                    </Card>

                    {/* Feedbacks Section */}
                    <Card className="shadow">
                        <Card.Header className="bg-light">
                            <h5 className="mb-0">Feedbacks</h5>
                        </Card.Header>
                        <Card.Body>
                            {feedbacks.length === 0 ? (
                                <p className="text-muted">No feedbacks yet</p>
                            ) : (
                                <div>
                                    {feedbacks.map((feedback, idx) => (
                                        <div key={idx} className="border-bottom pb-3 mb-3">
                                            <div className="d-flex justify-content-between">
                                                <strong>Rating: {feedback.rating}/5 ⭐</strong>
                                                <small className="text-muted">
                                                    {format(new Date(feedback.createdAt), 'PPP')}
                                                </small>
                                            </div>
                                            <p className="mb-0 mt-2">{feedback.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={4}>
                    <Card className="shadow mb-3">
                        <Card.Body>
                            <h5 className="mb-3">Actions</h5>

                            {!user ? (
                                <Button
                                    variant="primary"
                                    className="w-100 mb-2"
                                    onClick={() => navigate('/login')}
                                >
                                    Login to Register
                                </Button>
                            ) : (
                                <>
                                    {!isRegistered ? (
                                        <Button
                                            variant="primary"
                                            className="w-100 mb-2"
                                            onClick={handleRegister}
                                            disabled={new Date(event.registrationDeadline) < new Date() || !event.isApproved}
                                        >
                                            Register for Event
                                        </Button>
                                    ) : (
                                        <Badge bg="success" className="w-100 p-2 mb-2">✓ Registered</Badge>
                                    )}

                                    {isRegistered && (
                                        <Button
                                            variant="outline-primary"
                                            className="w-100 mb-2"
                                            onClick={() => setShowCheckinModal(true)}
                                            disabled={!eventStarted || eventEnded}
                                        >
                                            Check In
                                        </Button>
                                    )}

                                    {isRegistered && eventEnded && (
                                        <Button
                                            variant="outline-success"
                                            className="w-100 mb-2"
                                            onClick={() => setShowFeedbackModal(true)}
                                        >
                                            Submit Feedback
                                        </Button>
                                    )}

                                    {(isHost || isAdmin) && (
                                        <Button
                                            variant="outline-warning"
                                            className="w-100 mb-2"
                                            onClick={handleGenerateOTP}
                                            disabled={!eventStarted || eventEnded}
                                        >
                                            Generate OTP
                                        </Button>
                                    )}
                                </>
                            )}
                        </Card.Body>
                    </Card>

                    {event.participants && event.participants.length > 0 && (
                        <Card className="shadow">
                            <Card.Header className="bg-light">
                                <h6 className="mb-0">Attendance</h6>
                            </Card.Header>
                            <Card.Body>
                                <div className="mb-2">
                                    <small>Checked In: {event.participants.filter(p => p.attended).length} / {event.participants.length}</small>
                                </div>
                                <ProgressBar
                                    now={(event.participants.filter(p => p.attended).length / event.participants.length) * 100}
                                    variant="success"
                                />
                            </Card.Body>
                        </Card>
                    )}
                </Col>
            </Row>

            {/* Feedback Modal */}
            <Modal show={showFeedbackModal} onHide={() => setShowFeedbackModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Submit Feedback</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmitFeedback}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Rating</Form.Label>
                            <Form.Select
                                value={feedbackData.rating}
                                onChange={(e) => setFeedbackData({ ...feedbackData, rating: parseInt(e.target.value) })}
                            >
                                <option value={5}>5 - Excellent</option>
                                <option value={4}>4 - Good</option>
                                <option value={3}>3 - Average</option>
                                <option value={2}>2 - Poor</option>
                                <option value={1}>1 - Very Poor</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Comment</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={feedbackData.comment}
                                onChange={(e) => setFeedbackData({ ...feedbackData, comment: e.target.value })}
                                placeholder="Share your experience..."
                                required
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowFeedbackModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            Submit Feedback
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* OTP Display Modal */}
            <Modal show={showOTPModal} onHide={() => setShowOTPModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Event OTP</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center">
                    <h2 className="display-4 text-primary">{generatedOTP}</h2>
                    <p className="text-muted">Share this OTP with participants for check-in</p>
                    <small className="text-danger">Valid for 15 minutes</small>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowOTPModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Check-in Modal */}
            <Modal show={showCheckinModal} onHide={() => setShowCheckinModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Check In</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Enter OTP</Form.Label>
                        <Form.Control
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Enter 6-digit OTP"
                            maxLength={6}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCheckinModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleCheckIn} disabled={otp.length !== 6}>
                        Check In
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default EventDetails;
