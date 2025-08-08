/**
 * WhatsApp Landing - Optimizado para conversiones
 * Versión minimalista con tracking avanzado
 */

// Configuración centralizada
const WHATSAPP_CONFIG = {
  phone: '573164400207',
  messages: {
    es: 'Hola. Me gustaría recibir más información sobre los servicios que vi en tu página web. Gracias',
    en: 'Hello. I would like to receive more information about the services I saw on your website. Thank you'
  }
};

/**
 * Inicialización WhatsApp con tracking de conversión
 */
function initWhatsAppLanding() {
  const links = document.querySelectorAll('a#lead_whatsapp');
  if (links.length === 0) return;

  const lang = document.documentElement.lang || 'es';
  const message = WHATSAPP_CONFIG.messages[lang] || WHATSAPP_CONFIG.messages.es;
  const phone = WHATSAPP_CONFIG.phone;
  const encodedMessage = encodeURIComponent(message);
  const isMobile = /iPhone|Android|iPad|iPod|Windows Phone|webOS|BlackBerry|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent);

  links.forEach(link => {
    // SEO y seguridad
    link.setAttribute('rel', 'nofollow noopener');
    link.setAttribute('aria-label', 'Contactar por WhatsApp');
    
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Tracking de conversión - GTM/GA4
      if (typeof dataLayer !== 'undefined') {
        dataLayer.push({
          'event': 'conversion',
          'conversion_type': 'whatsapp_click',
          'conversion_value': 180000, // COP estimado por lead de landing
          'language': lang,
          'page_url': window.location.pathname,
          'device_type': isMobile ? 'mobile' : 'desktop',
          'traffic_source': getTrafficSource()
        });
      }
      
      // Pixel de Facebook (si existe)
      if (typeof fbq !== 'undefined') {
        fbq('track', 'InitiateContact', {
          content_name: 'WhatsApp Click',
          content_category: 'Landing Page Contact'
        });
      }
      
      if (isMobile) {
        // Móvil: directo a WhatsApp
        window.location.href = `https://wa.me/${phone}?text=${encodedMessage}`;
      } else {
        // Desktop: intentar app nativa, fallback a opciones
        tryDesktopWhatsApp(phone, encodedMessage, lang);
      }
    });
  });
}

/**
 * Manejo inteligente de WhatsApp en desktop
 */
function tryDesktopWhatsApp(phone, message, lang) {
  // Intentar protocolo nativo
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = `whatsapp://send?phone=${phone}&text=${message}`;
  document.body.appendChild(iframe);
  
  // Limpiar iframe
  setTimeout(() => {
    try {
      document.body.removeChild(iframe);
    } catch (e) {
      // Iframe ya removido
    }
  }, 2000);

  // Fallback después de 1.5s si no se abrió la app
  setTimeout(() => {
    if (document.visibilityState === 'visible') {
      showWhatsAppModal(phone, message, lang);
    }
  }, 1500);
}

/**
 * Modal moderno de opciones WhatsApp
 */
function showWhatsAppModal(phone, message, lang) {
  // Prevenir múltiples modales
  if (document.querySelector('.wa-modal')) return;
  
  const texts = {
    es: { 
      title: '📱 Contacta con nosotros', 
      web: 'WhatsApp Web',
      copy: 'Copiar número',
      copied: '✓ Copiado'
    },
    en: { 
      title: '📱 Contact us', 
      web: 'WhatsApp Web',
      copy: 'Copy number',
      copied: '✓ Copied'
    }
  };
  const t = texts[lang] || texts.es;

  const modal = document.createElement('div');
  modal.className = 'wa-modal';
  modal.innerHTML = `
    <div class="wa-content">
      <h3>${t.title}</h3>
      <div class="wa-options">
        <a href="https://web.whatsapp.com/send?phone=${phone}&text=${message}" 
           target="_blank" 
           rel="noopener"
           class="wa-btn wa-primary">
          ${t.web}
        </a>
        <button onclick="copyWhatsAppNumber('${phone}', '${t.copied}')" 
                class="wa-btn wa-copy">
          ${t.copy}: +${phone}
        </button>
      </div>
      <button onclick="closeWhatsAppModal()" class="wa-close" aria-label="Cerrar">×</button>
    </div>
  `;

  // Estilos CSS modernos inline (para landing independiente)
  const styles = document.createElement('style');
  styles.textContent = `
    .wa-modal {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: fadeIn 0.3s ease;
    }
    
    .wa-content {
      background: white;
      border-radius: 16px;
      padding: 32px;
      max-width: 420px;
      width: 100%;
      position: relative;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      animation: slideUp 0.3s ease;
    }
    
    .wa-content h3 {
      margin: 0 0 24px;
      color: #25D366;
      font-size: 1.25rem;
      font-weight: 600;
    }
    
    .wa-options {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin: 24px 0;
    }
    
    .wa-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px 24px;
      border-radius: 12px;
      text-decoration: none;
      border: none;
      cursor: pointer;
      font-size: 16px;
      font-weight: 500;
      transition: all 0.3s ease;
      gap: 8px;
    }
    
    .wa-primary {
      background: #25D366;
      color: white;
    }
    
    .wa-primary:hover {
      background: #20bd5a;
      transform: translateY(-2px);
    }
    
    .wa-copy {
      background: #f8f9fa;
      color: #495057;
      border: 2px solid #e9ecef;
    }
    
    .wa-copy:hover {
      background: #e9ecef;
      border-color: #25D366;
    }
    
    .wa-close {
      position: absolute;
      top: 12px;
      right: 16px;
      background: none;
      border: none;
      font-size: 28px;
      cursor: pointer;
      color: #6c757d;
      line-height: 1;
      padding: 4px;
    }
    
    .wa-close:hover {
      color: #dc3545;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideUp {
      from { 
        opacity: 0;
        transform: translateY(20px) scale(0.95);
      }
      to { 
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    @media (max-width: 480px) {
      .wa-content {
        padding: 24px;
        margin: 20px;
      }
    }
  `;

  document.head.appendChild(styles);
  document.body.appendChild(modal);

  // Event listeners
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeWhatsAppModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeWhatsAppModal();
  });
}

/**
 * Funciones globales para el modal
 */
window.copyWhatsAppNumber = function(phone, copiedText) {
  navigator.clipboard.writeText(`+${phone}`).then(() => {
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = copiedText;
    button.style.background = '#d4edda';
    button.style.color = '#155724';
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = '';
      button.style.color = '';
    }, 2000);
  }).catch(() => {
    // Fallback para navegadores sin clipboard API
    const textArea = document.createElement('textarea');
    textArea.value = `+${phone}`;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  });
};

window.closeWhatsAppModal = function() {
  const modal = document.querySelector('.wa-modal');
  if (modal) {
    modal.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => modal.remove(), 300);
  }
};

/**
 * Detectar fuente de tráfico para analytics
 */
function getTrafficSource() {
  const referrer = document.referrer;
  const urlParams = new URLSearchParams(window.location.search);
  
  if (urlParams.get('utm_source')) return urlParams.get('utm_source');
  if (referrer.includes('google')) return 'google';
  if (referrer.includes('facebook')) return 'facebook';
  if (referrer.includes('instagram')) return 'instagram';
  if (referrer === '') return 'direct';
  
  return 'referral';
}

// CSS adicional para fadeOut
const fadeOutStyles = document.createElement('style');
fadeOutStyles.textContent = `
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`;
document.head.appendChild(fadeOutStyles);

/**
 * Inicialización cuando el DOM esté listo
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWhatsAppLanding);
} else {
  initWhatsAppLanding();
}