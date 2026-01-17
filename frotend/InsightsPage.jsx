import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, Alert, Spinner, Tabs, Tab, ProgressBar } from 'react-bootstrap';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LabelList
} from 'recharts';
import Header from './Header';
import Footer from './Footer';
import { useLanguage } from './contexts/LanguageContext';

const COLORS = ['#28a745', '#007bff', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1', '#fd7e14'];

function InsightsPage({ username, onLogout }) {
  const { t, language, translateCrop } = useLanguage();
  const [crops, setCrops] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('');
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetch('http://127.0.0.1:8000/crops')
      .then(res => res.json())
      .then(data => {
        const cropsList = data.crops && data.crops.length > 0 ? data.crops : ['Rice', 'Cotton', 'Maize'];
        setCrops(cropsList);
        if (cropsList.length > 0) {
          setSelectedCrop(cropsList[0]);
        }
      })
      .catch(() => {
        setCrops(['Rice', 'Cotton', 'Maize']);
        setSelectedCrop('Rice');
      });
  }, []);

  const fetchInsights = async () => {
    if (!selectedCrop) return;
    
    setLoading(true);
    try {
      // Fetch data for all temperature categories
      const [best, average, worst] = await Promise.all([
        fetch(`http://127.0.0.1:8000/revenue-prediction?crop=${encodeURIComponent(selectedCrop)}&temp=Best`).then(r => r.json()),
        fetch(`http://127.0.0.1:8000/revenue-prediction?crop=${encodeURIComponent(selectedCrop)}&temp=Average`).then(r => r.json()),
        fetch(`http://127.0.0.1:8000/revenue-prediction?crop=${encodeURIComponent(selectedCrop)}&temp=Worst`).then(r => r.json())
      ]);

      // Process insights
      const processData = (data) => {
        if (!data.data || data.data.length === 0) return null;
        const items = data.data;
        return {
          avgRevenue: items.reduce((sum, item) => sum + (item.expected_revenue || 0), 0) / items.length,
          avgYield: items.reduce((sum, item) => sum + (item.avg_yield_kg_per_acre || 0), 0) / items.length,
          avgClimateScore: items.reduce((sum, item) => sum + (item.climate_score || 0), 0) / items.length,
          topVariety: items.reduce((best, current) => 
            (current.expected_revenue || 0) > (best.expected_revenue || 0) ? current : best
          ),
          count: items.length
        };
      };

      const bestData = processData(best);
      const avgData = processData(average);
      const worstData = processData(worst);

      setInsights({ best: bestData, average: avgData, worst: worstData });

      // Create comparison data
      const comparison = [
        {
          category: 'Best',
          revenue: bestData?.avgRevenue || 0,
          yield: bestData?.avgYield || 0,
          climate: (bestData?.avgClimateScore || 0) * 10
        },
        {
          category: 'Average',
          revenue: avgData?.avgRevenue || 0,
          yield: avgData?.avgYield || 0,
          climate: (avgData?.avgClimateScore || 0) * 10
        },
        {
          category: 'Worst',
          revenue: worstData?.avgRevenue || 0,
          yield: worstData?.avgYield || 0,
          climate: (worstData?.avgClimateScore || 0) * 10
        }
      ];
      setComparisonData(comparison);

    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCrop) {
      fetchInsights();
    }
  }, [selectedCrop]);

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
    const numValue = typeof value === 'number' ? value : value * 1000000;
    if (numValue >= 1000000000) {
      return `Rs ${(numValue / 1000000000).toFixed(2)}B`;
    } else if (numValue >= 1000000) {
      return `Rs ${(numValue / 1000000).toFixed(2)}M`;
    } else if (numValue >= 1000) {
      return `Rs ${(numValue / 1000).toFixed(1)}K`;
    }
    return `Rs ${numValue.toFixed(0)}`;
  };

  const formatShortCurrencyFromMillions = (value) => {
    if (!value) return '0';
    // Value is already in millions, so multiply by 1M to get full value
    const numValue = value * 1000000;
    if (numValue >= 1000000000) {
      return `Rs ${(numValue / 1000000000).toFixed(2)}B`;
    } else if (numValue >= 1000000) {
      return `Rs ${(numValue / 1000000).toFixed(2)}M`;
    } else if (numValue >= 1000) {
      return `Rs ${(numValue / 1000).toFixed(1)}K`;
    }
    return `Rs ${numValue.toFixed(0)}`;
  };

  // Prepare chart data
  const revenueComparisonData = comparisonData ? comparisonData.map(item => ({
    name: item.category,
    Revenue: item.revenue / 1000000, // Convert to millions
    Yield: item.yield,
    'Climate Score': item.climate
  })) : [];

  const cropDistributionData = crops.slice(0, 6).map((crop, idx) => ({
    name: crop,
    value: Math.floor(Math.random() * 100) + 50 // Simulated data
  }));

  const performanceRadarData = comparisonData ? [
    {
      category: 'Revenue',
      Best: (comparisonData[0]?.revenue / comparisonData[0]?.revenue) * 100 || 0,
      Average: (comparisonData[1]?.revenue / comparisonData[0]?.revenue) * 100 || 0,
      Worst: (comparisonData[2]?.revenue / comparisonData[0]?.revenue) * 100 || 0
    },
    {
      category: 'Yield',
      Best: (comparisonData[0]?.yield / comparisonData[0]?.yield) * 100 || 0,
      Average: (comparisonData[1]?.yield / comparisonData[0]?.yield) * 100 || 0,
      Worst: (comparisonData[2]?.yield / comparisonData[0]?.yield) * 100 || 0
    },
    {
      category: 'Climate',
      Best: comparisonData[0]?.climate || 0,
      Average: comparisonData[1]?.climate || 0,
      Worst: comparisonData[2]?.climate || 0
    }
  ] : [];

  return (
    <>
      <Header username={username} onLogout={onLogout} />
      <div className="min-vh-100 d-flex flex-column bg-light">
        {/* Hero Section */}
        <div className="hero-section-insights py-4 mb-4">
          <Container fluid className="px-4">
            <Row className="align-items-center">
              <Col>
                <h1 className="display-5 fw-bold mb-2 hero-title">{t('insights.title')}</h1>
                <p className="lead mb-0 hero-subtitle">{t('insights.subtitle')}</p>
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
          {/* Filters + Overview stacked row */}
          <Row className="g-3 align-items-stretch mb-4">
            <Col lg={4}>
              <Card className="shadow-sm h-100 border-0">
                <Card.Header className="bg-success text-white py-2">
                  <h6 className="mb-0">{t('insights.analyze')}</h6>
                </Card.Header>
                <Card.Body className="p-3">
                  <div className="d-flex flex-column gap-3 compact-form">
                    <Form.Group className="mb-0">
                      <Form.Label className="fw-bold small mb-1">{t('insights.selectCrop')}</Form.Label>
                      <Form.Select
                        value={selectedCrop}
                        onChange={(e) => setSelectedCrop(e.target.value)}
                        size="sm"
                      >
                        {crops.map(crop => (
                          <option key={crop} value={crop}>{translateCrop(crop)}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-0">
                      <Form.Label className="fw-bold small mb-1">{t('insights.selectDistrict')}</Form.Label>
                      <Form.Select
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        size="sm"
                      >
                        <option value="">{t('insights.allDistricts')}</option>
                        <option value="Lahore">Lahore</option>
                        <option value="Karachi">Karachi</option>
                        <option value="Faisalabad">Faisalabad</option>
                        <option value="Bahawalnagar">Bahawalnagar</option>
                      </Form.Select>
                    </Form.Group>
                    <Button
                      variant="success"
                      size="sm"
                      className="w-100"
                      onClick={fetchInsights}
                      disabled={loading}
                    >
                      {loading ? <><Spinner size="sm" className="me-2" />{t('common.loading')}</> : t('insights.analyze')}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={8}>
              <Card className="shadow-sm h-100 border-0">
                <Card.Header className="bg-success text-white py-2">
                  <h6 className="mb-0">{t('insights.revenueComparison')}</h6>
                </Card.Header>
                <Card.Body className="p-3">
                  {comparisonData && comparisonData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={revenueComparisonData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => formatShortCurrencyFromMillions(value)} />
                        <Tooltip formatter={(value) => formatCurrency(value * 1000000)} />
                        <Legend />
                        <Bar dataKey="Revenue" fill="#28a745">
                          <LabelList dataKey="Revenue" position="top" formatter={(value) => formatShortCurrencyFromMillions(value)} style={{ fontSize: '11px', fill: '#333', fontWeight: 'bold' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-muted text-center small py-4">
                      {language === 'ur' ? 'تجزیہ دیکھنے کے لیے فصل منتخب کریں' : 'Select a crop to view insights overview'}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Tabs */}
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-4"
          >
            <Tab eventKey="overview" title={t('insights.overview')}>
              <Row className="g-3 mb-4">
                {insights && Object.entries(insights).map(([key, data]) => (
                  data && (
                    <Col md={4} key={key}>
                      <Card className={`h-100 border-0 shadow-sm readable-card ${key === 'best' ? 'border-success border-2' : ''}`}>
                        <Card.Header className={`readable-card-header ${key === 'best' ? 'bg-success text-white' : 'bg-light'}`}>
                          <h6 className="mb-0 text-capitalize fw-bold readable-header-text">
                            {key === 'best' ? t('revenue.bestConditions') : key === 'average' ? t('revenue.averageConditions') : t('revenue.worstConditions')}
                          </h6>
                        </Card.Header>
                        <Card.Body className="readable-card-body">
                          <div className="mb-2">
                            <small className="text-muted readable-small-text">{t('insights.avgRevenue')}</small>
                            <h4 className="text-success mb-0 readable-heading">{formatCurrency(data.avgRevenue)}</h4>
                          </div>
                          <div className="mb-2">
                            <small className="text-muted readable-small-text">{t('insights.avgYield')}</small>
                            <p className="mb-0 readable-text">{data.avgYield?.toFixed(2) || 'N/A'} kg/acre</p>
                          </div>
                          <div className="mb-2">
                            <small className="text-muted readable-small-text">{t('insights.climateScore')}</small>
                            <p className="mb-0 readable-text">{(data.avgClimateScore * 10)?.toFixed(1) || 'N/A'}/10</p>
                          </div>
                          {data.topVariety && (
                            <div>
                              <small className="text-muted readable-small-text">{t('insights.topVariety')}</small>
                              <Badge bg="info" className="ms-2 readable-badge">{data.topVariety.variety}</Badge>
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  )
                ))}
              </Row>

              {comparisonData && (
                <Row className="g-3">
                  <Col lg={6}>
                    <Card className="shadow-sm border-0 h-100">
                      <Card.Header className="bg-primary text-white">
                        <h6 className="mb-0">Revenue Distribution by Conditions</h6>
                      </Card.Header>
                      <Card.Body>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={revenueComparisonData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="Revenue"
                            >
                              {revenueComparisonData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={['#28a745', '#17a2b8', '#dc3545'][index % 3]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(value * 1000000)} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col lg={6}>
                    <Card className="shadow-sm border-0 h-100">
                      <Card.Header className="bg-info text-white">
                        <h6 className="mb-0">{t('insights.multiMetric')}</h6>
                      </Card.Header>
                      <Card.Body>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={revenueComparisonData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Area type="monotone" dataKey="Revenue" stackId="1" stroke="#28a745" fill="#28a745" fillOpacity={0.6} />
                            <Area type="monotone" dataKey="Yield" stackId="2" stroke="#007bff" fill="#007bff" fillOpacity={0.6} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}
            </Tab>

            <Tab eventKey="performance" title={t('insights.performance')}>
              {performanceRadarData.length > 0 && (
                <Row className="g-3 mb-4">
                  {performanceRadarData.map((item, idx) => {
                    const maxValue = Math.max(item.Best, item.Average, item.Worst);
                    return (
                      <Col md={4} key={idx}>
                        <Card className="shadow-sm border-0 h-100">
                          <Card.Header className={`${idx === 0 ? 'bg-success' : idx === 1 ? 'bg-info' : 'bg-danger'} text-white`}>
                            <h6 className="mb-0 fw-bold">{item.category}</h6>
                          </Card.Header>
                          <Card.Body>
                            <div className="mb-3">
                              <div className="d-flex justify-content-between mb-1">
                                <small className="fw-bold">Best Conditions</small>
                                <small className="fw-bold text-success">{item.Best.toFixed(1)}%</small>
                              </div>
                              <ProgressBar 
                                variant="success" 
                                now={item.Best} 
                                max={maxValue}
                                className="mb-3"
                                style={{ height: '20px' }}
                              />
                            </div>
                            <div className="mb-3">
                              <div className="d-flex justify-content-between mb-1">
                                <small className="fw-bold">Average Conditions</small>
                                <small className="fw-bold text-info">{item.Average.toFixed(1)}%</small>
                              </div>
                              <ProgressBar 
                                variant="info" 
                                now={item.Average} 
                                max={maxValue}
                                className="mb-3"
                                style={{ height: '20px' }}
                              />
                            </div>
                            <div>
                              <div className="d-flex justify-content-between mb-1">
                                <small className="fw-bold">Worst Conditions</small>
                                <small className="fw-bold text-danger">{item.Worst.toFixed(1)}%</small>
                              </div>
                              <ProgressBar 
                                variant="danger" 
                                now={item.Worst} 
                                max={maxValue}
                                style={{ height: '20px' }}
                              />
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              )}

              <Row className="g-3">
                <Col md={6}>
                  <Card className="shadow-sm border-0">
                    <Card.Header className="bg-success text-white">
                      <h6 className="mb-0">{t('insights.cropDistribution')}</h6>
                    </Card.Header>
                    <Card.Body>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={cropDistributionData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {cropDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="shadow-sm border-0">
                    <Card.Header className="bg-info text-white">
                      <h6 className="mb-0">{t('insights.trendAnalysis')}</h6>
                    </Card.Header>
                    <Card.Body>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={revenueComparisonData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="Revenue" stroke="#28a745" strokeWidth={3} />
                          <Line type="monotone" dataKey="Yield" stroke="#007bff" strokeWidth={3} />
                          <Line type="monotone" dataKey="Climate Score" stroke="#ffc107" strokeWidth={3} />
                        </LineChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab>

            <Tab eventKey="recommendations" title={t('insights.recommendations')}>
              {insights && (
                <Row className="g-3">
                  {Object.entries(insights).map(([key, data]) => (
                    data && data.topVariety && (
                      <Col md={4} key={key}>
                        <Card className="h-100 shadow-sm border-0">
                        <Card.Header className={`${key === 'best' ? 'bg-success' : key === 'average' ? 'bg-info' : 'bg-warning'} text-white`}>
                          <h6 className="mb-0 text-capitalize">
                            {key === 'best' ? t('insights.bestStrategy') : key === 'average' ? t('insights.averageStrategy') : t('insights.worstStrategy')}
                          </h6>
                          </Card.Header>
                          <Card.Body>
                            <h5 className="text-primary">{data.topVariety.variety}</h5>
                            <div className="mb-3">
                              <Badge bg="success" className="me-2">
                                Revenue: {formatCurrency(data.topVariety.expected_revenue)}
                              </Badge>
                              <Badge bg="info">
                                Yield: {data.topVariety.avg_yield_kg_per_acre?.toFixed(1)} kg/acre
                              </Badge>
                            </div>
                            <div className="mb-2">
                              <strong>{t('revenue.district')}:</strong> {data.topVariety.district || 'N/A'}
                            </div>
                            <div className="mb-2">
                              <strong>{t('revenue.season')}:</strong> {data.topVariety.season || 'N/A'}
                            </div>
                            <div className="mb-2">
                              <strong>{t('revenue.soil')}:</strong> {data.topVariety.soil_type || 'N/A'}
                            </div>
                            <div>
                              <strong>{t('trends.riskLevel')}:</strong>{' '}
                              <Badge bg={
                                data.topVariety.climate_risk_level === 'Low' ? 'success' :
                                data.topVariety.climate_risk_level === 'Medium' ? 'warning' : 'danger'
                              }>
                                {data.topVariety.climate_risk_level || 'N/A'}
                              </Badge>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    )
                  ))}
                </Row>
              )}
            </Tab>
          </Tabs>

          {!insights && !loading && (
            <Card className="text-center py-5 border-0 shadow-sm">
              <Card.Body>
                <h4>{t('insights.selectCropToView')}</h4>
                <p className="text-muted">{t('insights.selectCropDesc')}</p>
              </Card.Body>
            </Card>
          )}
        </Container>
        <Footer />
      </div>

    </>
  );
}

export default InsightsPage;

