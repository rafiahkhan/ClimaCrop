import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useLanguage } from './contexts/LanguageContext';

function Footer() {
  const { t, language } = useLanguage();
  return (
    <footer className="modern-footer mt-5">
      <Container>
        <Row className="py-4">
          <Col md={4} className="mb-4 mb-md-0">
            <h5 className="footer-brand mb-3">
              <span className="footer-icon">🌾</span> {t('login.title')}
            </h5>
            <p className="footer-text">
              {language === 'ur' ? 'کسانوں کے لیے ذہین فصل کی سفارش کا نظام۔ بہتر کھیتی باڑی کے فیصلوں کے لیے مصنوعی ذہانت سے چلنے والی پیشین گوئیاں حاصل کریں۔' : 'Smart crop recommendation system for farmers. Get AI-powered predictions for better farming decisions.'}
            </p>
            <div className="social-links mt-3">
              <span className="social-icon">📧</span>
              <span className="social-icon">📱</span>
              <span className="social-icon">🌐</span>
            </div>
          </Col>
          <Col md={4} className="mb-4 mb-md-0">
            <h5 className="footer-title mb-3">{language === 'ur' ? 'فوری لنکس' : 'Quick Links'}</h5>
            <ul className="footer-links list-unstyled">
              <li><Link to="/home" className="footer-link">🏠 {t('nav.home')}</Link></li>
              <li><Link to="/revenue-prediction" className="footer-link">💰 {t('nav.revenue')}</Link></li>
              <li><Link to="/fertilizer-pest-control" className="footer-link">🌿 {t('nav.fertilizer')}</Link></li>
              <li><Link to="/insights" className="footer-link">📊 {t('nav.insights')}</Link></li>
            </ul>
          </Col>
          <Col md={4}>
            <h5 className="footer-title mb-3">{language === 'ur' ? 'خصوصیات' : 'Features'}</h5>
            <ul className="footer-links list-unstyled">
              <li className="footer-feature">✅ {t('feature.predictions')}</li>
              <li className="footer-feature">✅ {t('feature.analytics')}</li>
              <li className="footer-feature">✅ {language === 'ur' ? 'ماہر سفارشات' : 'Expert Recommendations'}</li>
              <li className="footer-feature">✅ {language === 'ur' ? 'حقیقی وقت کی بصیرتیں' : 'Real-time Insights'}</li>
            </ul>
          </Col>
        </Row>
        <hr className="footer-divider" />
        <Row>
          <Col className="text-center py-3">
            <p className="footer-copyright mb-0">
              <span className="copyright-icon">©</span> 2025 {t('login.title')}. {language === 'ur' ? 'تمام حقوق محفوظ ہیں۔' : 'All rights reserved.'} | 
              {language === 'ur' ? 'کسانوں کے لیے ڈیزائن کیا گیا' : 'Designed for farmers'} | {language === 'ur' ? 'مصنوعی ذہانت اور ڈیٹا سائنس سے چلایا گیا' : 'Powered by AI & Data Science'}
            </p>
          </Col>
        </Row>
      </Container>
      <style>{`
        .modern-footer {
          background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
          color: #ecf0f1;
        }

        .footer-brand {
          color: #28a745;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .footer-icon {
          font-size: 1.5rem;
          animation: bounce 2s ease-in-out infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        .footer-text {
          color: #bdc3c7;
          line-height: 1.6;
        }

        .footer-title {
          color: #ecf0f1;
          font-weight: 600;
        }

        .footer-links {
          line-height: 2;
        }

        .footer-link {
          color: #bdc3c7;
          text-decoration: none;
          transition: all 0.3s ease;
          display: inline-block;
        }

        .footer-link:hover {
          color: #28a745;
          transform: translateX(5px);
        }

        .footer-feature {
          color: #95a5a6;
          margin-bottom: 0.5rem;
        }

        .social-links {
          display: flex;
          gap: 1rem;
        }

        .social-icon {
          font-size: 1.5rem;
          cursor: pointer;
          transition: transform 0.3s ease;
        }

        .social-icon:hover {
          transform: scale(1.2);
        }

        .footer-divider {
          border-color: #34495e;
          margin: 0;
        }

        .footer-copyright {
          color: #7f8c8d;
          font-size: 0.9rem;
        }

        .copyright-icon {
          margin-right: 0.25rem;
        }
      `}</style>
    </footer>
  );
}

export default Footer;





