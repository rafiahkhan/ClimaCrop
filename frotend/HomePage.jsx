import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import Header from './Header';
import Footer from './Footer';
import { useLanguage } from './contexts/LanguageContext';

function HomePage({ username, onLogout }) {
  const [crops, setCrops] = useState([]);
  const [mainCrops, setMainCrops] = useState([]);
  const [stats, setStats] = useState(null);
  const { t, language, translateCrop } = useLanguage();

  useEffect(() => {
    fetch('http://127.0.0.1:8000/crops')
      .then(res => res.json())
      .then(data => {
        console.log('Crops data:', data); // Debug log
        const cropsList = data.crops && data.crops.length > 0 ? data.crops : ['Rice', 'Cotton', 'Maize'];
        const mainCropsList = data.main_crops && data.main_crops.length > 0 ? data.main_crops : ['Rice', 'Cotton', 'Maize'];
        setCrops(cropsList);
        setMainCrops(mainCropsList);
        // Get stats for first main crop if available
        if (mainCropsList.length > 0) {
          fetch(`http://127.0.0.1:8000/crop-statistics?crop=${encodeURIComponent(mainCropsList[0])}`)
            .then(res => res.json())
            .then(statsData => setStats(statsData.data || []))
            .catch(() => {});
        }
      })
      .catch(() => {
        // Set default crops if fetch fails
        setCrops(['Rice', 'Cotton', 'Maize']);
        setMainCrops(['Rice', 'Cotton', 'Maize']);
      });
  }, []);

  const statsChartData = stats ? stats.map(s => ({
    name: s.temp_category,
    [t('revenue.expectedRevenue')]: s.avg_expected_revenue || 0
  })) : [];

  const formatShortCurrency = (value) => {
    if (!value) return '0';
    if (value >= 1000000000) {
      return `Rs ${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
      return `Rs ${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `Rs ${(value / 1000).toFixed(1)}K`;
    }
    return `Rs ${value.toFixed(0)}`;
  };

  return (
    <>
      <Header username={username} onLogout={onLogout} />
      <div className="min-vh-100 d-flex flex-column">
        {/* Hero Section - Compact */}
        <div className="hero-section py-4 mb-4">
          <Container fluid className="px-4">
            <Row className="align-items-center">
              <Col md={8}>
                <h1 className="display-5 fw-bold mb-2 hero-title">{t('home.welcome')}</h1>
                <p className="lead mb-2 hero-subtitle">{t('home.subtitle')}</p>
                <p className="mb-0 small hero-description">{t('home.description')}</p>
              </Col>
            </Row>
          </Container>
          <style>{`
            .hero-section {
              background: linear-gradient(135deg, #2d5016 0%, #3d7a1f 50%, #4a9b25 100%);
              color: #ffffff;
            }
            [dir="rtl"] .hero-title {
              font-size: 2rem !important;
              line-height: 1.4 !important;
            }
            [dir="rtl"] .hero-subtitle {
              font-size: 1.1rem !important;
              line-height: 1.6 !important;
            }
            [dir="rtl"] .hero-description {
              font-size: 0.95rem !important;
              line-height: 1.7 !important;
            }
            .hero-section {
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            }
            [data-theme="dark"] .hero-section {
              background: linear-gradient(135deg, #1a2e0d 0%, #2d5016 50%, #3d7a1f 100%);
            }
            .hero-title, .hero-subtitle, .hero-description {
              color: #ffffff !important;
              text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
            }
            .hero-icon {
              filter: drop-shadow(3px 3px 6px rgba(0, 0, 0, 0.3));
            }
          `}</style>
        </div>

        <Container fluid className="flex-grow-1 pb-4 px-4">
          {/* Quick Stats Cards */}
          <Row className="g-3 mb-4">
            <Col md={3} sm={6}>
              <Card className="text-center border-0 shadow-sm stat-card stat-card-1 readable-card">
                <Card.Body className="p-3 readable-card-body">
                  <div className="stat-icon mb-2">🌾</div>
                  <h3 className="mb-0 readable-stat-number">{crops.length}</h3>
                  <small className="readable-stat-label">{t('home.availableCrops')}</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6}>
              <Card className="text-center border-0 shadow-sm stat-card stat-card-2 readable-card">
                <Card.Body className="p-3 readable-card-body">
                  <div className="stat-icon mb-2">📊</div>
                  <h3 className="mb-0 readable-stat-number">3</h3>
                  <small className="readable-stat-label">{t('home.aiModels')}</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6}>
              <Card className="text-center border-0 shadow-sm stat-card stat-card-3 readable-card">
                <Card.Body className="p-3 readable-card-body">
                  <div className="stat-icon mb-2">🎯</div>
                  <h3 className="mb-0 readable-stat-number">98%</h3>
                  <small className="readable-stat-label">{t('home.accuracy')}</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6}>
              <Card className="text-center border-0 shadow-sm stat-card stat-card-4 readable-card">
                <Card.Body className="p-3 readable-card-body">
                  <div className="stat-icon mb-2">⚡</div>
                  <h3 className="mb-0 readable-stat-number">24/7</h3>
                  <small className="readable-stat-label">{t('home.available')}</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Main Features - Enhanced */}
          <Row className="g-3 mb-4">
            <Col md={6} lg={4}>
              <Card className="h-100 shadow-lg border-0 hover-card feature-card feature-card-1 readable-card">
                <Card.Body className="text-center p-4 readable-card-body">
                  <div className="feature-icon-large mb-3">📊</div>
                  <Card.Title className="h5 mb-3 fw-bold readable-feature-title">{t('home.aiRevenue')}</Card.Title>
                  <Card.Text className="readable-feature-text mb-3">
                    {t('home.aiRevenueDesc')}
                  </Card.Text>
                  <Button as={Link} to="/revenue-prediction" variant="success" size="lg" className="w-100">
                    {language === 'ur' ? '← ' : ''}{t('revenue.getPredictions')}{language === 'en' ? ' →' : ''}
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={4}>
              <Card className="h-100 shadow-lg border-0 hover-card feature-card feature-card-2 readable-card">
                <Card.Body className="text-center p-4 readable-card-body">
                  <div className="feature-icon-large mb-3">🌿</div>
                  <Card.Title className="h5 mb-3 fw-bold readable-feature-title">{t('home.fertilizer')}</Card.Title>
                  <Card.Text className="readable-feature-text mb-3">
                    {t('home.fertilizerDesc')}
                  </Card.Text>
                  <Button as={Link} to="/fertilizer-pest-control" variant="success" size="lg" className="w-100">
                    {language === 'ur' ? '← ' : ''}{t('fertilizer.getRecommendations')}{language === 'en' ? ' →' : ''}
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={4}>
              <Card className="h-100 shadow-lg border-0 hover-card feature-card feature-card-3 readable-card">
                <Card.Body className="text-center p-4 readable-card-body">
                  <div className="feature-icon-large mb-3">📊</div>
                  <Card.Title className="h5 mb-3 fw-bold readable-feature-title">{t('home.insights')}</Card.Title>
                  <Card.Text className="readable-feature-text mb-3">
                    {t('home.insightsDesc')}
                  </Card.Text>
                  <Button as={Link} to="/insights" variant="info" size="lg" className="w-100">
                    {language === 'ur' ? '← ' : ''}{t('insights.title')}{language === 'en' ? ' →' : ''}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Last 2 Cards - Centered */}
          <Row className="g-3 mb-4 justify-content-center">
            <Col md={6} lg={4}>
              <Card className="h-100 shadow-lg border-0 hover-card feature-card feature-card-5 readable-card">
                <Card.Body className="text-center p-4 readable-card-body">
                  <div className="feature-icon-large mb-3">🔍</div>
                  <Card.Title className="h5 mb-3 fw-bold readable-feature-title">{t('home.compare')}</Card.Title>
                  <Card.Text className="readable-feature-text mb-3">
                    {t('home.compareDesc')}
                  </Card.Text>
                  <Button as={Link} to="/compare" variant="primary" size="lg" className="w-100">
                    {language === 'ur' ? '← ' : ''}{t('home.compare')}{language === 'en' ? ' →' : ''}
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={4}>
              <Card className="h-100 shadow-lg border-0 hover-card feature-card feature-card-6 readable-card">
                <Card.Body className="text-center p-4 readable-card-body">
                  <div className="feature-icon-large mb-3">📈</div>
                  <Card.Title className="h5 mb-3 fw-bold readable-feature-title">{t('home.trends')}</Card.Title>
                  <Card.Text className="readable-feature-text mb-3">
                    {t('home.trendsDesc')}
                  </Card.Text>
                  <Button as={Link} to="/trends" variant="secondary" size="lg" className="w-100">
                    {language === 'ur' ? '← ' : ''}{t('home.trends')}{language === 'en' ? ' →' : ''}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* How It Works - Compact */}
          <Card className="shadow-sm mb-4 border-0 readable-card">
            <Card.Body className="bg-light p-3 readable-card-body">
              <h3 className="text-center mb-3 text-success readable-heading">{t('home.howItWorks')}</h3>
              <Row>
                <Col md={4} className="text-center mb-3 mb-md-0">
                  <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2" 
                       style={{width: '60px', height: '60px', fontSize: '28px'}}>
                    1
                  </div>
                  <h6 className="fw-bold readable-text">{t('home.step1')}</h6>
                  <p className="readable-small-text small mb-0">
                    {t('home.step1Desc')}
                  </p>
                </Col>
                <Col md={4} className="text-center mb-3 mb-md-0">
                  <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2" 
                       style={{width: '60px', height: '60px', fontSize: '28px'}}>
                    2
                  </div>
                  <h6 className="fw-bold readable-text">{t('home.step2')}</h6>
                  <p className="readable-small-text small mb-0">
                    {t('home.step2Desc')}
                  </p>
                </Col>
                <Col md={4} className="text-center">
                  <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2" 
                       style={{width: '60px', height: '60px', fontSize: '28px'}}>
                    3
                  </div>
                  <h6 className="fw-bold readable-text">{t('home.step3')}</h6>
                  <p className="readable-small-text small mb-0">
                    {t('home.step3Desc')}
                  </p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Key Features - Side by Side */}
          <Row className="g-3">
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100 readable-card">
                <Card.Body className="p-3 readable-card-body">
                  <h5 className="text-success mb-2 readable-heading">{t('home.keyFeatures')}</h5>
                  <ul className="list-unstyled mb-0 small readable-text">
                    <li className="mb-1">{t('home.keyFeaturesDesc1')}</li>
                    <li className="mb-1">{t('home.keyFeaturesDesc2')}</li>
                    <li className="mb-1">{t('home.keyFeaturesDesc3')}</li>
                    <li className="mb-1">{t('home.keyFeaturesDesc4')}</li>
                    <li className="mb-1">{t('home.keyFeaturesDesc5')}</li>
                    <li>{t('home.keyFeaturesDesc6')}</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100 readable-card">
                <Card.Body className="p-3 readable-card-body">
                  <h5 className="text-success mb-2 readable-heading">{t('home.availableCrops')}</h5>
                  <div className="mb-2">
                    <strong className="small readable-text">{t('home.mainCrops')}:</strong>
                    <div className="mt-1">
                      {mainCrops.map(crop => (
                        <Badge bg="success" className="me-1 mb-1 readable-badge" key={crop}>{translateCrop(crop)}</Badge>
                      ))}
                    </div>
                  </div>
                  {crops.filter(c => !mainCrops.includes(c)).length > 0 && (
                    <div>
                      <strong className="small readable-text">{t('home.otherCrops')}:</strong>
                      <div className="mt-1">
                        {crops.filter(c => !mainCrops.includes(c)).slice(0, 5).map(crop => (
                          <Badge bg="secondary" className="me-1 mb-1 readable-badge" key={crop}>{translateCrop(crop)}</Badge>
                        ))}
                        {crops.filter(c => !mainCrops.includes(c)).length > 5 && (
                          <Badge bg="light" text="dark" className="readable-badge">+{crops.filter(c => !mainCrops.includes(c)).length - 5} more</Badge>
                        )}
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
        <Footer />
      </div>
      <style>{`
        .hover-card {
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .hover-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 12px 30px rgba(0,0,0,0.2) !important;
        }

        .stat-card {
          transition: all 0.3s ease;
          border-left: 4px solid transparent !important;
        }
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.15) !important;
        }
        .stat-card-1 {
          border-left-color: #28a745 !important;
        }
        .stat-card-2 {
          border-left-color: #007bff !important;
        }
        .stat-card-3 {
          border-left-color: #ffc107 !important;
        }
        .stat-card-4 {
          border-left-color: #dc3545 !important;
        }

        .stat-icon {
          font-size: 2.5rem;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .feature-card {
          position: relative;
          overflow: hidden;
        }

        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.5s;
        }

        .feature-card:hover::before {
          left: 100%;
        }

        .feature-icon-large {
          font-size: 4rem;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .feature-card-1 {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }
        .feature-card-2 {
          background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
        }
        .feature-card-3 {
          background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
        }
        .feature-card-4 {
          background: linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%);
        }
        .feature-card-5 {
          background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%);
        }
        .feature-card-6 {
          background: linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%);
        }

        /* Dark mode text readability for homepage */
        .readable-stat-number {
          color: #2c3e50 !important;
          font-weight: 700 !important;
        }
        [data-theme="dark"] .readable-stat-number {
          color: #ffffff !important;
        }

        .readable-stat-label {
          color: #6c757d !important;
        }
        [data-theme="dark"] .readable-stat-label {
          color: #b0b0b0 !important;
        }

        .readable-feature-title {
          color: #2c3e50 !important;
        }
        [data-theme="dark"] .readable-feature-title {
          color: #ffffff !important;
        }

        .readable-feature-text {
          color: #6c757d !important;
        }
        [data-theme="dark"] .readable-feature-text {
          color: #d0d0d0 !important;
        }

        /* Ensure feature cards have readable backgrounds in dark mode */
        [data-theme="dark"] .feature-card-1,
        [data-theme="dark"] .feature-card-2,
        [data-theme="dark"] .feature-card-3,
        [data-theme="dark"] .feature-card-4,
        [data-theme="dark"] .feature-card-5,
        [data-theme="dark"] .feature-card-6 {
          background: linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%) !important;
        }
      `}</style>
    </>
  );
}

export default HomePage;
