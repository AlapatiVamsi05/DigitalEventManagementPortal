import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';

const CreateEditEvent = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [eventStarted, setEventStarted] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        imageUrl: '',
        startDateTime: '',
        endDateTime: '',
        regEndDateTime: '', // Changed from registrationDeadline to regEndDateTime
        tags: ''
    });

    useEffect(() => {
        if (!user) {
            toast.error('Please login to create/edit events');
            navigate('/login');
            return;
        }
        if (id) {
            fetchEvent();
        }
    }, [id, user]);

    const fetchEvent = async () => {
        try {
            const data = await eventService.getEventById(id);
            const started = new Date(data.startDateTime) < new Date();
            setEventStarted(started);
            setFormData({
                title: data.title,
                description: data.description,
                location: data.location,
                imageUrl: data.imageUrl || '',
                startDateTime: new Date(data.startDateTime).toISOString().slice(0, 16),
                endDateTime: new Date(data.endDateTime).toISOString().slice(0, 16),
                regEndDateTime: new Date(data.regEndDateTime || data.registrationDeadline).toISOString().slice(0, 16), // Changed field name
                tags: data.tags?.join(', ') || ''
            });

            // If event has started, show a warning
            if (started) {
                toast.info('Note: Event has already started. Only image and description can be updated.');
            }
        } catch (error) {
            toast.error('Failed to load event');
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const eventData = {
            ...formData,
            tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        };

        try {
            if (id) {
                await eventService.updateEvent(id, eventData);
                toast.success('Event updated successfully!');
            } else {
                const response = await eventService.createEvent(eventData);
                toast.success(response.message);
            }
            navigate('/my-events');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-4">
            <Row className="justify-content-center">
                <Col lg={8}>
                    <Card className="shadow">
                        <Card.Header className="bg-primary text-white">
                            <h2 className="mb-0">{id ? 'Edit Event' : 'Create New Event'}</h2>
                        </Card.Header>
                        <Card.Body>
                            {eventStarted && (
                                <Alert variant="warning">
                                    <strong>Note:</strong> This event has already started. Only the image and description can be updated.
                                </Alert>
                            )}
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Event Title *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                        placeholder="Enter event title"
                                        disabled={eventStarted}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Description *</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={4}
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        required
                                        placeholder="Describe your event"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Location *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        required
                                        placeholder="Event venue or online link"
                                        disabled={eventStarted}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Event Image URL</Form.Label>
                                    <Form.Control
                                        type="url"
                                        name="imageUrl"
                                        value={formData.imageUrl}
                                        onChange={handleChange}
                                        placeholder="https://example.com/event-image.jpg"
                                    />
                                    <Form.Text className="text-muted">
                                        Paste a URL to an event banner/poster image
                                    </Form.Text>
                                    <div className="mt-2">
                                        {formData.imageUrl ? (
                                            <img
                                                src={formData.imageUrl}
                                                alt="Event preview"
                                                style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div className="bg-light d-flex align-items-center justify-content-center" style={{ height: '200px' }}>
                                                <span className="text-muted">Image preview will appear here</span>
                                            </div>
                                        )}
                                    </div>
                                </Form.Group>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Start Date & Time *</Form.Label>
                                            <Form.Control
                                                type="datetime-local"
                                                name="startDateTime"
                                                value={formData.startDateTime}
                                                onChange={handleChange}
                                                required
                                                disabled={eventStarted}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>End Date & Time *</Form.Label>
                                            <Form.Control
                                                type="datetime-local"
                                                name="endDateTime"
                                                value={formData.endDateTime}
                                                onChange={handleChange}
                                                required
                                                disabled={eventStarted}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Label>Registration End Date & Time *</Form.Label> {/* Updated label */}
                                    <Form.Control
                                        type="datetime-local"
                                        name="regEndDateTime" // Changed from registrationDeadline to regEndDateTime
                                        value={formData.regEndDateTime}
                                        onChange={handleChange}
                                        required
                                        disabled={eventStarted}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label>Tags</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="tags"
                                        value={formData.tags}
                                        onChange={handleChange}
                                        placeholder="workshop, tech, networking (comma separated)"
                                        disabled={eventStarted}
                                    />
                                    <Form.Text className="text-muted">
                                        Separate tags with commas
                                    </Form.Text>
                                </Form.Group>

                                <div className="d-flex gap-2">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={loading}
                                        className="flex-grow-1"
                                    >
                                        {loading ? (
                                            <><Spinner animation="border" size="sm" /> Processing...</>
                                        ) : (
                                            id ? 'Update Event' : 'Create Event'
                                        )}
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => navigate(-1)}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default CreateEditEvent;