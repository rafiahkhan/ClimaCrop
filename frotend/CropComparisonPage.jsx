import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Badge } from 'react-bootstrap';
import {
  BarChart,
  Bar,
  LabelList,
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

function CropComparisonPage({ username, onLogout }) {
  const { t, language, translateCrop, translateTemp } = useLanguage();
  const [crops, setCrops] = useState([]);
  const [cropA, setCropA] = useState('');
  const [cropB, setCropB] = useState('');
  const [temp, setTemp] = useState('Best');
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState(null);

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

  useEffect(() => {
    fetch('http://127.0.0.1:8000/crops')
      .then(res => res.json())
      .then(data => {
        const list = data.crops && data.crops.length ? data.crops : ['Rice', 'Cotton', 'Maize'];
        setCrops(list);
        setCropA(list[0] || '');
        setCropB(list[1] || list[0] || '');
      })
      .catch(() => {
        const fallback = ['Rice', 'Cotton', 'Maize'];
        setCrops(fallback);
        setCropA(fallback[0]);
        setCropB(fallback[1]);
      });
  }, []);

  const fetchPrediction = async (cropName) => {
    const res = await fetch(`http://127.0.0.1:8000/revenue-prediction?crop=${encodeURIComponent(cropName)}&temp=${encodeURIComponent(temp)}`);
    const data = await res.json();
    if (data?.data?.length) {
      return data.data[0];
    }
    return null;
  };

  const handleCompare = async () => {
    if (!cropA || !cropB) return;
    setLoading(true);
    try {
      const [aData, bData] = await Promise.all([
        fetchPrediction(cropA),
        fetchPrediction(cropB)
      ]);

      setComparison({
        a: aData,
        b: bData
      });
    } catch (err) {
      console.error('Comparison error', err);
    } finally {
      setLoading(false);
    }
  };

  const buildRevenueData = () => {
    if (!comparison) return [];
    const { a, b } = comparison;
    return [
      {
        name: cropA,
        Expected: a?.expected_revenue || 0,
        DecisionTree: a?.Decision_Tree_Predicted_Revenue || 0,
        XGBoost: a?.XGBoost_Predicted_Revenue || a?.XGBoost_Tuned_Predicted_Revenue || 0,
        RandomForest: a?.Random_Forest_Predicted_Revenue || 0
      },
      {
        name: cropB,
        Expected: b?.expected_revenue || 0,
        DecisionTree: b?.Decision_Tree_Predicted_Revenue || 0,
        XGBoost: b?.XGBoost_Predicted_Revenue || b?.XGBoost_Tuned_Predicted_Revenue || 0,
        RandomForest: b?.Random_Forest_Predicted_Revenue || 0
      }
    ];
  };

  const buildYieldData = () => {
    if (!comparison) return [];
    const { a, b } = comparison;
    return [
      {
        name: t('compare.yield'),
        [cropA]: a?.avg_yield_kg_per_acre || 0,
        [cropB]: b?.avg_yield_kg_per_acre || 0
      },
      {
        name: t('compare.climateScore'),
        [cropA]: (a?.climate_score || 0) * 10,
        [cropB]: (b?.climate_score || 0) * 10
      }
    ];
  };

  const buildRadarData = () => {
    if (!comparison) return [];
    const { a, b } = comparison;
    return [
      {
        metric: t('revenue.expectedRevenue'),
        [cropA]: a?.expected_revenue || 0,
        [cropB]: b?.expected_revenue || 0
      },
      {
        metric: t('revenue.yield'),
        [cropA]: a?.avg_yield_kg_per_acre || 0,
        [cropB]: b?.avg_yield_kg_per_acre || 0
      },
      {
        metric: t('revenue.climateScore'),
        [cropA]: (a?.climate_score || 0) * 10,
        [cropB]: (b?.climate_score || 0) * 10
      }
    ];
  };

  const bestPick =
    comparison?.a && comparison?.b
      ? (comparison.a.expected_revenue || 0) >= (comparison.b.expected_revenue || 0)
        ? { label: cropA, data: comparison.a }
        : { label: cropB, data: comparison.b }
      : null;

  return (
    <>
      <Header username={username} onLogout={onLogout} />
      <div className="min-vh-100 d-flex flex-column bg-light">
        <div className="hero-section-insights py-4 mb-4">
          <Container fluid className="px-4">
            <Row className="align-items-center">
              <Col>
                <h1 className="display-5 fw-bold mb-2 hero-title">{t('compare.title')}</h1>
                <p className="lead mb-0 hero-subtitle">{t('compare.subtitle')}</p>
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
                  <h6 className="mb-0">{t('compare.compare')}</h6>
                </Card.Header>
                <Card.Body className="p-3">
                  <div className="d-flex flex-column gap-3 compact-form">
                    <Form.Group className="mb-0">
                      <Form.Label className="fw-bold small mb-1">{t('compare.selectCropA')}</Form.Label>
                      <Form.Select value={cropA} onChange={(e) => setCropA(e.target.value)} size="sm">
                        {crops.map(c => <option key={c} value={c}>{translateCrop(c)}</option>)}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-0">
                      <Form.Label className="fw-bold small mb-1">{t('compare.selectCropB')}</Form.Label>
                      <Form.Select value={cropB} onChange={(e) => setCropB(e.target.value)} size="sm">
                        {crops.map(c => <option key={c} value={c}>{translateCrop(c)}</option>)}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-0">
                      <Form.Label className="fw-bold small mb-1">{t('compare.selectTemp')}</Form.Label>
                      <Form.Select value={temp} onChange={(e) => setTemp(e.target.value)} size="sm">
                        {TEMP_OPTIONS.map(opt => <option key={opt} value={opt}>{translateTemp(opt)}</option>)}
                      </Form.Select>
                    </Form.Group>
                    <Button className="w-100" size="sm" variant="success" onClick={handleCompare} disabled={loading}>
                      {loading ? <><Spinner size="sm" className="me-2" />{t('common.loading')}</> : t('compare.compare')}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={8}>
              <Card className="shadow-sm h-100 border-0">
                <Card.Header className="bg-success text-white py-2">
                  <h6 className="mb-0">{t('compare.revenueComparison')}</h6>
                </Card.Header>
                <Card.Body className="p-3">
                  {comparison ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={buildRevenueData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => formatShortCurrency(value)} />
                        <Tooltip formatter={(value) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(value)} />
                        <Legend />
                        <Bar dataKey="Expected" fill="#28a745">
                          <LabelList dataKey="Expected" position="top" formatter={(value) => formatShortCurrency(value)} style={{ fontSize: '11px', fill: '#333', fontWeight: 'bold' }} />
                        </Bar>
                        <Bar dataKey="DecisionTree" fill="#007bff">
                          <LabelList dataKey="DecisionTree" position="top" formatter={(value) => formatShortCurrency(value)} style={{ fontSize: '11px', fill: '#333', fontWeight: 'bold' }} />
                        </Bar>
                        <Bar dataKey="XGBoost" fill="#ffc107">
                          <LabelList dataKey="XGBoost" position="top" formatter={(value) => formatShortCurrency(value)} style={{ fontSize: '11px', fill: '#333', fontWeight: 'bold' }} />
                        </Bar>
                        <Bar dataKey="RandomForest" fill="#dc3545">
                          <LabelList dataKey="RandomForest" position="top" formatter={(value) => formatShortCurrency(value)} style={{ fontSize: '11px', fill: '#333', fontWeight: 'bold' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-muted text-center small py-4">
                      {language === 'ur' ? 'موازنہ دیکھنے کے لیے دو فصلوں کا انتخاب کریں' : 'Select two crops to view comparison'}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {comparison ? (
            <>
              {bestPick && (
                <Card className="shadow-sm mb-3 border-success border-2">
                  <Card.Header className="bg-success text-white">
                    <h6 className="mb-0">{t('compare.bestPick')}</h6>
                  </Card.Header>
                  <Card.Body>
                    <Row className="align-items-center">
                      <Col md={8}>
                        <h4 className="fw-bold mb-2">{bestPick.label}</h4>
                        <p className="mb-1">{t('compare.expectedRevenue')}: <strong className="text-success">{bestPick.data?.expected_revenue?.toLocaleString() || 'N/A'}</strong></p>
                        <p className="mb-1">{t('compare.yield')}: <strong>{bestPick.data?.avg_yield_kg_per_acre?.toFixed(1) || 'N/A'}</strong> kg/acre</p>
                        <p className="mb-0">{t('compare.climateScore')}: <strong>{((bestPick.data?.climate_score || 0) * 10).toFixed(1)}</strong></p>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}
              <Row className="g-3 mb-3">
                <Col lg={6}>
                  <Card className="shadow-sm border-0 h-100">
                    <Card.Header className="bg-info text-white">
                      <h6 className="mb-0">{t('compare.yieldComparison')}</h6>
                    </Card.Header>
                    <Card.Body>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={buildYieldData()} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="name" />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey={cropA} fill="#28a745">
                            <LabelList dataKey={cropA} position="right" style={{ fontSize: '11px', fill: '#333' }} />
                          </Bar>
                          <Bar dataKey={cropB} fill="#6f42c1">
                            <LabelList dataKey={cropB} position="right" style={{ fontSize: '11px', fill: '#333' }} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>
                <Col lg={6}>
                  <Card className="shadow-sm border-0 h-100">
                    <Card.Header className="bg-warning text-dark">
                      <h6 className="mb-0">{t('compare.modelBreakdown')}</h6>
                    </Card.Header>
                    <Card.Body>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={buildRadarData()} layout="vertical" margin={{ left: 20, right: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="metric" />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey={cropA} fill="#28a745">
                            <LabelList dataKey={cropA} position="right" style={{ fontSize: '11px', fill: '#333', fontWeight: 'bold' }} />
                          </Bar>
                          <Bar dataKey={cropB} fill="#dc3545">
                            <LabelList dataKey={cropB} position="right" style={{ fontSize: '11px', fill: '#333', fontWeight: 'bold' }} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row className="g-3">
                {[{ label: cropA, data: comparison.a }, { label: cropB, data: comparison.b }].map(item => (
                  <Col md={6} key={item.label}>
                    <Card className="shadow-sm border-0 crop-comparison-card">
                      <Card.Header className="bg-light crop-card-header">
                        <h6 className="mb-0 fw-bold crop-card-title">{item.label}</h6>
                      </Card.Header>
                      <Card.Body className="crop-card-body">
                        <div className="d-flex flex-wrap gap-2">
                          <Badge bg="success" className="crop-badge">{t('compare.expectedRevenue')}: {item.data?.expected_revenue?.toLocaleString() || 'N/A'}</Badge>
                          <Badge bg="info" className="crop-badge">{t('compare.yield')}: {item.data?.avg_yield_kg_per_acre?.toFixed(1) || 'N/A'}</Badge>
                          <Badge bg="warning" text="dark" className="crop-badge">{t('compare.climateScore')}: {((item.data?.climate_score || 0) * 10).toFixed(1)}</Badge>
                          <Badge bg="secondary" className="crop-badge">{t('revenue.district')}: {item.data?.district || 'N/A'}</Badge>
                          <Badge bg="primary" className="crop-badge">{t('revenue.season')}: {item.data?.season || 'N/A'}</Badge>
                          <Badge bg="dark" className="crop-badge">{t('revenue.soil')}: {item.data?.soil_type || 'N/A'}</Badge>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
              <style>{`
                .crop-comparison-card {
                  background-color: #ffffff !important;
                }
                [data-theme="dark"] .crop-comparison-card {
                  background-color: #2d2d2d !important;
                }
                .crop-card-header {
                  background-color: #f8f9fa !important;
                  border-bottom: 1px solid #dee2e6 !important;
                }
                [data-theme="dark"] .crop-card-header {
                  background-color: #3a3a3a !important;
                  border-bottom-color: #404040 !important;
                }
                .crop-card-title {
                  color: #2c3e50 !important;
                  font-weight: 700 !important;
                }
                [data-theme="dark"] .crop-card-title {
                  color: #ffffff !important;
                }
                .crop-card-body {
                  color: #2c3e50 !important;
                  background-color: #ffffff !important;
                }
                [data-theme="dark"] .crop-card-body {
                  color: #e8e8e8 !important;
                  background-color: #2d2d2d !important;
                }
                .crop-badge {
                  color: #ffffff !important;
                  font-weight: 500 !important;
                  padding: 0.5rem 0.75rem !important;
                }
                .crop-badge.bg-warning {
                  color: #000000 !important;
                }
                [data-theme="dark"] .crop-badge {
                  color: #ffffff !important;
                }
                [data-theme="dark"] .crop-badge.bg-warning {
                  color: #000000 !important;
                }
              `}</style>
            </>
          ) : (
            <Card className="text-center py-5 border-0 shadow-sm">
              <Card.Body>
                <h4>{t('compare.noData')}</h4>
              </Card.Body>
            </Card>
          )}
        </Container>
        <Footer />
      </div>
    </>
  );
}

export default CropComparisonPage;

