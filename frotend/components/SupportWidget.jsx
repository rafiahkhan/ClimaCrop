import React, { useState } from 'react';
import { Card, Button, ListGroup } from 'react-bootstrap';
import { useLanguage } from '../contexts/LanguageContext';

function SupportWidget() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const faqs = [
    { q: t('support.q1'), a: t('support.a1') },
    { q: t('support.q2'), a: t('support.a2') },
    { q: t('support.q3'), a: t('support.a3') },
  ];

  return (
    <div className="support-widget">
      {open && (
        <Card className="shadow-lg border-0 support-card">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <h6 className="mb-0">{t('support.needHelp')}</h6>
                <small className="text-muted">{t('support.cta')}</small>
              </div>
              <Button variant="light" size="sm" onClick={() => setOpen(false)}>✕</Button>
            </div>
            <ListGroup variant="flush">
              {faqs.map((item, idx) => (
                <ListGroup.Item key={idx} className="border-0 px-0">
                  <Button variant="link" className="p-0 text-start w-100 fw-bold text-success">
                    {item.q}
                  </Button>
                  <div className="text-muted small mt-1">{item.a}</div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card.Body>
        </Card>
      )}
      <Button
        variant="success"
        className="support-toggle"
        onClick={() => setOpen(!open)}
        aria-label="Support"
      >
        💬
      </Button>
    </div>
  );
}

export default SupportWidget;

