import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Container, Row, Col, Card, Form, Button, Spinner, Badge, Nav, InputGroup, ListGroup } from 'react-bootstrap';

const Profile = () => {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState({
        username: '',
        email: '',
        bio: '',
        skills: [],
        experience: [],
        portfolioLinks: [],
        certifications: []
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [newSkill, setNewSkill] = useState('');
    const [newLink, setNewLink] = useState('');
    const [newExperience, setNewExperience] = useState({ title: '', description: '', year: '' });
    const [newCertification, setNewCertification] = useState({ name: '', issuedBy: '', proofUrl: '' });

    useEffect(() => {
        if (!user) {
            toast.error('Please login to access your profile');
            navigate('/login');
            return;
        }
        fetchProfile();
    }, [user, navigate]);

    const fetchProfile = async () => {
        try {
            const response = await authService.getProfile();
            setProfileData(response.user);
        } catch (error) {
            toast.error('Failed to load profile');
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await authService.updateProfile(profileData);
            updateUser(response.user);
            toast.success('Profile updated successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            await authService.updatePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            toast.success('Password updated successfully!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    const addSkill = () => {
        if (newSkill.trim() && !profileData.skills.includes(newSkill.trim())) {
            setProfileData({ ...profileData, skills: [...profileData.skills, newSkill.trim()] });
            setNewSkill('');
        }
    };

    const removeSkill = (index) => {
        const updatedSkills = profileData.skills.filter((_, i) => i !== index);
        setProfileData({ ...profileData, skills: updatedSkills });
    };

    const addPortfolioLink = () => {
        if (newLink.trim()) {
            setProfileData({ ...profileData, portfolioLinks: [...profileData.portfolioLinks, newLink.trim()] });
            setNewLink('');
        }
    };

    const removePortfolioLink = (index) => {
        const updatedLinks = profileData.portfolioLinks.filter((_, i) => i !== index);
        setProfileData({ ...profileData, portfolioLinks: updatedLinks });
    };

    const addExperience = () => {
        if (newExperience.title.trim()) {
            setProfileData({ ...profileData, experience: [...profileData.experience, newExperience] });
            setNewExperience({ title: '', description: '', year: '' });
        }
    };

    const removeExperience = (index) => {
        const updatedExperience = profileData.experience.filter((_, i) => i !== index);
        setProfileData({ ...profileData, experience: updatedExperience });
    };

    const addCertification = () => {
        if (newCertification.name.trim()) {
            setProfileData({ ...profileData, certifications: [...profileData.certifications, newCertification] });
            setNewCertification({ name: '', issuedBy: '', proofUrl: '' });
        }
    };

    const removeCertification = (index) => {
        const updatedCertifications = profileData.certifications.filter((_, i) => i !== index);
        setProfileData({ ...profileData, certifications: updatedCertifications });
    };

    return (
        <Container className="py-4">
            <Row className="justify-content-center">
                <Col lg={10} xl={8}>
                    <Card className="shadow">
                        <Card.Header className="bg-primary text-white">
                            <h2 className="mb-0">My Profile</h2>
                            <p className="mb-0 small">Manage your account settings</p>
                        </Card.Header>
                        <Card.Body>
                            <Nav variant="tabs" className="mb-4">
                                <Nav.Item>
                                    <Nav.Link
                                        active={activeTab === 'profile'}
                                        onClick={() => setActiveTab('profile')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Profile Info
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link
                                        active={activeTab === 'password'}
                                        onClick={() => setActiveTab('password')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Change Password
                                    </Nav.Link>
                                </Nav.Item>
                            </Nav>

                            {activeTab === 'profile' && (
                                <Form onSubmit={handleProfileUpdate}>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Username</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={profileData.username}
                                                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Email (Read-only)</Form.Label>
                                                <Form.Control
                                                    type="email"
                                                    value={profileData.email}
                                                    disabled
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Bio</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={4}
                                            value={profileData.bio}
                                            onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                            maxLength="500"
                                            placeholder="Tell us about yourself..."
                                        />
                                        <Form.Text className="text-muted">
                                            {profileData.bio.length}/500 characters
                                        </Form.Text>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Skills</Form.Label>
                                        <InputGroup className="mb-2">
                                            <Form.Control
                                                type="text"
                                                value={newSkill}
                                                onChange={(e) => setNewSkill(e.target.value)}
                                                placeholder="Add a skill"
                                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                            />
                                            <Button variant="secondary" onClick={addSkill}>
                                                Add
                                            </Button>
                                        </InputGroup>
                                        <div className="d-flex flex-wrap gap-2">
                                            {profileData.skills.map((skill, index) => (
                                                <Badge key={index} bg="primary" className="d-flex align-items-center gap-1">
                                                    {skill}
                                                    <span
                                                        onClick={() => removeSkill(index)}
                                                        style={{ cursor: 'pointer', marginLeft: '5px' }}
                                                    >
                                                        ✕
                                                    </span>
                                                </Badge>
                                            ))}
                                        </div>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Portfolio Links</Form.Label>
                                        <InputGroup className="mb-2">
                                            <Form.Control
                                                type="url"
                                                value={newLink}
                                                onChange={(e) => setNewLink(e.target.value)}
                                                placeholder="https://your-portfolio.com"
                                            />
                                            <Button variant="secondary" onClick={addPortfolioLink}>
                                                Add
                                            </Button>
                                        </InputGroup>
                                        <ListGroup>
                                            {profileData.portfolioLinks.map((link, index) => (
                                                <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                                                    <a href={link} target="_blank" rel="noopener noreferrer">{link}</a>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => removePortfolioLink(index)}
                                                    >
                                                        Remove
                                                    </Button>
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Experience</Form.Label>
                                        <Card className="mb-2">
                                            <Card.Body>
                                                <Form.Control
                                                    type="text"
                                                    className="mb-2"
                                                    value={newExperience.title}
                                                    onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })}
                                                    placeholder="Title"
                                                />
                                                <Form.Control
                                                    type="text"
                                                    className="mb-2"
                                                    value={newExperience.description}
                                                    onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
                                                    placeholder="Description"
                                                />
                                                <InputGroup>
                                                    <Form.Control
                                                        type="number"
                                                        value={newExperience.year}
                                                        onChange={(e) => setNewExperience({ ...newExperience, year: e.target.value })}
                                                        placeholder="Year"
                                                    />
                                                    <Button variant="secondary" onClick={addExperience}>
                                                        Add Experience
                                                    </Button>
                                                </InputGroup>
                                            </Card.Body>
                                        </Card>
                                        {profileData.experience.map((exp, index) => (
                                            <Card key={index} className="mb-2">
                                                <Card.Body>
                                                    <Card.Title>{exp.title} {exp.year && `(${exp.year})`}</Card.Title>
                                                    <Card.Text>{exp.description}</Card.Text>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => removeExperience(index)}
                                                    >
                                                        Remove
                                                    </Button>
                                                </Card.Body>
                                            </Card>
                                        ))}
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label>Certifications</Form.Label>
                                        <Card className="mb-2">
                                            <Card.Body>
                                                <Form.Control
                                                    type="text"
                                                    className="mb-2"
                                                    value={newCertification.name}
                                                    onChange={(e) => setNewCertification({ ...newCertification, name: e.target.value })}
                                                    placeholder="Certification Name"
                                                />
                                                <Form.Control
                                                    type="text"
                                                    className="mb-2"
                                                    value={newCertification.issuedBy}
                                                    onChange={(e) => setNewCertification({ ...newCertification, issuedBy: e.target.value })}
                                                    placeholder="Issued By"
                                                />
                                                <InputGroup>
                                                    <Form.Control
                                                        type="url"
                                                        value={newCertification.proofUrl}
                                                        onChange={(e) => setNewCertification({ ...newCertification, proofUrl: e.target.value })}
                                                        placeholder="Proof URL (optional)"
                                                    />
                                                    <Button variant="secondary" onClick={addCertification}>
                                                        Add
                                                    </Button>
                                                </InputGroup>
                                            </Card.Body>
                                        </Card>
                                        {profileData.certifications.map((cert, index) => (
                                            <Card key={index} className="mb-2">
                                                <Card.Body>
                                                    <Card.Title>{cert.name}</Card.Title>
                                                    {cert.issuedBy && <Card.Text>Issued by: {cert.issuedBy}</Card.Text>}
                                                    {cert.proofUrl && (
                                                        <a href={cert.proofUrl} target="_blank" rel="noopener noreferrer" className="d-block mb-2">
                                                            View Certificate
                                                        </a>
                                                    )}
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => removeCertification(index)}
                                                    >
                                                        Remove
                                                    </Button>
                                                </Card.Body>
                                            </Card>
                                        ))}
                                    </Form.Group>

                                    <Button type="submit" variant="primary" size="lg" className="w-100" disabled={loading}>
                                        {loading ? <><Spinner animation="border" size="sm" /> Updating...</> : 'Update Profile'}
                                    </Button>
                                </Form>
                            )}

                            {activeTab === 'password' && (
                                <Form onSubmit={handlePasswordUpdate}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Current Password</Form.Label>
                                        <Form.Control
                                            type="password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            required
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>New Password</Form.Label>
                                        <Form.Control
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            required
                                            minLength="6"
                                        />
                                        <Form.Text className="text-muted">
                                            Password must be at least 6 characters
                                        </Form.Text>
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label>Confirm New Password</Form.Label>
                                        <Form.Control
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            required
                                            minLength="6"
                                        />
                                    </Form.Group>

                                    <Button type="submit" variant="primary" size="lg" className="w-100" disabled={loading}>
                                        {loading ? <><Spinner animation="border" size="sm" /> Updating...</> : 'Update Password'}
                                    </Button>
                                </Form>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Profile;
