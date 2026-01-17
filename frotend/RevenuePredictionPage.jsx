import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge, ProgressBar } from 'react-bootstrap';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import Header from './Header';
import Footer from './Footer';
import ActionButtons from './components/ActionButtons';
import { useLanguage } from './contexts/LanguageContext';

const COLORS = ['#28a745', '#007bff', '#ffc107', '#dc3545', '#17a2b8'];

function RevenuePredictionPage({ username, onLogout }) {
  const { t, language, translateCrop, translateTemp } = useLanguage();
  const [crops, setCrops] = useState([]);
  const [mainCrops, setMainCrops] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedTemp, setSelectedTemp] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [statistics, setStatistics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/crops')
      .then(res => res.json())
      .then(data => {
        console.log('Crops data:', data); // Debug log
        const cropsList = data.crops && data.crops.length > 0 ? data.crops : ['Rice', 'Cotton', 'Maize'];
        const mainCropsList = data.main_crops && data.main_crops.length > 0 ? data.main_crops : ['Rice', 'Cotton', 'Maize'];
        setCrops(cropsList);
        setMainCrops(mainCropsList);
        setError(null);
      })
      .catch(err => {
        console.error('Error fetching crops:', err);
        // Set default crops if fetch fails
        setCrops(['Rice', 'Cotton', 'Maize']);
        setMainCrops(['Rice', 'Cotton', 'Maize']);
        setError('Using default crops. Backend may not be running.');
      });
  }, []);

  useEffect(() => {
    if (selectedCrop) {
      setLoadingStats(true);
      fetch(`http://127.0.0.1:8000/crop-statistics?crop=${encodeURIComponent(selectedCrop)}`)
        .then(res => res.json())
        .then(data => {
          setStatistics(data.data || []);
          setLoadingStats(false);
        })
        .catch(err => {
          setLoadingStats(false);
        });
    }
  }, [selectedCrop]);

  const handlePredict = (e) => {
    e.preventDefault();
    if (!selectedCrop || !selectedTemp) {
      setError(t('revenue.selectCrop') + ' & ' + t('revenue.selectTemp'));
      return;
    }

    setLoading(true);
    setError(null);
    
    fetch(`http://127.0.0.1:8000/revenue-prediction?crop=${encodeURIComponent(selectedCrop)}&temp=${encodeURIComponent(selectedTemp)}`)
      .then(res => res.json())
      .then(data => {
        console.log('Revenue Prediction API Response:', data); // Debug log
        if (data.error) {
          setError(data.error);
          setPredictions([]);
        } else {
          const results = data.data || [];
          console.log('Predictions received:', results.length, 'items'); // Debug log
          setPredictions(results);
          if (results.length === 0) {
            setError('No predictions found for the selected criteria. Make sure data is loaded in the database.');
          } else {
            setError(null); // Clear error if data is found
          }
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch predictions: ' + err.message);
        setLoading(false);
      });
  };

  const formatCurrency = (value) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0
    }).format(value);
  };

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

  // Prepare chart data
  const revenueChartData = predictions.slice(0, 5).map(pred => ({
    name: pred.variety || 'Variety',
    'Decision Tree': pred.decision_tree_revenue || 0,
    'XGBoost': pred.xgboost_revenue || 0,
    'Random Forest': pred.random_forest_revenue || 0,
    'Expected': pred.expected_revenue || 0
  }));

  const climateData = predictions.slice(0, 5).map(pred => ({
    name: pred.variety || 'Variety',
    'Rainfall': pred.rainfall || 0,
    'Humidity': pred.humidity || 0,
    'Climate Score': (pred.climate_score || 0) * 10
  }));

  const avgRevenueByTemp = statistics.map(stat => ({
    name: stat.temp_category,
    [t('revenue.expectedRevenue')]: stat.avg_expected_revenue || 0
  }));

  const getBestPrediction = () => {
    if (predictions.length === 0) return null;
    return predictions.reduce((best, current) => 
      (current.expected_revenue || 0) > (best.expected_revenue || 0) ? current : best
    );
  };

  const bestPred = getBestPrediction();
  const avgRevenue = predictions.length > 0 
    ? predictions.reduce((sum, p) => sum + (p.expected_revenue || 0), 0) / predictions.length 
    : 0;

  return (
    <>
      <Header username={username} onLogout={onLogout} />
      <div className="min-vh-100 d-flex flex-column bg-light">
        {/* Page Header */}
        <div className="hero-section-insights py-4 mb-4">
          <Container fluid className="px-4">
            <Row className="align-items-center">
              <Col>
                <h1 className="display-5 fw-bold mb-2 hero-title">{t('revenue.title')}</h1>
                <p className="lead mb-0 hero-subtitle">{t('revenue.subtitle')}</p>
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
        <Container fluid className="flex-grow-1 py-4 px-4">

          {/* Filters + Overview stacked row */}
          <Row className="g-3 align-items-stretch">
            <Col lg={4}>
              <Card className="shadow-sm h-100 border-0">
                <Card.Header className="bg-success text-white py-2">
                  <h6 className="mb-0">{t('revenue.getPredictions')}</h6>
                </Card.Header>
                <Card.Body className="p-3">
                  <Form onSubmit={handlePredict} className="d-flex flex-column gap-3 compact-form">
                    <Form.Group className="mb-0">
                      <Form.Label className="fw-bold small mb-1">{t('revenue.selectCrop')}</Form.Label>
                      <Form.Select 
                        value={selectedCrop} 
                        onChange={(e) => {
                          setSelectedCrop(e.target.value);
                          setPredictions([]);
                        }}
                        size="sm"
                        required
                      >
                        <option value="">{t('common.chooseCrop')}</option>
                        {(mainCrops.length > 0 ? mainCrops : ['Rice', 'Cotton', 'Maize']).map(crop => (
                          <option key={crop} value={crop}>{translateCrop(crop)}</option>
                        ))}
                        {crops.filter(c => !mainCrops.includes(c) && !['Rice', 'Cotton', 'Maize'].includes(c)).length > 0 && (
                          <optgroup label={t('common.otherCrops')}>
                            {crops.filter(c => !mainCrops.includes(c) && !['Rice', 'Cotton', 'Maize'].includes(c)).map(crop => (
                              <option key={crop} value={crop}>{translateCrop(crop)}</option>
                            ))}
                          </optgroup>
                        )}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-0">
                      <Form.Label className="fw-bold small mb-1">{t('revenue.selectTemp')}</Form.Label>
                      <Form.Select 
                        value={selectedTemp} 
                        onChange={(e) => setSelectedTemp(e.target.value)}
                        size="sm"
                        required
                      >
                        <option value="">{t('common.chooseTemp')}</option>
                        <option value="Best">{t('revenue.bestConditions')}</option>
                        <option value="Average">{t('revenue.averageConditions')}</option>
                        <option value="Worst">{t('revenue.worstConditions')}</option>
                      </Form.Select>
                    </Form.Group>
                    <Button 
                      variant="success" 
                      type="submit" 
                      size="sm"
                      className="w-100"
                      disabled={loading}
                    >
                      {loading ? <><Spinner size="sm" className="me-2" />{t('common.loading')}</> : t('revenue.getPredictions')}
                    </Button>
                  </Form>
                  {error && (
                    <Alert variant="danger" dismissible onClose={() => setError(null)} className="mt-3 mb-0 py-2">
                      <strong>Error:</strong> {error}
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col lg={8}>
              <Card className="shadow-sm h-100 border-0">
                <Card.Header className="bg-success text-white py-2">
                  <h6 className="mb-0">{t('revenue.overview')}</h6>
                </Card.Header>
                <Card.Body className="p-3">
                  {statistics.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={avgRevenueByTemp}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => formatShortCurrency(value)} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey={t('revenue.expectedRevenue')} fill="#28a745">
                          <LabelList dataKey={t('revenue.expectedRevenue')} position="top" formatter={(value) => formatShortCurrency(value)} style={{ fontSize: '11px', fill: '#333', fontWeight: 'bold' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-muted text-center small py-4">
                      {language === 'ur' ? 'تجزیہ کے لیے فصل منتخب کریں' : 'Select a crop to view revenue overview'}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Best Prediction Highlight - Compact */}
          {bestPred && (
            <Card className="shadow-sm mb-3 border-success border-2 readable-card">
              <Card.Body className="bg-success bg-opacity-10 p-3 readable-card-body">
                <Row className="align-items-center">
                  <Col md={8}>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h5 className="text-success mb-2 readable-heading">{t('revenue.bestVariety')}</h5>
                        <h4 className="fw-bold mb-1 readable-heading">{bestPred.variety || 'N/A'}</h4>
                      </div>
                      <ActionButtons item={bestPred} type="prediction" />
                    </div>
                    <p className="mb-1 readable-text">{t('revenue.expectedRevenue')}: <span className="fw-bold text-success fs-5">{formatCurrency(bestPred.expected_revenue)}</span></p>
                    <div className="d-flex gap-2 flex-wrap">
                      <Badge bg="info" className="readable-badge">{t('revenue.yield')}: {bestPred.avg_yield_kg_per_acre ? bestPred.avg_yield_kg_per_acre.toFixed(2) : 'N/A'} kg/acre</Badge>
                      <Badge bg={bestPred.climate_risk_level === 'Low' ? 'success' : bestPred.climate_risk_level === 'Medium' ? 'warning' : 'danger'} className="readable-badge">
                        {t('revenue.risk')}: {bestPred.climate_risk_level || 'N/A'}
                      </Badge>
                    </div>
                  </Col>
                  <Col md={4} className="text-end">
                    <div className="p-2 bg-white rounded shadow readable-card">
                      <small className="text-muted d-block readable-small-text">{t('revenue.averageRevenue')}</small>
                      <h3 className="text-success mb-0 readable-heading">{formatCurrency(avgRevenue)}</h3>
                      <small className="text-muted readable-small-text">{t('revenue.acrossAll')}</small>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          {/* Charts Row - Side by Side */}
          {predictions.length > 0 && (
            <Row className="g-3 mb-3">
              <Col lg={6}>
                <Card className="shadow-sm border-0 h-100">
                  <Card.Header className="bg-primary text-white py-2">
                    <h6 className="mb-0">{t('revenue.comparison')}</h6>
                  </Card.Header>
                  <Card.Body className="p-2">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={revenueChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={10} />
                        <YAxis fontSize={10} tickFormatter={(value) => formatShortCurrency(value)} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey={t('revenue.expectedRevenue')} fill="#28a745">
                          <LabelList dataKey={t('revenue.expectedRevenue')} position="top" formatter={(value) => formatShortCurrency(value)} style={{ fontSize: '10px', fill: '#333', fontWeight: 'bold' }} />
                        </Bar>
                        <Bar dataKey="Decision Tree" fill="#007bff">
                          <LabelList dataKey="Decision Tree" position="top" formatter={(value) => formatShortCurrency(value)} style={{ fontSize: '10px', fill: '#333', fontWeight: 'bold' }} />
                        </Bar>
                        <Bar dataKey="XGBoost" fill="#ffc107">
                          <LabelList dataKey="XGBoost" position="top" formatter={(value) => formatShortCurrency(value)} style={{ fontSize: '10px', fill: '#333', fontWeight: 'bold' }} />
                        </Bar>
                        <Bar dataKey="Random Forest" fill="#dc3545">
                          <LabelList dataKey="Random Forest" position="top" formatter={(value) => formatShortCurrency(value)} style={{ fontSize: '10px', fill: '#333', fontWeight: 'bold' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={6}>
                <Card className="shadow-sm border-0 h-100">
                  <Card.Header className="bg-info text-white py-2">
                    <h6 className="mb-0">{t('revenue.climateFactors')}</h6>
                  </Card.Header>
                  <Card.Body className="p-2">
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={climateData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={10} />
                        <YAxis fontSize={10} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Line type="monotone" dataKey="Rainfall" stroke="#17a2b8" strokeWidth={2} />
                        <Line type="monotone" dataKey="Humidity" stroke="#28a745" strokeWidth={2} />
                        <Line type="monotone" dataKey="Climate Score" stroke="#ffc107" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Climate Insights - Compact Grid */}
          {predictions.length > 0 && (
            <Row className="g-2 mb-3">
              {predictions.slice(0, 3).map((pred, idx) => (
                <Col md={4} key={idx}>
                  <Card className="h-100 shadow-sm border-0">
                    <Card.Header className={`${idx === 0 ? 'bg-success' : idx === 1 ? 'bg-info' : 'bg-warning'} text-white py-2`}>
                      <h6 className="mb-0">{pred.variety || 'Variety'}</h6>
                    </Card.Header>
                    <Card.Body className="p-2">
                      <div className="mb-2">
                        <small className="text-muted d-block mb-1">Climate Score</small>
                        <ProgressBar 
                          now={pred.climate_score ? pred.climate_score * 10 : 0} 
                          variant={pred.climate_score > 7 ? 'success' : pred.climate_score > 5 ? 'warning' : 'danger'}
                          label={`${pred.climate_score ? pred.climate_score.toFixed(1) : 0}/10`}
                          style={{ height: '20px' }}
                        />
                      </div>
                      <Row className="text-center g-1 mb-2">
                        <Col xs={4}>
                          <small className="text-muted d-block">{t('revenue.rainfall')}</small>
                          <strong className="small">{pred.rainfall ? pred.rainfall.toFixed(1) : 'N/A'}</strong>
                        </Col>
                        <Col xs={4}>
                          <small className="text-muted d-block">{t('revenue.humidity')}</small>
                          <strong className="small">{pred.humidity ? pred.humidity.toFixed(1) : 'N/A'}%</strong>
                        </Col>
                        <Col xs={4}>
                          <small className="text-muted d-block">{t('revenue.effect')}</small>
                          <strong className="small">{pred.climate_effect_percent ? pred.climate_effect_percent.toFixed(1) : 'N/A'}%</strong>
                        </Col>
                      </Row>
                      <hr className="my-1" />
                      <div>
                        <small className="text-muted d-block mb-1"><strong>{t('revenue.district')}:</strong> {pred.district || 'N/A'}</small>
                        <small className="text-muted d-block mb-1"><strong>{t('revenue.season')}:</strong> {pred.season || 'N/A'}</small>
                        <small className="text-muted"><strong>{t('revenue.soil')}:</strong> {pred.soil_type || 'N/A'}</small>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          {predictions.length === 0 && !loading && (
            <Card className="text-center py-4 border-0 shadow-sm">
              <Card.Body>
                <h5>{t('revenue.getStarted')}</h5>
                <p className="text-muted mb-0 small">{t('revenue.getStartedDesc')}</p>
              </Card.Body>
            </Card>
          )}
        </Container>
        <Footer />
      </div>
    </>
  );
}

export default RevenuePredictionPage;
