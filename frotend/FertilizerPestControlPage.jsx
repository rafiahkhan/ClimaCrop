import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge, ProgressBar, Accordion } from 'react-bootstrap';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import Header from './Header';
import Footer from './Footer';
import ActionButtons from './components/ActionButtons';
import { useLanguage } from './contexts/LanguageContext';
import { formatAxisTick } from './utils/chartFormatters';

const COLORS = ['#28a745', '#007bff', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1'];

function FertilizerPestControlPage({ username, onLogout }) {
  const { t, language } = useLanguage();
  const [crops, setCrops] = useState([]);
  const [mainCrops, setMainCrops] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedTemp, setSelectedTemp] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const handleGetRecommendations = (e) => {
    e.preventDefault();
    if (!selectedCrop || !selectedTemp) {
      setError(t('fertilizer.selectCrop') + ' & ' + t('fertilizer.selectTemp'));
      return;
    }

    setLoading(true);
    setError(null);
    
    fetch(`http://127.0.0.1:8000/fertilizer-pest-control?crop=${encodeURIComponent(selectedCrop)}&temp=${encodeURIComponent(selectedTemp)}`)
      .then(res => res.json())
      .then(data => {
        console.log('Fertilizer/Pest Control API Response:', data); // Debug log
        if (data.error) {
          setError(data.error);
          setRecommendations([]);
        } else {
          const results = data.data || [];
          console.log('Recommendations received:', results.length, 'items'); // Debug log
          setRecommendations(results);
          if (results.length === 0) {
            setError('No recommendations found for the selected criteria. Make sure data is loaded in the database.');
          } else {
            setError(null); // Clear error if data is found
          }
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch recommendations: ' + err.message);
        setLoading(false);
      });
  };

  // Prepare NPK chart data
  const npkData = recommendations.slice(0, 5).map(rec => ({
    name: rec.variety || 'Variety',
    [t('fertilizer.nitrogen')]: rec.nitrogen || 0,
    [t('fertilizer.phosphorus')]: rec.phosphorus || 0,
    [t('fertilizer.potassium')]: rec.potassium || 0
  }));

  // Fertilizer type distribution
  const fertilizerTypeData = recommendations.reduce((acc, rec) => {
    const type = rec.fertilizer_type || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const fertilizerPieData = Object.entries(fertilizerTypeData).map(([name, value]) => ({
    name,
    value
  }));

  // Climate radar data
  const climateRadarData = recommendations.slice(0, 5).map(rec => ({
    variety: rec.variety || 'Variety',
    'Temperature': rec.temperature_norm ? rec.temperature_norm * 100 : 0,
    'Rainfall': rec.rainfall_norm ? rec.rainfall_norm * 100 : 0,
    'Humidity': rec.humidity || 0,
    'Climate Score': rec.climate_score ? rec.climate_score * 10 : 0
  }));

  return (
    <>
      <Header username={username} onLogout={onLogout} />
      <div className="min-vh-100 d-flex flex-column bg-light">
        {/* Page Header */}
        <div className="hero-section-insights py-4 mb-4">
          <Container fluid className="px-4">
            <Row className="align-items-center">
              <Col>
                <h1 className="display-5 fw-bold mb-2 hero-title">{t('fertilizer.title')}</h1>
                <p className="lead mb-0 hero-subtitle">{t('fertilizer.subtitle')}</p>
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
        <Container fluid className="flex-grow-1 py-3 px-4">

          {/* Selection Form - Compact */}
          <Card className="shadow-sm mb-3 border-0">
            <Card.Body className="bg-white p-3">
              <Form onSubmit={handleGetRecommendations}>
                <Row className="g-2 align-items-end">
                  <Col md={4}>
                    <Form.Group className="mb-0">
                      <Form.Label className="fw-bold small mb-1">{t('fertilizer.selectCrop')}</Form.Label>
                      <Form.Select 
                        value={selectedCrop} 
                        onChange={(e) => {
                          setSelectedCrop(e.target.value);
                          setRecommendations([]);
                        }}
                        size="sm"
                        required
                      >
                        <option value="">{language === 'ur' ? 'فصل منتخب کریں...' : 'Choose crop...'}</option>
                        {(mainCrops.length > 0 ? mainCrops : ['Rice', 'Cotton', 'Maize']).map(crop => (
                          <option key={crop} value={crop}>{crop}</option>
                        ))}
                        {crops.filter(c => !mainCrops.includes(c) && !['Rice', 'Cotton', 'Maize'].includes(c)).length > 0 && (
                          <>
                            <optgroup label="Other Crops">
                              {crops.filter(c => !mainCrops.includes(c) && !['Rice', 'Cotton', 'Maize'].includes(c)).map(crop => (
                                <option key={crop} value={crop}>{crop}</option>
                              ))}
                            </optgroup>
                          </>
                        )}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-0">
                      <Form.Label className="fw-bold small mb-1">{t('fertilizer.selectTemp')}</Form.Label>
                      <Form.Select 
                        value={selectedTemp} 
                        onChange={(e) => setSelectedTemp(e.target.value)}
                        size="sm"
                        required
                      >
                        <option value="">{language === 'ur' ? 'درجہ حرارت منتخب کریں...' : 'Choose temperature...'}</option>
                        <option value="Best">{t('fertilizer.bestConditions')}</option>
                        <option value="Average">{t('fertilizer.averageConditions')}</option>
                        <option value="Worst">{t('fertilizer.worstConditions')}</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Button 
                      variant="success" 
                      type="submit" 
                      size="sm"
                      className="w-100"
                      disabled={loading}
                    >
                      {loading ? <><Spinner size="sm" className="me-2" />{t('common.loading')}</> : t('fertilizer.getRecommendations')}
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-3 py-2">
              <strong>Error:</strong> {error}
            </Alert>
          )}

          {/* Charts Row - Side by Side */}
          {recommendations.length > 0 && (
            <Row className="g-3 mb-3">
              <Col lg={6}>
                <Card className="shadow-sm border-0 h-100">
                  <Card.Header className="bg-success text-white py-2">
                    <h6 className="mb-0">{t('fertilizer.npk')}</h6>
                  </Card.Header>
                  <Card.Body className="p-2">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={npkData} margin={{ left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={10} />
                        <YAxis width={45} tickFormatter={formatAxisTick} tickCount={6} fontSize={10} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey={t('fertilizer.nitrogen')} fill="#28a745" />
                        <Bar dataKey={t('fertilizer.phosphorus')} fill="#007bff" />
                        <Bar dataKey={t('fertilizer.potassium')} fill="#ffc107" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={6}>
                <Card className="shadow-sm border-0 h-100">
                  <Card.Header className="bg-info text-white py-2">
                    <h6 className="mb-0">{t('fertilizer.typeDistribution')}</h6>
                  </Card.Header>
                  <Card.Body className="p-2">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={fertilizerPieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={70}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {fertilizerPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Climate Comparison Chart */}
          {recommendations.length > 0 && (
            <Card className="shadow-sm mb-3 border-0">
              <Card.Header className="bg-warning text-dark py-2">
                <h6 className="mb-0">Climate Factors Comparison</h6>
              </Card.Header>
              <Card.Body className="p-2">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={climateRadarData.slice(0, 5)}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="variety" fontSize={10} />
                    <PolarRadiusAxis tickFormatter={(v) => Math.round(v)} tickCount={5} fontSize={10} />
                    <Radar name="Temperature" dataKey="Temperature" stroke="#dc3545" fill="#dc3545" fillOpacity={0.6} />
                    <Radar name="Rainfall" dataKey="Rainfall" stroke="#17a2b8" fill="#17a2b8" fillOpacity={0.6} />
                    <Radar name="Humidity" dataKey="Humidity" stroke="#28a745" fill="#28a745" fillOpacity={0.6} />
                    <Radar name="Climate Score" dataKey="Climate Score" stroke="#ffc107" fill="#ffc107" fillOpacity={0.6} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          )}

          {/* Detailed Recommendations - Compact Grid */}
          {recommendations.length > 0 && (
            <Row className="g-2">
              {recommendations.map((rec, idx) => (
                <Col md={6} lg={4} key={idx}>
                  <Card className="h-100 shadow-sm border-success">
                    <Card.Header className="bg-success text-white py-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <strong className="small">{rec.variety || rec.crop_name || 'Crop Recommendation'}</strong>
                        <Badge bg="light" text="dark" className="small">{rec.temp_category}</Badge>
                      </div>
                    </Card.Header>
                    <Card.Body className="p-2">
                      {/* Fertilizer Section */}
                      <Accordion defaultActiveKey="0" className="mb-2">
                        <Accordion.Item eventKey="0">
                          <Accordion.Header className="py-1">
                            <strong className="text-success small">{t('fertilizer.fertilizer')}</strong>
                          </Accordion.Header>
                          <Accordion.Body className="p-2">
                            <div className="mb-2">
                              <strong className="small">{t('fertilizer.fertilizerType')}:</strong>
                              <div className="text-primary fw-bold p-2 bg-light rounded mt-1">
                                {rec.fertilizer_type || rec.Fertilizer_Type || rec.fertilizer || 'N/A'}
                              </div>
                            </div>
                            <Row className="text-center mb-2">
                              <Col xs={4}>
                                <div className="p-2 bg-light rounded">
                                  <div className="text-muted" style={{ fontSize: '10px' }}>N</div>
                                  <div className="fw-bold text-success">{rec.nitrogen || 'N/A'}</div>
                                </div>
                              </Col>
                              <Col xs={4}>
                                <div className="p-2 bg-light rounded">
                                  <div className="text-muted" style={{ fontSize: '10px' }}>P</div>
                                  <div className="fw-bold text-info">{rec.phosphorus || 'N/A'}</div>
                                </div>
                              </Col>
                              <Col xs={4}>
                                <div className="p-2 bg-light rounded">
                                  <div className="text-muted" style={{ fontSize: '10px' }}>K</div>
                                  <div className="fw-bold text-warning">{rec.potassium || 'N/A'}</div>
                                </div>
                              </Col>
                            </Row>
                            <div>
                              <small className="text-muted">pH: </small>
                              <ProgressBar 
                                now={rec.ph_level ? (rec.ph_level / 14) * 100 : 0} 
                                variant={rec.ph_level && rec.ph_level >= 6 && rec.ph_level <= 7.5 ? 'success' : 'warning'}
                                label={`${rec.ph_level ? rec.ph_level.toFixed(1) : 'N/A'}`}
                                style={{ height: '18px' }}
                              />
                            </div>
                          </Accordion.Body>
                        </Accordion.Item>

                        <Accordion.Item eventKey="1">
                          <Accordion.Header className="py-1">
                            <strong className="text-danger small">{t('fertilizer.pestControl')}</strong>
                          </Accordion.Header>
                          <Accordion.Body className="p-2">
                            <div className="mb-2">
                              <strong className="small">{t('fertilizer.recommendedPesticide')}:</strong>
                              <div className="text-info fw-bold small p-2 bg-light rounded mt-1">
                                {rec.recommended_pesticide || rec.Recommended_Pesticide || 'N/A'}
                              </div>
                            </div>
                            <div className="mt-2">
                              <strong className="small">{t('fertilizer.expectedDisease')}:</strong>
                              <Badge bg={rec.expected_disease || rec.Expected_Disease ? "warning" : "success"} className="ms-2 small">
                                {rec.expected_disease || rec.Expected_Disease || t('fertilizer.noneExpected')}
                              </Badge>
                            </div>
                            {rec.expected_disease || rec.Expected_Disease ? (
                              <Alert variant="warning" className="p-1 mt-2 mb-0 small">
                                <strong>{t('fertilizer.warning')}:</strong> {rec.expected_disease || rec.Expected_Disease}
                              </Alert>
                            ) : null}
                          </Accordion.Body>
                        </Accordion.Item>

                        <Accordion.Item eventKey="2">
                          <Accordion.Header className="py-1">
                            <strong className="text-info small">{t('fertilizer.climateLocation')}</strong>
                          </Accordion.Header>
                          <Accordion.Body className="p-2">
                            <div className="mb-2">
                              <small className="text-muted d-block mb-1">Climate Score</small>
                              <ProgressBar 
                                now={rec.climate_score ? rec.climate_score * 10 : 0} 
                                variant={rec.climate_score > 7 ? 'success' : rec.climate_score > 5 ? 'warning' : 'danger'}
                                label={`${rec.climate_score ? rec.climate_score.toFixed(1) : 0}/10`}
                                style={{ height: '18px' }}
                              />
                            </div>
                            <Row className="text-center g-1 mb-2">
                              <Col xs={4}>
                                <small className="text-muted d-block">Rainfall</small>
                                <strong className="small">{rec.rainfall ? rec.rainfall.toFixed(1) : 'N/A'}</strong>
                              </Col>
                              <Col xs={4}>
                                <small className="text-muted d-block">Humidity</small>
                                <strong className="small">{rec.humidity ? rec.humidity.toFixed(1) : 'N/A'}%</strong>
                              </Col>
                              <Col xs={4}>
                                <small className="text-muted d-block">Effect</small>
                                <strong className="small">{rec.climate_effect_percent ? rec.climate_effect_percent.toFixed(1) : 'N/A'}%</strong>
                              </Col>
                            </Row>
                            <div>
                              <small className="text-muted d-block mb-1"><strong>District:</strong> {rec.district || 'N/A'}</small>
                              <small className="text-muted d-block mb-1"><strong>Season:</strong> {rec.season || 'N/A'}</small>
                              <small className="text-muted d-block mb-1"><strong>Soil:</strong> {rec.soil_type || 'N/A'}</small>
                              <small className="text-muted d-block"><strong>Risk:</strong>{' '}
                                <Badge bg={
                                  rec.climate_risk_level === 'Low' ? 'success' :
                                  rec.climate_risk_level === 'Medium' ? 'warning' : 'danger'
                                } className="small">
                                  {rec.climate_risk_level || 'N/A'}
                                </Badge>
                              </small>
                            </div>
                          </Accordion.Body>
                        </Accordion.Item>
                      </Accordion>

                      {/* Quick Summary */}
                      <div className="bg-light p-2 rounded mt-2">
                        <small className="text-muted d-block mb-1">Year: {rec.year || 'N/A'}</small>
                        <small className="text-muted d-block">Temp: {rec.temperature || 'N/A'}</small>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="mt-3">
                        <ActionButtons item={rec} type="fertilizer" />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          {recommendations.length === 0 && !loading && (
            <Card className="text-center py-4 border-0 shadow-sm">
              <Card.Body>
                <h5>Get Fertilizer & Pest Control Recommendations</h5>
                <p className="text-muted mb-0 small">Select a crop and temperature category to get expert recommendations</p>
              </Card.Body>
            </Card>
          )}
        </Container>
        <Footer />
      </div>
    </>
  );
}

export default FertilizerPestControlPage;
