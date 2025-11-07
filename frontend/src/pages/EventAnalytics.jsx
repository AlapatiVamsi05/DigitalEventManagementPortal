import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Container, Row, Col, Card, Spinner, ProgressBar, Button, ButtonGroup, Badge } from 'react-bootstrap';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const EventAnalytics = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState(null);
    const [event, setEvent] = useState(null);
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEventCompleted, setIsEventCompleted] = useState(false);
    const [isCalculating, setIsCalculating] = useState(false);

    useEffect(() => {
        if (!user) {
            toast.error('Please login to view analytics');
            navigate('/login');
            return;
        }
        loadEventAndAnalytics();
    }, [id, user]);

    const loadEventAndAnalytics = async () => {
        try {
            // Fetch event details first
            const eventData = await eventService.getEventById(id);
            setEvent(eventData);

            // Check if event has ended
            const eventEndDate = new Date(eventData.endDateTime);
            const now = new Date();
            const eventCompleted = now > eventEndDate;
            setIsEventCompleted(eventCompleted);

            // Fetch feedbacks for rating distribution
            try {
                const feedbackData = await eventService.getFeedbacks(id);
                setFeedbacks(feedbackData);
            } catch (feedbackError) {
                console.log('No feedbacks found');
                setFeedbacks([]);
            }

            // Try to fetch analytics
            try {
                const analyticsData = await eventService.getAnalytics(id);
                setAnalytics(analyticsData);
            } catch (analyticsError) {
                // Analytics not found - check if event is completed
                if (analyticsError.response?.status === 404) {
                    if (eventCompleted) {
                        // Event completed but no analytics - calculate them
                        await calculateAnalytics();
                    } else {
                        // Event not completed yet
                        setAnalytics(null);
                    }
                } else {
                    throw analyticsError;
                }
            }
        } catch (error) {
            toast.error('Failed to load event data');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const calculateAnalytics = async () => {
        setIsCalculating(true);
        try {
            const result = await eventService.updateAnalytics(id);
            setAnalytics(result.analytics);

            // Refetch feedbacks after recalculation
            try {
                const feedbackData = await eventService.getFeedbacks(id);
                setFeedbacks(feedbackData);
            } catch (error) {
                setFeedbacks([]);
            }

            toast.success('Analytics calculated successfully');
        } catch (error) {
            toast.error('Failed to calculate analytics');
            console.error(error);
        } finally {
            setIsCalculating(false);
        }
    };

    const handleRecalculate = async () => {
        if (window.confirm('Are you sure you want to recalculate the analytics? This will update all metrics based on current data.')) {
            await calculateAnalytics();
        }
    };

    // Check if user can recalculate (host, admin, or owner)
    const canRecalculate = () => {
        if (!user || !event) return false;
        const isHost = event.hostId === user._id || event.hostId._id === user._id;
        const isAdmin = user.role === 'admin';
        const isOwner = user.role === 'owner';
        return isHost || isAdmin || isOwner;
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Loading analytics...</p>
            </Container>
        );
    }

    if (isCalculating) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="success" />
                <p className="mt-3">Calculating analytics...</p>
            </Container>
        );
    }

    if (!analytics) {
        return (
            <Container className="py-5 text-center">
                <Card className="shadow-sm">
                    <Card.Body className="p-5">
                        {!isEventCompleted ? (
                            <>
                                <h3 className="text-warning mb-3">⏳ Event Not Completed Yet</h3>
                                <p className="text-muted mb-4">
                                    Analytics will be available after the event ends on{' '}
                                    {event && format(new Date(event.endDateTime), 'PPP p')}
                                </p>
                                <Button variant="secondary" onClick={() => navigate(-1)}>
                                    Go Back
                                </Button>
                            </>
                        ) : (
                            <>
                                <h3 className="text-info mb-3">📊 Analytics Not Available</h3>
                                <p className="text-muted mb-4">
                                    No analytics have been generated for this event yet.
                                </p>
                                <Button variant="primary" onClick={calculateAnalytics}>
                                    Calculate Analytics Now
                                </Button>
                            </>
                        )}
                    </Card.Body>
                </Card>
            </Container>
        );
    }

    const attendanceRate = analytics.totalRegistrations > 0
        ? (analytics.totalCheckIns / analytics.totalRegistrations) * 100
        : 0;

    const feedbackRate = analytics.totalRegistrations > 0
        ? (analytics.totalFeedbacks / analytics.totalRegistrations) * 100
        : 0;

    // Data for visualizations
    const COLORS = ['#0d6efd', '#6c757d', '#28a745', '#ffc107', '#dc3545'];

    const participationData = [
        { name: 'Checked In', value: analytics.totalCheckIns, color: '#28a745' },
        { name: 'Not Attended', value: analytics.totalRegistrations - analytics.totalCheckIns, color: '#dc3545' },
    ];

    const engagementData = [
        { name: 'Registrations', value: analytics.totalRegistrations },
        { name: 'Check-ins', value: analytics.totalCheckIns },
        { name: 'Feedbacks', value: analytics.totalFeedbacks },
    ];

    const metricsRadarData = [
        { metric: 'Attendance', value: attendanceRate, fullMark: 100 },
        { metric: 'Feedback', value: feedbackRate, fullMark: 100 },
        { metric: 'Rating', value: (analytics.averageRating / 5) * 100, fullMark: 100 },
        { metric: 'Engagement', value: analytics.engagementScore, fullMark: 100 },
    ];

    // Rating distribution data for chart
    const ratingDistributionData = [5, 4, 3, 2, 1].map(rating => {
        const count = feedbacks.filter(f => f.rating === rating).length;
        const percentage = analytics.totalFeedbacks > 0 ? count / analytics.totalFeedbacks : 0;
        return {
            rating: `${rating} ★`,
            count: count,
            percentage: percentage, // Normalized 0-1 for the chart
        };
    });

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
        // Generate rating distribution bars HTML
        const ratingBarsHTML = ratingDistributionData.map(item => {
            const percentDisplay = (item.percentage * 100);
            const barColor = parseInt(item.rating) >= 4 ? '#28a745' : parseInt(item.rating) >= 3 ? '#ffc107' : '#dc3545';
            return `
                <div style="margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="font-size: 14px;">${item.rating}</span>
                        <span style="font-size: 14px;">${item.count} (${percentDisplay.toFixed(0)}%)</span>
                    </div>
                    <div style="background-color: #e9ecef; height: 20px; border-radius: 4px; overflow: hidden;">
                        <div style="background-color: ${barColor}; height: 100%; width: ${percentDisplay}%; transition: width 0.3s;"></div>
                    </div>
                </div>
            `;
        }).join('');

        // Create HTML content for PDF
        const htmlContent = `
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; }
                    h1 { color: #0d6efd; margin-bottom: 10px; }
                    .header { background-color: #f8f9fa; padding: 20px; margin-bottom: 30px; border-radius: 8px; }
                    .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
                    .metric-card { background: #fff; border: 2px solid #e9ecef; padding: 20px; text-align: center; border-radius: 8px; }
                    .metric-card .icon { font-size: 32px; margin-bottom: 10px; }
                    .metric-card .value { font-size: 28px; font-weight: bold; margin: 10px 0; }
                    .metric-card .label { color: #6c757d; font-size: 14px; }
                    .metric-card .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-top: 5px; }
                    .badge-success { background-color: #d4edda; color: #155724; }
                    .badge-info { background-color: #d1ecf1; color: #0c5460; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
                    th { background-color: #0d6efd; color: white; }
                    .metric { font-weight: bold; }
                    .chart-section { margin: 30px 0; page-break-inside: avoid; }
                    .chart-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #495057; }
                    .progress-bar-container { background-color: #e9ecef; height: 30px; border-radius: 4px; margin: 15px 0; overflow: hidden; }
                    .progress-bar { height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; transition: width 0.3s; }
                    .progress-success { background-color: #28a745; }
                    .progress-warning { background-color: #ffc107; }
                    .progress-danger { background-color: #dc3545; }
                    .progress-primary { background-color: #0d6efd; }
                    .two-column { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 20px 0; }
                    .chart-box { border: 1px solid #dee2e6; padding: 20px; border-radius: 8px; }
                    @media print {
                        body { padding: 20px; }
                        .chart-section { page-break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>📊 Event Analytics Report</h1>
                    <p><strong>Event:</strong> ${event?.title || 'N/A'}</p>
                    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>Report Period:</strong> ${event ? format(new Date(event.startDateTime), 'PPP') : 'N/A'} - ${event ? format(new Date(event.endDateTime), 'PPP') : 'N/A'}</p>
                </div>

                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="icon">👥</div>
                        <div class="value" style="color: #0d6efd;">${analytics.totalRegistrations}</div>
                        <div class="label">Total Registrations</div>
                    </div>
                    <div class="metric-card">
                        <div class="icon">✅</div>
                        <div class="value" style="color: #28a745;">${analytics.totalCheckIns}</div>
                        <div class="label">Check-ins</div>
                        <span class="badge badge-success">${attendanceRate.toFixed(1)}%</span>
                    </div>
                    <div class="metric-card">
                        <div class="icon">💬</div>
                        <div class="value" style="color: #17a2b8;">${analytics.totalFeedbacks}</div>
                        <div class="label">Feedbacks</div>
                        <span class="badge badge-info">${feedbackRate.toFixed(1)}%</span>
                    </div>
                    <div class="metric-card">
                        <div class="icon">⭐</div>
                        <div class="value" style="color: #ffc107;">${analytics.averageRating ? analytics.averageRating.toFixed(1) : 'N/A'}</div>
                        <div class="label">Avg Rating (out of 5.0)</div>
                    </div>
                </div>

                <div class="chart-section">
                    <div class="chart-title">📊 Key Performance Indicators</div>
                    <table>
                        <tr><th>Metric</th><th>Value</th><th>Visualization</th></tr>
                        <tr>
                            <td class="metric">Attendance Rate</td>
                            <td>${attendanceRate.toFixed(1)}%</td>
                            <td>
                                <div style="background-color: #e9ecef; height: 20px; border-radius: 4px; overflow: hidden; width: 200px;">
                                    <div class="progress-bar progress-success" style="width: ${attendanceRate}%;">${analytics.totalCheckIns}/${analytics.totalRegistrations}</div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td class="metric">Feedback Rate</td>
                            <td>${feedbackRate.toFixed(1)}%</td>
                            <td>
                                <div style="background-color: #e9ecef; height: 20px; border-radius: 4px; overflow: hidden; width: 200px;">
                                    <div class="progress-bar progress-primary" style="width: ${feedbackRate}%; background-color: #17a2b8;">${analytics.totalFeedbacks}/${analytics.totalRegistrations}</div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td class="metric">Engagement Score</td>
                            <td>${analytics.engagementScore?.toFixed(1) || '0'} / 100</td>
                            <td>
                                <div style="background-color: #e9ecef; height: 20px; border-radius: 4px; overflow: hidden; width: 200px;">
                                    <div class="progress-bar ${analytics.engagementScore >= 70 ? 'progress-success' : analytics.engagementScore >= 40 ? 'progress-warning' : 'progress-danger'}" style="width: ${analytics.engagementScore || 0}%;">${analytics.engagementScore?.toFixed(1) || '0'}</div>
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>

                <div class="chart-section">
                    <div class="chart-title">⭐ Rating Distribution</div>
                    <div class="chart-box">
                        ${analytics.totalFeedbacks === 0 ? '<p style="text-align: center; color: #6c757d; padding: 20px;">No feedbacks received yet</p>' : ratingBarsHTML}
                    </div>
                </div>

                <div class="chart-section">
                    <div class="chart-title">💬 Recent Feedback Comments</div>
                    <div class="chart-box">
                        ${analytics.totalFeedbacks === 0 ? '<p style="text-align: center; color: #6c757d; padding: 20px;">No feedback comments available</p>' :
                feedbacks.slice(0, 5).map(feedback => `
                            <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e9ecef;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <strong>${'⭐'.repeat(feedback.rating)} (${feedback.rating}/5)</strong>
                                    <span style="color: #6c757d; font-size: 14px;">${format(new Date(feedback.submittedAt), 'MMM d, yyyy')}</span>
                                </div>
                                ${feedback.comment ? `<p style="margin: 0; color: #495057;">${feedback.comment}</p>` : '<p style="margin: 0; color: #adb5bd; font-style: italic;">No comment provided</p>'}
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #dee2e6; text-align: center; color: #6c757d; font-size: 12px;">
                    <p>This report was automatically generated from the Digital Event Management Portal</p>
                    <p>Generated on: ${new Date().toLocaleString()}</p>
                </div>
            </body>
            </html>
        `;

        // Open print dialog
        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 250);
        toast.success('PDF report ready for printing!');
    };

    return (
        <Container className="py-4">
            <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap">
                <div className="mb-2">
                    <h1>📊 Event Analytics</h1>
                    {event && (
                        <div>
                            <p className="text-muted mb-1">{event.title}</p>
                            <small className="text-muted">
                                Last updated: {format(new Date(analytics.generatedAt), 'PPp')}
                            </small>
                        </div>
                    )}
                </div>
                <div className="d-flex gap-2 flex-wrap">
                    {canRecalculate() && (
                        <Button
                            variant="warning"
                            onClick={handleRecalculate}
                            disabled={isCalculating}
                        >
                            {isCalculating ? (
                                <>
                                    <Spinner size="sm" animation="border" /> Recalculating...
                                </>
                            ) : (
                                <>🔄 Recalculate Analytics</>
                            )}
                        </Button>
                    )}
                    <ButtonGroup>
                        <Button variant="success" size="sm" onClick={() => downloadReport('csv')}>
                            📊 CSV
                        </Button>
                        <Button variant="info" size="sm" onClick={() => downloadReport('json')}>
                            📄 JSON
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => downloadReport('pdf')}>
                            📑 PDF
                        </Button>
                    </ButtonGroup>
                </div>
            </div>

            <Row>
                <Col md={3} className="mb-4">
                    <Card className="shadow-sm text-center h-100">
                        <Card.Body>
                            <div className="display-4 mb-2">👥</div>
                            <h3 className="text-primary">{analytics.totalRegistrations}</h3>
                            <p className="text-muted mb-0">Total Registrations</p>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={3} className="mb-4">
                    <Card className="shadow-sm text-center h-100">
                        <Card.Body>
                            <div className="display-4 mb-2">✅</div>
                            <h3 className="text-success">{analytics.totalCheckIns}</h3>
                            <p className="text-muted mb-0">Check-ins</p>
                            <Badge bg="success">{attendanceRate.toFixed(1)}%</Badge>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={3} className="mb-4">
                    <Card className="shadow-sm text-center h-100">
                        <Card.Body>
                            <div className="display-4 mb-2">💬</div>
                            <h3 className="text-info">{analytics.totalFeedbacks}</h3>
                            <p className="text-muted mb-0">Feedbacks</p>
                            <Badge bg="info">{feedbackRate.toFixed(1)}%</Badge>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={3} className="mb-4">
                    <Card className="shadow-sm text-center h-100">
                        <Card.Body>
                            <div className="display-4 mb-2">⭐</div>
                            <h3 className="text-warning">
                                {analytics.averageRating ? analytics.averageRating.toFixed(1) : 'N/A'}
                            </h3>
                            <p className="text-muted mb-0">Avg Rating</p>
                            <small className="text-muted">out of 5.0</small>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col md={6} className="mb-4">
                    <Card className="shadow-sm h-100">
                        <Card.Header className="bg-light">
                            <h5 className="mb-0">📈 Engagement Metrics</h5>
                        </Card.Header>
                        <Card.Body>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={engagementData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="value" fill="#0d6efd" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6} className="mb-4">
                    <Card className="shadow-sm h-100">
                        <Card.Header className="bg-light">
                            <h5 className="mb-0">🥧 Attendance Distribution</h5>
                        </Card.Header>
                        <Card.Body className="d-flex justify-content-center align-items-center">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={participationData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {participationData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col md={6} className="mb-4">
                    <Card className="shadow-sm h-100">
                        <Card.Header className="bg-primary text-white">
                            <h5 className="mb-0">🎯 Engagement Score</h5>
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
                                variant={(
                                    analytics.engagementScore >= 70 ? 'success' :
                                        analytics.engagementScore >= 40 ? 'warning' : 'danger'
                                )}
                                style={{ height: '25px' }}
                            />
                            <div className="mt-3">
                                <small className="text-muted">
                                    Calculated from: Attendance (50%), Feedback (30%), Rating (20%)
                                </small>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6} className="mb-4">
                    <Card className="shadow-sm h-100">
                        <Card.Header className="bg-light">
                            <h5 className="mb-0">🕶️ Performance Radar</h5>
                        </Card.Header>
                        <Card.Body className="d-flex justify-content-center align-items-center">
                            <ResponsiveContainer width="100%" height={300}>
                                <RadarChart data={metricsRadarData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="metric" />
                                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                                    <Radar name="Performance" dataKey="value" stroke="#0d6efd" fill="#0d6efd" fillOpacity={0.6} />
                                    <Tooltip />
                                </RadarChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col md={6} className="mb-4">
                    <Card className="shadow-sm">
                        <Card.Header className="bg-light">
                            <h5 className="mb-0">⭐ Rating Distribution</h5>
                        </Card.Header>
                        <Card.Body>
                            {analytics.totalFeedbacks === 0 ? (
                                <p className="text-muted text-center py-4">No feedbacks received yet</p>
                            ) : (
                                <>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={ratingDistributionData} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" domain={[0, 1]} />
                                            <YAxis dataKey="rating" type="category" />
                                            <Tooltip
                                                formatter={(value) => `${(value * 100).toFixed(0)}%`}
                                            />
                                            <Bar dataKey="percentage" fill="#ffc107" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                    <div className="mt-3">
                                        {ratingDistributionData.map((item) => {
                                            const percentDisplay = (item.percentage * 100);

                                            return (
                                                <div key={item.rating} className="mb-2">
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <small>{item.rating}</small>
                                                        <small>{item.count} ({percentDisplay.toFixed(0)}%)</small>
                                                    </div>
                                                    <ProgressBar
                                                        now={percentDisplay}
                                                        variant={parseInt(item.rating) >= 4 ? 'success' : parseInt(item.rating) >= 3 ? 'warning' : 'danger'}
                                                        style={{ height: '8px' }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6} className="mb-4">
                    <Card className="shadow-sm">
                        <Card.Header className="bg-light">
                            <h5 className="mb-0">💬 Feedback Details</h5>
                        </Card.Header>
                        <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {analytics.totalFeedbacks === 0 ? (
                                <p className="text-muted text-center py-4">No feedbacks submitted yet</p>
                            ) : (
                                <div>
                                    {feedbacks.map((feedback, index) => (
                                        <div key={feedback._id || index} className="mb-3 pb-3 border-bottom">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <div>
                                                    <strong>{'⭐'.repeat(feedback.rating)}</strong>
                                                    <span className="text-muted ms-2">({feedback.rating}/5)</span>
                                                </div>
                                                <small className="text-muted">
                                                    {format(new Date(feedback.submittedAt), 'MMM d, yyyy')}
                                                </small>
                                            </div>
                                            {feedback.comment && (
                                                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                                                    {feedback.comment}
                                                </p>
                                            )}
                                        </div>
                                    ))}
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
