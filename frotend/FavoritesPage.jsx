import React from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert } from 'react-bootstrap';
import { useFavorites } from './contexts/FavoritesContext.jsx';
import { useNotification } from './contexts/NotificationContext.jsx';
import { useLanguage } from './contexts/LanguageContext';
import Header from './Header';
import Footer from './Footer';
import ActionButtons from './components/ActionButtons';

function FavoritesPage({ username, onLogout }) {
  const { favorites, removeFavorite } = useFavorites();
  const { showNotification } = useNotification();
  const { t, language, translateCrop, translateTemp } = useLanguage();

  const handleRemove = (id) => {
    removeFavorite(id);
    showNotification(t('common.removeFavorite'), 'info');
  };

  const groupByType = () => {
    const grouped = {};
    favorites.forEach(fav => {
      if (!grouped[fav.type]) {
        grouped[fav.type] = [];
      }
      grouped[fav.type].push(fav);
    });
    return grouped;
  };

  const grouped = groupByType();

  const formatCurrency = (value) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <>
      <Header username={username} onLogout={onLogout} />
      <div className="min-vh-100 d-flex flex-column bg-light">
        <div className="hero-section-insights py-4 mb-4">
          <Container fluid className="px-4">
            <Row className="align-items-center">
              <Col>
                <h1 className="display-5 fw-bold mb-2 hero-title">{t('favorites.title')}</h1>
                <p className="lead mb-0 hero-subtitle">{t('favorites.subtitle')}</p>
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
          {favorites.length === 0 ? (
            <Card className="text-center py-5 border-0 shadow-sm">
              <Card.Body>
                <h4>{t('favorites.noFavorites')}</h4>
                <p className="text-muted">{t('favorites.noFavoritesDesc')}</p>
              </Card.Body>
            </Card>
          ) : (
            <>
              <Alert variant="info" className="mb-4">
                <strong>{t('favorites.totalFavorites')}:</strong> {favorites.length} {t('favorites.items')}
              </Alert>

              {Object.entries(grouped).map(([type, items]) => (
                <div key={type} className="mb-4">
                  <h3 className="mb-3 text-capitalize gradient-text">
                    {type === 'prediction' ? t('favorites.revenuePredictions') : 
                     type === 'crop' ? t('favorites.crops') : 
                     type === 'fertilizer' ? t('favorites.fertilizerRecommendations') : 
                     type}
                  </h3>
                  <Row className="g-3">
                    {items.map((item, idx) => (
                      <Col xs={12} sm={6} md={4} key={item.id || idx}>
                        <Card className="h-100 shadow-sm border-0">
                          <Card.Header className="bg-primary text-white">
                            <div className="d-flex justify-content-between align-items-center">
                              <strong>{item.variety || translateCrop(item.crop_name) || `${t('common.item')} ${idx + 1}`}</strong>
                              <Button
                                variant="light"
                                size="sm"
                                onClick={() => handleRemove(item.id)}
                                className="p-1"
                              >
                                ×
                              </Button>
                            </div>
                          </Card.Header>
                          <Card.Body>
                            {item.expected_revenue && (
                              <div className="mb-2">
                                <small className="text-muted">{t('revenue.expectedRevenue')}</small>
                                <h5 className="text-success mb-0">{formatCurrency(item.expected_revenue)}</h5>
                              </div>
                            )}
                            {item.avg_yield_kg_per_acre && (
                              <div className="mb-2">
                                <small className="text-muted">{t('revenue.yield')}</small>
                                <p className="mb-0">{item.avg_yield_kg_per_acre.toFixed(2)} {t('common.kgPerAcre')}</p>
                              </div>
                            )}
                            {item.fertilizer_type && (
                              <div className="mb-2">
                                <small className="text-muted">{t('fertilizer.fertilizer')}</small>
                                <p className="mb-0">{item.fertilizer_type}</p>
                              </div>
                            )}
                            {item.district && (
                              <Badge bg="info" className="me-1">{item.district}</Badge>
                            )}
                            {item.temp_category && (
                              <Badge bg="warning">{translateTemp(item.temp_category)}</Badge>
                            )}
                            <div className="mt-3">
                              <ActionButtons item={item} type={type} />
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              ))}
            </>
          )}
        </Container>
        <Footer />
      </div>
    </>
  );
}

export default FavoritesPage;

