import React from 'react';
import { Navbar, Nav, Container, Button, Form } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from './contexts/ThemeContext';
import { useNotification } from './contexts/NotificationContext';
import { useLanguage } from './contexts/LanguageContext';

function Header({ username, onLogout }) {
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useTheme();
  const { showNotification } = useNotification();
  const { language, setLanguage, t } = useLanguage();
  
  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate('/');
    showNotification(t('nav.logout') + ' ' + t('common.success'), 'info');
  };


  return (
    <Navbar bg="success" variant="dark" expand="lg" className="shadow-sm modern-navbar">
      <Container fluid className="px-4">
        <Navbar.Brand as={Link} to="/home" className="fw-bold brand-logo">
          <span className="brand-text">{t('login.title')}</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className={language === 'ur' ? 'ms-auto' : 'me-auto'}>
            <Nav.Link as={Link} to="/home" className="nav-link-modern">
              <span>{t('nav.home')}</span>
            </Nav.Link>
            <Nav.Link as={Link} to="/revenue-prediction" className="nav-link-modern">
              <span>{t('nav.revenue')}</span>
            </Nav.Link>
            <Nav.Link as={Link} to="/fertilizer-pest-control" className="nav-link-modern">
              <span>{t('nav.fertilizer')}</span>
            </Nav.Link>
            <Nav.Link as={Link} to="/insights" className="nav-link-modern">
              <span>{t('nav.insights')}</span>
            </Nav.Link>
            <Nav.Link as={Link} to="/compare" className="nav-link-modern">
              <span>{t('nav.compare')}</span>
            </Nav.Link>
            <Nav.Link as={Link} to="/trends" className="nav-link-modern">
              <span>{t('nav.trends')}</span>
            </Nav.Link>
            <Nav.Link as={Link} to="/favorites" className="nav-link-modern">
              <span>{t('nav.favorites')}</span>
            </Nav.Link>
          </Nav>
          <Nav>
            {username && (
              <>
                <Form.Select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  size="sm"
                  className="me-2 language-select"
                  style={{ width: 'auto', display: 'inline-block' }}
                >
                  <option value="en">🇬🇧 EN</option>
                  <option value="ur">🇵🇰 اردو</option>
                </Form.Select>
                <Button
                  variant="outline-light"
                  size="sm"
                  onClick={toggleTheme}
                  className="me-2 theme-toggle"
                  title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {darkMode ? '☀️' : '🌙'}
                </Button>
                <Navbar.Text className={`${language === 'ur' ? 'ms-3' : 'me-3'} user-welcome`}>
                  {t('nav.welcome')}, <strong>{username}</strong>
                </Navbar.Text>
                <Nav.Link onClick={handleLogout} className="logout-link">
                  {t('nav.logout')}
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
      <style>{`
        .modern-navbar {
          background: linear-gradient(135deg, #2d5016 0%, #3d7a1f 50%, #4a9b25 100%) !important;
          padding: 0.75rem 0;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        [data-theme="dark"] .modern-navbar {
          background: linear-gradient(135deg, #1a2e0d 0%, #2d5016 50%, #3d7a1f 100%) !important;
        }

        .brand-logo {
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: transform 0.3s ease;
          color: #ffffff !important;
          font-weight: 700;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
          white-space: nowrap;
        }

        [dir="rtl"] .brand-logo {
          font-size: 1.3rem !important;
        }

        .brand-logo:hover {
          transform: scale(1.05);
          color: #ffffff !important;
        }

        .nav-link-modern {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem !important;
          border-radius: 8px;
          transition: all 0.3s ease;
          margin: 0 0.15rem;
          color: #ffffff !important;
          font-weight: 500;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
          white-space: nowrap;
          font-size: 0.9rem;
        }

        [dir="rtl"] .nav-link-modern {
          font-size: 0.85rem !important;
          padding: 0.5rem 0.6rem !important;
          margin: 0 0.1rem;
        }

        .nav-link-modern:hover {
          background: rgba(255, 255, 255, 0.25) !important;
          transform: translateY(-2px);
          color: #ffffff !important;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .nav-link-modern:active,
        .nav-link-modern.active {
          background: rgba(255, 255, 255, 0.3) !important;
          color: #ffffff !important;
        }

        .user-welcome {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          color: #ffffff !important;
          font-weight: 500;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
          white-space: nowrap;
          font-size: 0.9rem;
        }

        [dir="rtl"] .user-welcome {
          font-size: 0.85rem !important;
          padding: 0.5rem 0.75rem;
        }

        .logout-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem !important;
          border-radius: 8px;
          transition: all 0.3s ease;
          color: #ffffff !important;
          font-weight: 500;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
        }

        .logout-link:hover {
          background: rgba(255, 255, 255, 0.25) !important;
          color: #ffffff !important;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .theme-toggle {
          background: rgba(255, 255, 255, 0.2) !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
          color: #ffffff !important;
          font-size: 1.2rem;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }

        .theme-toggle:hover {
          background: rgba(255, 255, 255, 0.3) !important;
          transform: rotate(180deg) scale(1.1);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        }

        .language-select {
          background: rgba(255, 255, 255, 0.2) !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
          color: #ffffff !important;
          font-weight: 500;
        }

        .language-select option {
          background: #2d5016;
          color: #ffffff;
        }

        .language-select:focus {
          background: rgba(255, 255, 255, 0.25) !important;
          border-color: rgba(255, 255, 255, 0.5) !important;
          color: #ffffff !important;
        }

        /* Ensure all navbar text is white and readable */
        .navbar-dark .navbar-nav .nav-link {
          color: #ffffff !important;
        }

        .navbar-dark .navbar-text {
          color: #ffffff !important;
        }
      `}</style>
    </Navbar>
  );
}

export default Header;


