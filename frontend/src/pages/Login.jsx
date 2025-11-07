import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Container, Row, Col, Card, Form, Button, Spinner } from 'react-bootstrap';

const Login = () => {
    const [formData, setFormData] = useState({
        identifier: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        console.log('='.repeat(50));
        console.log('🔐 LOGIN ATTEMPT STARTED');
        console.log('Identifier:', formData.identifier);
        console.log('Password exists:', !!formData.password);
        console.log('Current loading state:', loading);
        console.log('='.repeat(50));

        if (loading) {
            console.log('⚠️ ALREADY LOADING - ABORTING');
            return;
        }

        setLoading(true);
        console.log('✅ Loading state set to TRUE');

        try {
            console.log('📡 CALLING LOGIN FUNCTION...');
            const result = await login(formData.identifier, formData.password);
            console.log('✅ LOGIN SUCCESSFUL!');
            console.log('Result:', result);

            toast.success('Login successful!');
            console.log('✅ Success toast displayed');

            setTimeout(() => {
                console.log('🔄 Navigating to home...');
                navigate('/');
            }, 500);
        } catch (error) {
            console.log('='.repeat(50));
            console.log('❌ ERROR CAUGHT IN LOGIN COMPONENT');
            console.log('Error object:', error);
            console.log('Error.response:', error.response);
            console.log('Error.response.data:', error.response?.data);
            console.log('Error.message:', error.message);
            console.log('='.repeat(50));

            const errorMessage = error.response?.data?.message || error.message || 'Login failed. Please try again.';
            console.log('📢 ERROR MESSAGE TO DISPLAY:', errorMessage);

            console.log('🔔 Calling toast.error...');
            toast.error(errorMessage);

            console.log('✅ Toast.error called');

            setLoading(false);
            console.log('✅ Loading state set to FALSE');
            console.log('='.repeat(50));
        }
    };

    return (
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col md={6} lg={5}>
                    <Card className="shadow">
                        <Card.Body className="p-4">
                            <div className="text-center mb-4">
                                <h1 className="h3">Welcome Back</h1>
                                <p className="text-muted">Login to manage your events</p>
                            </div>

                            <Form noValidate onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email or Username</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="identifier"
                                        placeholder="Enter your email or username"
                                        value={formData.identifier}
                                        onChange={handleChange}
                                        autoComplete="username" // helps prevent autofill issues
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="password"
                                        placeholder="Enter your password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        autoComplete="current-password"
                                        required
                                    />
                                </Form.Group>

                                <Button
                                    type="button"
                                    onClick={handleSubmit}
                                    variant="primary"
                                    className="w-100"
                                    size="lg"
                                    disabled={loading}
                                >
                                    {loading ? <Spinner animation="border" size="sm" /> : 'Login'}
                                </Button>

                            </Form>


                            <div className="text-center mt-3">
                                <p className="mb-0">
                                    Don't have an account?{' '}
                                    <Link to="/register">Register here</Link>
                                </p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Login;
