import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Container, Row, Col, Card, Spinner, ProgressBar, Button, ButtonGroup } from 'react-bootstrap';
import { format } from 'date-fns';

const EventAnalytics = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState(null);
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || (user.role !== 'organizer' && user.role !== 'admin' && user.role !== 'owner')) {
            toast.error('Unauthorized access');
            navigate('/');
            return;
        }
        fetchAnalytics();
        fetchEvent();
    }, [id, user]);

    const fetchAnalytics = async () => {
        try {
            const data = await eventService.getAnalytics(id);
            setAnalytics(data);
        } catch (error) {
            toast.error('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    const fetchEvent = async () => {
        try {
            const data = await eventService.getEventById(id);
            setEvent(data);
        } catch (error) {
            console.error('Failed to load event');
        }
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
            </Container>
        );
    }

    if (!analytics) {
        return (
            <Container className="py-5 text-center">
                <h3>No analytics available</h3>
            </Container>
        );
    }

    const attendanceRate = analytics.totalRegistrations > 0
        ? (analytics.totalCheckIns / analytics.totalRegistrations) * 100
        : 0;

    const feedbackRate = analytics.totalRegistrations > 0
        ? (analytics.totalFeedbacks / analytics.totalRegistrations) * 100
        : 0;

    const downloadReport = (format) => {
        if (format === 'csv') {
            downloadCSV();
        } else if (format === 'json') {
            downloadJSON();
        } else if (format === 'pdf') {
            downloadPDF();
        }
    };

    const downloadCSV = () => {
        const csvData = [
            ['Event Analytics Report'],
            ['Event', event?.title || 'N/A'],
            ['Generated', new Date().toLocaleString()],
            [''],
            ['Metric', 'Value'],
            ['Total Registrations', analytics.totalRegistrations],
            ['Total Check-ins', analytics.totalCheckIns],
            ['Total Feedbacks', analytics.totalFeedbacks],
            ['Average Rating', analytics.averageRating?.toFixed(2) || 'N/A'],
            ['Attendance Rate', `${attendanceRate.toFixed(1)}%`],
            ['Feedback Rate', `${feedbackRate.toFixed(1)}%`],
            ['Engagement Score', analytics.engagementScore?.toFixed(1) || '0'],
        ];

        const csvContent = csvData.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `event-analytics-${id}-${Date.now()}.csv`;
        link.click();
        toast.success('CSV report downloaded!');
    };

    const downloadJSON = () => {
        const reportData = {
            event: {
                id: event?._id,
                title: event?.title,
                startDateTime: event?.startDateTime,
                endDateTime: event?.endDateTime,
            },
            analytics: {
                totalRegistrations: analytics.totalRegistrations,
                totalCheckIns: analytics.totalCheckIns,
                totalFeedbacks: analytics.totalFeedbacks,
                averageRating: analytics.averageRating,
                engagementScore: analytics.engagementScore,
                attendanceRate: attendanceRate.toFixed(2),
                feedbackRate: feedbackRate.toFixed(2),
            },
            generatedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `event-analytics-${id}-${Date.now()}.json`;
        link.click();
        toast.success('JSON report downloaded!');
    };

    const downloadPDF = () => {
        // Create HTML content for PDF
        const htmlContent = `
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; }
                    h1 { color: #0d6efd; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
                    th { background-color: #0d6efd; color: white; }
                    .metric { font-weight: bold; }
                    .header { background-color: #f8f9fa; padding: 20px; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Event Analytics Report</h1>
                    <p><strong>Event:</strong> ${event?.title || 'N/A'}</p>
                    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                </div>
                <table>
                    <tr><th>Metric</th><th>Value</th></tr>
                    <tr><td class="metric">Total Registrations</td><td>${analytics.totalRegistrations}</td></tr>
                    <tr><td class="metric">Total Check-ins</td><td>${analytics.totalCheckIns}</td></tr>
                    <tr><td class="metric">Total Feedbacks</td><td>${analytics.totalFeedbacks}</td></tr>
                    <tr><td class="metric">Average Rating</td><td>${analytics.averageRating?.toFixed(2) || 'N/A'} / 5</td></tr>
                    <tr><td class="metric">Attendance Rate</td><td>${attendanceRate.toFixed(1)}%</td></tr>
                    <tr><td class="metric">Feedback Rate</td><td>${feedbackRate.toFixed(1)}%</td></tr>
                    <tr><td class="metric">Engagement Score</td><td>${analytics.engagementScore?.toFixed(1) || '0'} / 100</td></tr>
                </table>
            </body>
            </html>
        `;

        // Open print dialog
        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        toast.success('PDF report ready for printing!');
    };

    return (
        <Container className="py-4">
            <div className="mb-4 d-flex justify-content-between align-items-center">
                <div>
                    <h1>Event Analytics</h1>
                    {event && <p className="text-muted">{event.title}</p>}
                </div>
                <ButtonGroup>
                    <Button variant="success" onClick={() => downloadReport('csv')}>
                        📊 Download CSV
                    </Button>
                    <Button variant="info" onClick={() => downloadReport('json')}>
                        📄 Download JSON
                    </Button>
                    <Button variant="danger" onClick={() => downloadReport('pdf')}>
                        📑 Print/PDF
                    </Button>
                </ButtonGroup>
            </div>

            <Row>
                <Col md={3} className="mb-4">
                    <Card className="shadow-sm text-center">
                        <Card.Body>
                            <h3 className="text-primary">{analytics.totalRegistrations}</h3>
                            <p className="text-muted mb-0">Total Registrations</p>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={3} className="mb-4">
                    <Card className="shadow-sm text-center">
                        <Card.Body>
                            <h3 className="text-success">{analytics.totalCheckIns}</h3>
                            <p className="text-muted mb-0">Check-ins</p>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={3} className="mb-4">
                    <Card className="shadow-sm text-center">
                        <Card.Body>
                            <h3 className="text-info">{analytics.totalFeedbacks}</h3>
                            <p className="text-muted mb-0">Feedbacks</p>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={3} className="mb-4">
                    <Card className="shadow-sm text-center">
                        <Card.Body>
                            <h3 className="text-warning">
                                {analytics.averageRating ? analytics.averageRating.toFixed(1) : 'N/A'}
                            </h3>
                            <p className="text-muted mb-0">Avg Rating ⭐</p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col md={6} className="mb-4">
                    <Card className="shadow-sm">
                        <Card.Header className="bg-light">
                            <h5 className="mb-0">Attendance Rate</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="mb-2">
                                <strong>{attendanceRate.toFixed(1)}%</strong>
                            </div>
                            <ProgressBar
                                now={attendanceRate}
                                variant="success"
                                label={`${analytics.totalCheckIns} / ${analytics.totalRegistrations}`}
                            />
                            <small className="text-muted mt-2 d-block">
                                {analytics.totalCheckIns} participants checked in out of {analytics.totalRegistrations} registered
                            </small>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6} className="mb-4">
                    <Card className="shadow-sm">
                        <Card.Header className="bg-light">
                            <h5 className="mb-0">Feedback Rate</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="mb-2">
                                <strong>{feedbackRate.toFixed(1)}%</strong>
                            </div>
                            <ProgressBar
                                now={feedbackRate}
                                variant="info"
                                label={`${analytics.totalFeedbacks} / ${analytics.totalRegistrations}`}
                            />
                            <small className="text-muted mt-2 d-block">
                                {analytics.totalFeedbacks} feedbacks received from {analytics.totalRegistrations} participants
                            </small>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col md={12} className="mb-4">
                    <Card className="shadow-sm">
                        <Card.Header className="bg-primary text-white">
                            <h5 className="mb-0">Engagement Score</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="text-center mb-3">
                                <h1 className="display-3 text-primary">
                                    {analytics.engagementScore ? analytics.engagementScore.toFixed(1) : '0'}
                                </h1>
                                <p className="text-muted">Overall Engagement Score (0-100)</p>
                            </div>
                            <ProgressBar
                                now={analytics.engagementScore || 0}
                                variant={
                                    analytics.engagementScore >= 70 ? 'success' :
                                        analytics.engagementScore >= 40 ? 'warning' : 'danger'
                                }
                            />
                            <div className="mt-3">
                                <small className="text-muted">
                                    The engagement score is calculated based on attendance rate (50%),
                                    feedback participation (30%), and average rating (20%).
                                </small>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col md={12}>
                    <Card className="shadow-sm">
                        <Card.Header className="bg-light">
                            <h5 className="mb-0">Rating Distribution</h5>
                        </Card.Header>
                        <Card.Body>
                            {analytics.totalFeedbacks === 0 ? (
                                <p className="text-muted">No feedbacks received yet</p>
                            ) : (
                                <div>
                                    {[5, 4, 3, 2, 1].map((rating) => {
                                        const count = event?.participants?.filter(p =>
                                            p.rating === rating
                                        ).length || 0;
                                        const percentage = analytics.totalFeedbacks > 0
                                            ? (count / analytics.totalFeedbacks) * 100
                                            : 0;

                                        return (
                                            <div key={rating} className="mb-3">
                                                <div className="d-flex justify-content-between mb-1">
                                                    <span>{rating} ⭐</span>
                                                    <span>{count} ({percentage.toFixed(0)}%)</span>
                                                </div>
                                                <ProgressBar
                                                    now={percentage}
                                                    variant={rating >= 4 ? 'success' : rating >= 3 ? 'warning' : 'danger'}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default EventAnalytics;
