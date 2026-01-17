import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, ProgressBar } from 'react-bootstrap';
import Header from './Header';
import Footer from './Footer';
import { useLanguage } from './contexts/LanguageContext';

function DataUploadPage({ username, onLogout }) {
  const { t, language } = useLanguage();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError(null);
        setMessage(null);
      } else {
        setError('Please select a CSV file');
        setFile(null);
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError(null);
    setMessage(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('http://127.0.0.1:8000/upload-data', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({
          type: 'success',
          text: `Successfully uploaded ${data.rows_inserted} rows! The data warehouse has been refreshed.`
        });
        setFile(null);
        // Reset file input
        document.getElementById('file-input').value = '';
      } else {
        setError(data.detail || data.error || 'Upload failed. Please check the file format.');
      }
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  return (
    <>
      <Header username={username} onLogout={onLogout} />
      <div className="min-vh-100 d-flex flex-column bg-light">
        {/* Page Header */}
        <div className="hero-section-insights py-4 mb-4">
          <Container fluid className="px-4">
            <Row className="align-items-center">
              <Col>
                <h1 className="display-5 fw-bold mb-2 hero-title">{t('upload.title')}</h1>
                <p className="lead mb-0 hero-subtitle">{t('upload.subtitle')}</p>
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

          <Row className="justify-content-center">
            <Col md={8} lg={6}>
              <Card className="shadow-lg border-0">
                <Card.Header className="bg-success text-white py-3">
                  <h5 className="mb-0">Data Upload</h5>
                </Card.Header>
                <Card.Body className="p-4">
                  <Form onSubmit={handleUpload}>
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold">{t('upload.selectFile')}</Form.Label>
                      <Form.Control
                        id="file-input"
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        disabled={uploading}
                        className="mb-2"
                      />
                      <Form.Text className="text-muted">
                        File must be in CSV format matching the staging table structure
                      </Form.Text>
                      {file && (
                        <Alert variant="info" className="mt-2 mb-0 py-2">
                          <strong>Selected:</strong> {file.name} ({(file.size / 1024).toFixed(2)} KB)
                        </Alert>
                      )}
                    </Form.Group>

                    {uploading && (
                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <small className="text-muted">Uploading...</small>
                          <small className="text-muted">{uploadProgress}%</small>
                        </div>
                        <ProgressBar now={uploadProgress} animated variant="success" />
                      </div>
                    )}

                    {error && (
                      <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-3">
                        <strong>Error:</strong> {error}
                      </Alert>
                    )}

                    {message && (
                      <Alert variant={message.type} dismissible onClose={() => setMessage(null)} className="mb-3">
                        <strong>{message.type === 'success' ? 'Success!' : 'Info:'}</strong> {message.text}
                      </Alert>
                    )}

                    <Button
                      variant="success"
                      type="submit"
                      size="lg"
                      className="w-100"
                      disabled={!file || uploading}
                    >
                      {uploading ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Uploading...
                        </>
                      ) : (
                        t('upload.uploadData')
                      )}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>

              {/* Instructions Card */}
              <Card className="shadow-sm border-0 mt-4">
                <Card.Header className="bg-info text-white py-2">
                  <h6 className="mb-0">{t('upload.instructions')}</h6>
                </Card.Header>
                <Card.Body className="p-3">
                  <ul className="mb-0 small">
                    <li>CSV file should match the structure of <code>all_crops_validated.csv</code></li>
                    <li>First column 'c' will be automatically skipped</li>
                    <li>Data will be loaded into staging table and data warehouse will be refreshed</li>
                    <li>Dimension and fact tables will be automatically updated</li>
                    <li>Make sure all required columns are present in the CSV</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
        <Footer />
      </div>
    </>
  );
}

export default DataUploadPage;

