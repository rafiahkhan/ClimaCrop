import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Badge } from 'react-bootstrap';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import Header from './Header';
import Footer from './Footer';
import { useLanguage } from './contexts/LanguageContext';

const TEMP_OPTIONS = ['Best', 'Average', 'Worst'];

function TrendAnalysisPage({ username, onLogout }) {
  const { t, language, translateCrop } = useLanguage();
  const [crops, setCrops] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [loading, setLoading] = useState(false);
  const [trendData, setTrendData] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/crops')
      .then(res => res.json())
      .then(data => {
        const list = data.crops && data.crops.length ? data.crops : ['Rice', 'Cotton', 'Maize'];
        setCrops(list);
        setSelectedCrop(list[0] || '');
      })
      .catch(() => {
        const fallback = ['Rice', 'Cotton', 'Maize'];
        setCrops(fallback);
        setSelectedCrop(fallback[0]);
      });
  }, []);

  const fetchTempData = async (temp) => {
    const res = await fetch(`http://127.0.0.1:8000/revenue-prediction?crop=${encodeURIComponent(selectedCrop)}&temp=${encodeURIComponent(temp)}`);
    const data = await res.json();
    if (data?.data?.length) {
      const item = data.data[0];
      return {
        temp,
        expected_revenue: item.expected_revenue || 0,
        yield: item.avg_yield_kg_per_acre || 0,
        rainfall: item.rainfall || 0,
        humidity: item.humidity || 0,
        climate_score: item.climate_score || 0,
        climate_risk_level: item.climate_risk_level || '',
        season: item.season || '',
        district: item.district || '',
      };
    }
    return null;
  };

  const handleTrends = async () => {
    if (!selectedCrop) return;
    setLoading(true);
    try {
      const results = await Promise.all(TEMP_OPTIONS.map(fetchTempData));
      setTrendData(results.filter(Boolean));
    } catch (err) {
      console.error('Trend fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  const revenueSeries = trendData ? trendData.map(item => ({
    name: item.temp,
    Revenue: item.expected_revenue / 1000000,
    Yield: item.yield,
    Climate: (item.climate_score || 0) * 10
  })) : [];

  const climateSeries = trendData ? trendData.map(item => ({
    name: item.temp,
    Rainfall: item.rainfall,
    Humidity: item.humidity
  })) : [];

  const summary = trendData && trendData.length
    ? {
        avgRevenue: trendData.reduce((s, i) => s + i.expected_revenue, 0) / trendData.length,
        avgYield: trendData.reduce((s, i) => s + i.yield, 0) / trendData.length,
        risk: trendData[0].climate_risk_level || ''
      }
    : null;

  return (
    <>
      <Header username={username} onLogout={onLogout} />
      <div className="min-vh-100 d-flex flex-column bg-light">
        <div className="hero-section-insights py-4 mb-4">
          <Container fluid className="px-4">
            <Row className="align-items-center">
              <Col>
                <h1 className="display-5 fw-bold mb-2 hero-title">{t('trends.title')}</h1>
                <p className="lead mb-0 hero-subtitle">{t('trends.subtitle')}</p>
              </Col>
            </Row>
          </Container>
          <style>{`
            .hero-section-insights {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #ffffff;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            }
            [data-theme="dark"] .hero-section-insights {
              background: linear-gradient(135deg, #4a5568 0%, #5a3d7a 100%);
            }
            .hero-title, .hero-subtitle {
              color: #ffffff !important;
              text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
            }
          `}</style>
        </div>

        <Container fluid className="flex-grow-1 pb-4 px-4">
          {/* Filters + Preview stacked row */}
          <Row className="g-3 align-items-stretch mb-4">
            <Col lg={4}>
              <Card className="shadow-sm h-100 border-0">
                <Card.Header className="bg-success text-white py-2">
                  <h6 className="mb-0">{t('trends.viewTrends')}</h6>
                </Card.Header>
                <Card.Body className="p-3">
                  <div className="d-flex flex-column gap-3 compact-form">
                    <Form.Group className="mb-0">
                      <Form.Label className="fw-bold small mb-1">{t('trends.selectCrop')}</Form.Label>
                      <Form.Select value={selectedCrop} onChange={(e) => setSelectedCrop(e.target.value)} size="sm">
                        {crops.map(c => <option key={c} value={c}>{translateCrop(c)}</option>)}
                      </Form.Select>
                    </Form.Group>
                    <Button className="w-100" size="sm" variant="success" onClick={handleTrends} disabled={loading}>
                      {loading ? <><Spinner size="sm" className="me-2" />{t('common.loading')}</> : t('trends.viewTrends')}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={8}>
              <Card className="shadow-sm h-100 border-0">
                <Card.Header className="bg-success text-white py-2">
                  <h6 className="mb-0">{t('trends.revenueTrend')}</h6>
                </Card.Header>
                <Card.Body className="p-3">
                  {trendData && trendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={revenueSeries}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="Revenue" stroke="#28a745" strokeWidth={3} />
                        <Line type="monotone" dataKey="Yield" stroke="#007bff" strokeWidth={3} />
                        <Line type="monotone" dataKey="Climate" stroke="#ffc107" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-muted text-center small py-4">
                      {language === 'ur' ? 'رجحانات دیکھنے کے لیے فصل منتخب کریں' : 'Select a crop to view trends overview'}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {trendData && trendData.length ? (
            <>
              <Row className="g-3 mb-3">
                <Col lg={6}>
                  <Card className="shadow-sm border-0 h-100">
                    <Card.Header className="bg-primary text-white">
                      <h6 className="mb-0">{t('trends.revenueTrend')}</h6>
                    </Card.Header>
                    <Card.Body>
                      <ResponsiveContainer width="100%" height={320}>
                        <LineChart data={revenueSeries}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="Revenue" stroke="#28a745" strokeWidth={3} />
                          <Line type="monotone" dataKey="Yield" stroke="#007bff" strokeWidth={3} />
                          <Line type="monotone" dataKey="Climate" stroke="#ffc107" strokeWidth={3} />
                        </LineChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>
                <Col lg={6}>
                  <Card className="shadow-sm border-0 h-100">
                    <Card.Header className="bg-info text-white">
                      <h6 className="mb-0">{t('trends.climateTrend')}</h6>
                    </Card.Header>
                    <Card.Body>
                      <ResponsiveContainer width="100%" height={320}>
                        <AreaChart data={climateSeries}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Area type="monotone" dataKey="Rainfall" stroke="#17a2b8" fill="#17a2b8" fillOpacity={0.45} />
                          <Area type="monotone" dataKey="Humidity" stroke="#6f42c1" fill="#6f42c1" fillOpacity={0.35} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row className="g-3">
                <Col lg={4}>
                  <Card className="shadow-sm border-0 h-100 readable-card">
                    <Card.Header className="bg-success text-white">
                      <h6 className="mb-0">{t('trends.modelSummary')}</h6>
                    </Card.Header>
                    <Card.Body className="readable-card-body">
                      <div className="d-flex flex-column gap-2">
                        <Badge bg="success" className="readable-badge">{t('trends.avgRevenue')}: {summary?.avgRevenue?.toLocaleString() || 'N/A'}</Badge>
                        <Badge bg="info" className="readable-badge">{t('trends.avgYield')}: {summary?.avgYield?.toFixed(1) || 'N/A'}</Badge>
                        <Badge bg="warning" text="dark" className="readable-badge">{t('trends.riskLevel')}: {summary?.risk || 'N/A'}</Badge>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                {trendData.map(item => (
                  <Col lg={4} key={item.temp}>
                    <Card className="shadow-sm border-0 h-100 readable-card">
                      <Card.Header className="bg-light readable-card-header">
                        <h6 className="mb-0 fw-bold readable-header-text">{item.temp}</h6>
                      </Card.Header>
                      <Card.Body className="readable-card-body">
                        <div className="d-flex flex-column gap-2">
                          <Badge bg="success" className="readable-badge">{t('revenue.expectedRevenue')}: {item.expected_revenue?.toLocaleString() || 'N/A'}</Badge>
                          <Badge bg="info" className="readable-badge">{t('revenue.yield')}: {item.yield?.toFixed(1) || 'N/A'}</Badge>
                          <Badge bg="dark" className="readable-badge">{t('revenue.season')}: {item.season || 'N/A'}</Badge>
                          <Badge bg="secondary" className="readable-badge">{t('revenue.district')}: {item.district || 'N/A'}</Badge>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </>
          ) : (
            <Card className="text-center py-5 border-0 shadow-sm">
              <Card.Body>
                <h4>{t('insights.selectCropToView')}</h4>
                <p className="text-muted mb-0">{t('insights.selectCropDesc')}</p>
              </Card.Body>
            </Card>
          )}
        </Container>
        <Footer />
      </div>
    </>
  );
}

export default TrendAnalysisPage;

