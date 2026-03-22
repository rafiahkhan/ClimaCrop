import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Form, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

function ChatbotWidget({ username }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [chatbotLanguage, setChatbotLanguage] = useState('en');
  const [chatHistoryByLang, setChatHistoryByLang] = useState({ en: [], ur: [] });
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatbotReady, setChatbotReady] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (open) checkChatbotHealth();
  }, [open]);

  const currentHistory = chatHistoryByLang[chatbotLanguage] || [];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentHistory]);

  const checkChatbotHealth = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/chatbot/health');
      const data = await res.json();
      setChatbotReady(data.status === 'healthy');
    } catch {
      setChatbotReady(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || loading || !chatbotReady) return;
    const query = userInput.trim();
    setUserInput('');
    setChatHistoryByLang(prev => ({
      ...prev,
      [chatbotLanguage]: [...(prev[chatbotLanguage] || []), { role: 'user', content: query }]
    }));
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, language: chatbotLanguage, request_id: `widget_${Date.now()}` })
      });
      const data = await res.json();
      const botMsg = res.ok
        ? { role: 'assistant', content: data.response }
        : { role: 'assistant', content: data.detail || 'Error', isError: true };
      setChatHistoryByLang(prev => ({
        ...prev,
        [chatbotLanguage]: [...(prev[chatbotLanguage] || []), botMsg]
      }));
    } catch (err) {
      setChatHistoryByLang(prev => ({
        ...prev,
        [chatbotLanguage]: [...(prev[chatbotLanguage] || []), { role: 'assistant', content: err.message || 'Connection error', isError: true }]
      }));
    } finally {
      setLoading(false);
    }
  };

  const welcomeEn = "Welcome! I'm your AI farming assistant. Select a language and ask a question.";
  const welcomeUr = "خوش آمدید! میں آپ کا مصنوعی ذہانت کھیتی باڑی معاون ہوں۔ زبان منتخب کریں اور سوال پوچھیں۔";

  if (!username) return null;

  return (
    <div className="support-widget chatbot-widget">
      {open && (
        <Card className="shadow-lg border-0 support-card chatbot-card">
          <Card.Body className="p-2">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="d-flex align-items-center gap-2">
                <h6 className="mb-0">🤖 {t('chatbot.chatWithBot')}</h6>
                <Link to="/chatbot" className="btn btn-sm btn-outline-success py-0">Full</Link>
              </div>
              <Button variant="light" size="sm" onClick={() => setOpen(false)}>✕</Button>
            </div>
            <div className="d-flex gap-1 mb-2">
              <Button
                size="sm"
                variant={chatbotLanguage === 'en' ? 'success' : 'outline-success'}
                onClick={() => setChatbotLanguage('en')}
                className="flex-fill py-1"
              >EN</Button>
              <Button
                size="sm"
                variant={chatbotLanguage === 'ur' ? 'success' : 'outline-success'}
                onClick={() => setChatbotLanguage('ur')}
                className="flex-fill py-1"
              >اردو</Button>
            </div>
            <div
              className="chatbot-widget-messages mb-2"
              style={{ height: '220px', overflowY: 'auto', backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '8px' }}
            >
              {currentHistory.length === 0 ? (
                <div className="text-center text-muted small py-3">
                  {chatbotLanguage === 'ur' ? welcomeUr : welcomeEn}
                </div>
              ) : (
                currentHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={`small mb-2 ${msg.role === 'user' ? 'text-end' : ''}`}
                  >
                    <div
                      className={`d-inline-block p-2 rounded text-break ${msg.role === 'user' ? 'bg-success text-white' : msg.isError ? 'bg-danger text-white' : 'bg-white border'}`}
                      style={{ maxWidth: '90%' }}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="small text-muted">
                  <Spinner animation="border" size="sm" className="me-1" />
                  {t('chatbot.thinking')}...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <Form onSubmit={handleSend} className="d-flex gap-1">
              <Form.Control
                size="sm"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={chatbotLanguage === 'ur' ? 'سوال لکھیں...' : 'Type question...'}
                disabled={loading || !chatbotReady}
              />
              <Button type="submit" variant="success" size="sm" disabled={loading || !chatbotReady || !userInput.trim()}>
                {loading ? <Spinner animation="border" size="sm" /> : '➤'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      )}
      <Button
        variant="success"
        className="support-toggle"
        onClick={() => setOpen(!open)}
        aria-label="Chatbot"
      >
        🤖
      </Button>
    </div>
  );
}

export default ChatbotWidget;
