import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Navbar as BSNavbar, Container, Nav, Button } from 'react-bootstrap';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully');
        navigate('/login');
    };

    return (
        <BSNavbar bg="primary" variant="dark" expand="lg" className="mb-3 custom-navbar">
            <Container>
                <BSNavbar.Brand as={Link} to="/" className="navbar-brand-custom">
                    <img 
                        src="/assets/logo.jpg" 
                        alt="Event Portal Logo" 
                        className="navbar-logo"
                    />
                </BSNavbar.Brand>
                <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
                <BSNavbar.Collapse id="basic-navbar-nav">
                    <Nav className="ms-auto">
                        {user ? (
                            <>
                                <Nav.Link as={Link} to="/">Home</Nav.Link>
                                <Nav.Link as={Link} to="/my-events">My Events</Nav.Link>
                                <Nav.Link as={Link} to="/create-event">Create Event</Nav.Link>
                                {(user.role === 'admin' || user.role === 'owner') && (
                                    <Nav.Link as={Link} to="/admin">Admin</Nav.Link>
                                )}
                                <Nav.Link as={Link} to="/profile">Profile</Nav.Link>
                                <Nav.Link className="text-light">Welcome, {user.username}</Nav.Link>
                                <Button variant="light" size="sm" onClick={handleLogout} className="ms-2">
                                    Logout
                                </Button>
                            </>
                        ) : (
                            <>
                                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                                <Nav.Link as={Link} to="/register">Register</Nav.Link>
                            </>
                        )}
                    </Nav>
                </BSNavbar.Collapse>
            </Container>
        </BSNavbar>
    );
};

export default Navbar;
