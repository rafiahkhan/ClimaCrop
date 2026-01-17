import React, { useState } from "react";
import { Container, Card, Form, Button, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "./contexts/LanguageContext";

function LoginPage({ setUsername }) {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (user.trim() !== "" && password.trim() !== "") {
      setUsername(user);
      navigate("/home");
    }
  };

  return (
    <div className="login-page-wrapper">
      {/* Background Image with Overlay */}
      <div className="login-background">
        <div className="background-overlay"></div>
      </div>

      <Container className="login-container">
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col md={6} lg={5}>
            <Card className="login-card shadow-lg border-0">
              <Card.Body className="p-5">
                {/* Logo and Header */}
                <div className="text-center mb-4">
                  <div className="login-logo mb-3">
                    <div className="logo-icon">🌾</div>
                  </div>
                  <h1 className="text-success fw-bold mb-2">{t('login.title')}</h1>
                  <p className="text-muted mb-3">{t('login.subtitle')}</p>
                  <div className="d-flex justify-content-center gap-2 flex-wrap"></div>
                </div>

                {/* Login Form */}
                <Form onSubmit={handleLogin} className="mt-4">
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold mb-2">
                      <i className="bi bi-person-fill me-2"></i>{t('login.enterName')}
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder={t('login.namePlaceholder')}
                      value={user}
                      onChange={(e) => setUser(e.target.value)}
                      size="lg"
                      className="form-control-modern"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold mb-2">
                      <i className="bi bi-lock-fill me-2"></i>{t('login.enterPassword')}
                    </Form.Label>
                    <Form.Control
                      type="password"
                      placeholder={t('login.passwordPlaceholder')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      size="lg"
                      className="form-control-modern"
                      required
                    />
                  </Form.Group>
                  
                  <Button
                    variant="success"
                    type="submit"
                    size="lg"
                    className="w-100 fw-bold login-button"
                  >
                    {t('login.getStarted')}
                  </Button>
                </Form>

                {/* Language Selector */}
                <div className="mt-4 pt-3 border-top">
                  <Form.Group>
                    <Form.Label className="fw-bold mb-2">
                      <i className="bi bi-translate me-2"></i>{t('login.selectLanguage')}
                    </Form.Label>
                    <Form.Select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      size="lg"
                      className="form-control-modern"
                    >
                      <option value="en">{t('login.english')}</option>
                      <option value="ur">{t('login.urdu')}</option>
                    </Form.Select>
                  </Form.Group>
                </div>

                {/* Features Preview */}
                <div className="mt-4 pt-4 border-top"></div>

                {/* Footer Note */}
                <div className="text-center mt-4">
                  <small className="text-muted">
                    <i className="bi bi-shield-check me-1"></i>
                    {t('login.secure')}
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <style>{`
        .login-page-wrapper {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
        }

        .login-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%),
                      url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80') center/cover;
          background-blend-mode: overlay;
          z-index: 0;
          animation: backgroundShift 20s ease-in-out infinite;
        }

        @keyframes backgroundShift {
          0%, 100% { background-position: center; }
          50% { background-position: center right; }
        }

        .background-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(2px);
        }

        .login-container {
          position: relative;
          z-index: 1;
        }

        .login-card {
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          animation: slideUp 0.6s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .login-logo {
          display: inline-block;
        }

        .logo-icon {
          font-size: 4rem;
          animation: bounce 2s ease-in-out infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .form-control-modern {
          border-radius: 10px;
          border: 2px solid #e9ecef;
          padding: 12px 20px;
          transition: all 0.3s ease;
        }

        .form-control-modern:focus {
          border-color: #28a745;
          box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
          transform: translateY(-2px);
        }

        .login-button {
          border-radius: 10px;
          padding: 12px;
          font-size: 1.1rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
        }

        .login-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
        }

        .feature-preview {
          text-align: center;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .feature-preview:hover {
          background: #e9ecef;
          transform: translateY(-3px);
        }

        .feature-icon {
          font-size: 1.5rem;
          margin-bottom: 5px;
        }

        @media (max-width: 768px) {
          .login-card {
            margin: 20px;
          }
        }
      `}</style>
    </div>
  );
}

export default LoginPage;
