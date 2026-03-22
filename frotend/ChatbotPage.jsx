import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import Header from './Header';
import Footer from './Footer';
import { useLanguage } from './contexts/LanguageContext';
import { useNotification } from './contexts/NotificationContext';

function ChatbotPage({ username, onLogout }) {
  const { t, language: appLanguage } = useLanguage();
  const { showNotification } = useNotification();
  
  // Chatbot language (English or Urdu)
  const [chatbotLanguage, setChatbotLanguage] = useState('en');
  // Separate chat history per language: { en: [...], ur: [...] }
  const [chatHistoryByLang, setChatHistoryByLang] = useState({ en: [], ur: [] });
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatbotReady, setChatbotReady] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Check chatbot health on mount
  useEffect(() => {
    checkChatbotHealth();
  }, []);

  const currentHistory = chatHistoryByLang[chatbotLanguage] || [];

  // Scroll to bottom when new message is added
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentHistory]);

  const checkChatbotHealth = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/chatbot/health');
      const data = await response.json();
      if (data.status === 'healthy') {
        setChatbotReady(true);
      } else {
        setError(t('chatbot.notAvailable'));
        setChatbotReady(false);
      }
    } catch (err) {
      console.error('Chatbot health check failed:', err);
      setError(t('chatbot.connectionError'));
      setChatbotReady(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!userInput.trim() || loading || !chatbotReady) {
      return;
    }

    const query = userInput.trim();
    setUserInput('');
    setError(null);

    // Add user message to current language's chat history
    const userMessage = {
      role: 'user',
      content: query,
      timestamp: new Date()
    };
    setChatHistoryByLang(prev => ({
      ...prev,
      [chatbotLanguage]: [...(prev[chatbotLanguage] || []), userMessage]
    }));

    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          language: chatbotLanguage,
          request_id: `chat_${Date.now()}`
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Add bot response to current language's chat history
      const botMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        contextUsed: data.context_used,
        processingTime: data.processing_time
      };
      setChatHistoryByLang(prev => ({
        ...prev,
        [chatbotLanguage]: [...(prev[chatbotLanguage] || []), botMessage]
      }));

    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message || t('chatbot.sendError'));
      
      // Add error message to chat
      const errorMessage = {
        role: 'assistant',
        content: t('chatbot.errorMessage') + ': ' + err.message,
        timestamp: new Date(),
        isError: true
      };
      setChatHistoryByLang(prev => ({
        ...prev,
        [chatbotLanguage]: [...(prev[chatbotLanguage] || []), errorMessage]
      }));
    } finally {
      setLoading(false);
      // Focus input after sending
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleLanguageChange = (lang) => {
    setChatbotLanguage(lang);
    // Keep chat history when switching languages - only clear on logout
  };

  const handleClearChat = () => {
    if (window.confirm(t('chatbot.clearChatConfirm'))) {
      setChatHistoryByLang(prev => ({ ...prev, [chatbotLanguage]: [] }));
      setError(null);
    }
  };

  return (
    <>
      <Header username={username} onLogout={onLogout} />
      <div className="min-vh-100 d-flex flex-column bg-light">
        <div className="hero-section-chatbot py-4 mb-4">
          <Container fluid className="px-4">
            <Row className="align-items-center">
              <Col>
                <h1 className="display-5 fw-bold mb-2 hero-title">{t('chatbot.title')}</h1>
                <p className="lead mb-0 hero-subtitle">{t('chatbot.subtitle')}</p>
              </Col>
            </Row>
          </Container>
          <style>{`
            .hero-section-chatbot {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #ffffff;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            }
            [data-theme="dark"] .hero-section-chatbot {
              background: linear-gradient(135deg, #4a5568 0%, #5a3d7a 100%);
            }
            .hero-section-chatbot .hero-title,
            .hero-section-chatbot .hero-subtitle {
              color: #ffffff !important;
              text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
            }
          `}</style>
        </div>

        <Container fluid className="flex-grow-1 py-4 px-4">

          {/* Language Selection Card */}
          <Row className="mb-4">
            <Col md={12}>
              <Card className="shadow-sm border-0">
                <Card.Body>
                  <Row className="align-items-center">
                    <Col md={6}>
                      <Form.Label className="fw-bold mb-2">{t('chatbot.selectLanguage')}</Form.Label>
                      <div className="d-flex gap-2">
                        <Button
                          variant={chatbotLanguage === 'en' ? 'success' : 'outline-success'}
                          onClick={() => handleLanguageChange('en')}
                          className="flex-fill"
                        >
                          🇬🇧 {t('chatbot.english')}
                        </Button>
                        <Button
                          variant={chatbotLanguage === 'ur' ? 'success' : 'outline-success'}
                          onClick={() => handleLanguageChange('ur')}
                          className="flex-fill"
                        >
                          🇵🇰 {t('chatbot.urdu')}
                        </Button>
                      </div>
                    </Col>
                    <Col md={6} className="text-end">
                      <Badge bg={chatbotReady ? 'success' : 'danger'} className="p-2">
                        {chatbotReady ? '✅ ' + t('chatbot.ready') : '❌ ' + t('chatbot.notReady')}
                      </Badge>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Error Alert */}
          {error && (
            <Row className="mb-3">
              <Col>
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                  {error}
                </Alert>
              </Col>
            </Row>
          )}

          {/* Chat Container */}
          <Row>
            <Col md={12}>
              <Card className="shadow-lg border-0 h-100" style={{ minHeight: '500px' }}>
                <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-0">{t('chatbot.chatWithBot')}</h5>
                    <small>{chatbotLanguage === 'ur' ? 'اردو میں بات کریں' : 'Chat in English'}</small>
                  </div>
                  {currentHistory.length > 0 && (
                    <Button variant="outline-light" size="sm" onClick={handleClearChat}>
                      {t('chatbot.clearChat')}
                    </Button>
                  )}
                </Card.Header>
                <Card.Body className="p-0" style={{ height: '500px', overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
                  {currentHistory.length === 0 ? (
                    <div className="d-flex align-items-center justify-content-center h-100 text-center p-4">
                      <div>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🤖</div>
                        <h4 className="text-muted">
                          {chatbotLanguage === 'ur' ? t('chatbot.welcomeMessageChatbotUr') : t('chatbot.welcomeMessage')}
                        </h4>
                        <p className="text-muted">
                          {chatbotLanguage === 'ur' ? t('chatbot.startChattingChatbotUr') : t('chatbot.startChatting')}
                        </p>
                        <div className="mt-4">
                          <Badge bg="light" text="dark" className="me-2 mb-2 p-2">
                            {chatbotLanguage === 'ur' ? t('chatbot.example1ChatbotUr') : t('chatbot.example1')}
                          </Badge>
                          <Badge bg="light" text="dark" className="me-2 mb-2 p-2">
                            {chatbotLanguage === 'ur' ? t('chatbot.example2ChatbotUr') : t('chatbot.example2')}
                          </Badge>
                          <Badge bg="light" text="dark" className="me-2 mb-2 p-2">
                            {chatbotLanguage === 'ur' ? t('chatbot.example3ChatbotUr') : t('chatbot.example3')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3">
                      {currentHistory.map((message, index) => (
                        <div
                          key={index}
                          className={`mb-3 d-flex ${message.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                        >
                          <div
                            className={`p-3 rounded-3 shadow-sm ${
                              message.role === 'user'
                                ? 'bg-success text-white'
                                : message.isError
                                ? 'bg-danger text-white'
                                : 'bg-white border'
                            }`}
                            style={{ maxWidth: '75%', wordWrap: 'break-word' }}
                          >
                            <div className="mb-1" style={{ whiteSpace: 'pre-wrap' }}>
                              {message.content}
                            </div>
                            {message.contextUsed && (
                              <small className="opacity-75 d-block mt-2">
                                {t('chatbot.contextUsed')}: {message.contextUsed} {t('chatbot.chunks')}
                                {message.processingTime && ` • ${message.processingTime.toFixed(2)}s`}
                              </small>
                            )}
                          </div>
                        </div>
                      ))}
                      {loading && (
                        <div className="d-flex justify-content-start mb-3">
                          <div className="bg-white border p-3 rounded-3 shadow-sm">
                            <Spinner animation="border" size="sm" className="me-2" />
                            {t('chatbot.thinking')}...
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </Card.Body>
                <Card.Footer className="bg-light">
                  <Form onSubmit={handleSendMessage}>
                    <Row className="g-2">
                      <Col>
                        <Form.Control
                          ref={inputRef}
                          type="text"
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          placeholder={chatbotLanguage === 'ur' ? 'اپنا سوال لکھیں...' : t('chatbot.placeholder')}
                          disabled={loading || !chatbotReady}
                          className="border-success"
                        />
                      </Col>
                      <Col xs="auto">
                        <Button
                          type="submit"
                          variant="success"
                          disabled={loading || !chatbotReady || !userInput.trim()}
                        >
                          {loading ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              {t('chatbot.sending')}
                            </>
                          ) : (
                            <>
                              📤 {t('chatbot.send')}
                            </>
                          )}
                        </Button>
                      </Col>
                    </Row>
                  </Form>
                </Card.Footer>
              </Card>
            </Col>
          </Row>

          {/* Info Card */}
          <Row className="mt-4">
            <Col md={12}>
              <Card className="border-0 shadow-sm bg-light">
                <Card.Body>
                  <Row>
                    <Col md={4} className="text-center mb-3 mb-md-0">
                      <div className="h4 mb-2">🌾</div>
                      <h6 className="fw-bold">{t('chatbot.feature1Title')}</h6>
                      <p className="small text-muted mb-0">{t('chatbot.feature1Desc')}</p>
                    </Col>
                    <Col md={4} className="text-center mb-3 mb-md-0">
                      <div className="h4 mb-2">🤖</div>
                      <h6 className="fw-bold">{t('chatbot.feature2Title')}</h6>
                      <p className="small text-muted mb-0">{t('chatbot.feature2Desc')}</p>
                    </Col>
                    <Col md={4} className="text-center">
                      <div className="h4 mb-2">📊</div>
                      <h6 className="fw-bold">{t('chatbot.feature3Title')}</h6>
                      <p className="small text-muted mb-0">{t('chatbot.feature3Desc')}</p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
        <Footer />
      </div>
    </>
  );
}

export default ChatbotPage;
