import React, { useState } from 'react';
import { Button, Dropdown, DropdownButton } from 'react-bootstrap';
import { useFavorites } from '../contexts/FavoritesContext.jsx';
import { useNotification } from '../contexts/NotificationContext.jsx';
import { exportToPDF } from '../utils/exportUtils.js';
import { shareToSocial, copyToClipboard } from '../utils/shareUtils.js';

function ActionButtons({ item, type = 'crop' }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { showNotification } = useNotification();
  const [showShareMenu, setShowShareMenu] = useState(false);

  const handleFavorite = () => {
    // Create a unique ID using multiple fields to ensure uniqueness
    // Include variety, year, district, temp_category, and a unique value (revenue/nitrogen/temperature)
    const uniqueValue = item.expected_revenue || item.nitrogen || item.temperature || item.id || '';
    const uniqueId = `${type}-${item.variety || item.crop_name || 'item'}-${item.year || ''}-${item.district || ''}-${item.temp_category || ''}-${uniqueValue}`;
    const favoriteItem = {
      id: uniqueId.replace(/\s+/g, '-').replace(/[^a-z0-9-]/gi, '').toLowerCase(),
      type,
      ...item
    };
    const added = toggleFavorite(favoriteItem);
    showNotification(
      added ? 'Added to favorites!' : 'Removed from favorites',
      added ? 'success' : 'info'
    );
  };

  const handleExport = () => {
    const content = `
      <div class="header">
        <h1>ClimaCrop Report</h1>
        <h2>${item.variety || item.crop_name || 'Crop Analysis'}</h2>
      </div>
      <div>
        <h3>Details</h3>
        <table>
          <tr><th>Property</th><th>Value</th></tr>
          ${Object.entries(item).map(([key, value]) => 
            `<tr><td>${key}</td><td>${value || 'N/A'}</td></tr>`
          ).join('')}
        </table>
      </div>
    `;
    exportToPDF(content, `climacrop-${item.variety || item.crop_name || 'report'}`);
    showNotification('Exporting to PDF...', 'info');
  };

  const handleShare = (platform) => {
    const shareData = {
      title: `ClimaCrop: ${item.variety || item.crop_name || 'Crop Analysis'}`,
      text: `Check out this crop analysis from ClimaCrop!`,
      url: window.location.href
    };
    shareToSocial(platform, shareData);
    showNotification(`Sharing to ${platform}...`, 'info');
  };

  const handleCopyLink = () => {
    copyToClipboard(window.location.href);
    showNotification('Link copied to clipboard!', 'success');
  };

  // Create the same unique ID for checking favorite status
  const uniqueValue = item.expected_revenue || item.nitrogen || item.temperature || item.id || '';
  const itemId = `${type}-${item.variety || item.crop_name || 'item'}-${item.year || ''}-${item.district || ''}-${item.temp_category || ''}-${uniqueValue}`.replace(/\s+/g, '-').replace(/[^a-z0-9-]/gi, '').toLowerCase();
  const favorited = isFavorite(itemId);

  return (
    <div className="d-flex gap-2 flex-wrap">
      <Button
        variant={favorited ? "warning" : "outline-warning"}
        size="sm"
        onClick={handleFavorite}
        title={favorited ? "Remove from favorites" : "Add to favorites"}
      >
        {favorited ? '⭐' : '☆'} Favorite
      </Button>
      
      <Button
        variant="outline-primary"
        size="sm"
        onClick={handleExport}
        title="Export to PDF"
      >
        📄 Export
      </Button>

      <DropdownButton
        variant="outline-info"
        size="sm"
        title="🔗 Share"
        align="end"
      >
        <Dropdown.Item onClick={() => handleShare('twitter')}>
          🐦 Twitter
        </Dropdown.Item>
        <Dropdown.Item onClick={() => handleShare('facebook')}>
          📘 Facebook
        </Dropdown.Item>
        <Dropdown.Item onClick={() => handleShare('linkedin')}>
          💼 LinkedIn
        </Dropdown.Item>
        <Dropdown.Item onClick={() => handleShare('whatsapp')}>
          💬 WhatsApp
        </Dropdown.Item>
        <Dropdown.Item onClick={() => handleShare('email')}>
          📧 Email
        </Dropdown.Item>
        <Dropdown.Divider />
        <Dropdown.Item onClick={handleCopyLink}>
          📋 Copy Link
        </Dropdown.Item>
      </DropdownButton>
    </div>
  );
}

export default ActionButtons;

