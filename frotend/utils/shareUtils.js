// Social sharing utilities
export const shareToSocial = (platform, data) => {
  const { title, text, url } = data;
  const shareUrl = encodeURIComponent(url || window.location.href);
  const shareText = encodeURIComponent(text || title);
  const shareTitle = encodeURIComponent(title || 'ClimaCrop Insights');

  const urls = {
    twitter: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
    whatsapp: `https://wa.me/?text=${shareText}%20${shareUrl}`,
    email: `mailto:?subject=${shareTitle}&body=${shareText}%20${shareUrl}`
  };

  if (urls[platform]) {
    window.open(urls[platform], '_blank', 'width=600,height=400');
  }
};

export const copyToClipboard = (text) => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      return true;
    }).catch(() => {
      return false;
    });
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
};




