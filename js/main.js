/**
 * WhatsApp Landing - Optimizado para conversiones
 * Versión mejorada con detección confiable de apertura
 */

// Configuración centralizada
const WHATSAPP_CONFIG = {
  phone: '573164400207',
  messages: {
    es: 'Hola. Me gustaría recibir más información sobre los servicios que vi en tu página web. Gracias',
  }
};

// Detección de dispositivos
const DEVICE_INFO = {
  isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
  isAndroid: /Android/.test(navigator.userAgent),
  isMobile: /iPhone|Android|iPad|iPod|Windows Phone|webOS|BlackBerry|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent),
  isMacOS: /Macintosh|MacIntel|MacPPC|Mac68K/.test(navigator.platform),
  isDesktop: !/iPhone|Android|iPad|iPod|Windows Phone|webOS|BlackBerry|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent)
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
  links.forEach(link => {
    // SEO y seguridad
    link.setAttribute('rel', 'nofollow noopener');
    link.setAttribute('aria-label', 'Contactar por WhatsApp');
    
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      
      // Tracking de conversión - GTM/GA4
      if (typeof dataLayer !== 'undefined') {
        dataLayer.push({
          'event': 'conversion',
          'conversion_type': 'whatsapp_click',
          'conversion_value': 180000,
          'language': lang,
          'page_url': window.location.pathname,
          'device_type': DEVICE_INFO.isMobile ? 'mobile' : 'desktop',
          'device_os': getDeviceOS(),
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
      
      if (DEVICE_INFO.isIOS) {
        // iOS: Ofrecer WhatsApp y Messages
        const success = await tryOpenContactIOS(phone, encodedMessage, message, lang);
        if (!success) {
          showContactModal(phone, encodedMessage, message, lang, 'ios');
        }
      } else if (DEVICE_INFO.isMobile) {
        // Android/Otros móviles: Solo WhatsApp
        const success = await tryOpenWhatsAppMobile(phone, encodedMessage);
        if (!success) {
          showContactModal(phone, encodedMessage, message, lang, 'android');
        }
      } else {
        // Desktop: WhatsApp Web + opciones adicionales
        const success = await tryOpenWhatsAppDesktop(phone, encodedMessage);
        if (!success) {
          showContactModal(phone, encodedMessage, message, lang, 'desktop');
        }
      }
    });
  });
}

/**
 * Manejo específico para dispositivos iOS
 */
async function tryOpenContactIOS(phone, whatsappMessage, originalMessage, lang) {
  // Intentar WhatsApp primero (más común)
  const whatsappUrl = `https://wa.me/${phone}?text=${whatsappMessage}`;
  const smsUrl = `sms:+${phone}&body=${encodeURIComponent(originalMessage)}`;
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    let resolved = false;
    
    const resolveOnce = (success) => {
      if (!resolved) {
        resolved = true;
        resolve(success);
      }
    };
    
    // Intentar WhatsApp primero
    window.location.href = whatsappUrl;
    
    // Monitorear visibilidad de la página
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // La página se ocultó, probablemente se abrió una app
        resolveOnce(true);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Si después de 2.5 segundos no se ocultó, mostrar opciones
    setTimeout(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (!document.hidden) {
        resolveOnce(false);
      } else {
        resolveOnce(true);
      }
    }, 2500);
  });
}

/**
 * Obtener información del sistema operativo
 */
function getDeviceOS() {
  if (DEVICE_INFO.isIOS) return 'ios';
  if (DEVICE_INFO.isAndroid) return 'android';
  if (DEVICE_INFO.isMacOS) return 'macos';
  if (navigator.platform.indexOf('Win') > -1) return 'windows';
  if (navigator.platform.indexOf('Linux') > -1) return 'linux';
  return 'unknown';
}
async function tryOpenWhatsAppMobile(phone, message) {
  const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
  
  // Intentar abrir directamente
  const startTime = Date.now();
  window.location.href = whatsappUrl;
  
  // Usar Page Visibility API para detectar si salió de la página
  return new Promise((resolve) => {
    const checkVisibility = () => {
      // Si la página se oculta rápidamente, WhatsApp se abrió
      if (document.hidden || Date.now() - startTime > 2000) {
        resolve(true);
        return;
      }
      
      // Si después de 3 segundos la página sigue visible, falló
      setTimeout(() => {
        if (!document.hidden) {
          resolve(false);
        } else {
          resolve(true);
        }
      }, 3000);
    };
    
    // Escuchar cambios de visibilidad
    document.addEventListener('visibilitychange', checkVisibility, { once: true });
    
    // Timeout de respaldo
    setTimeout(() => checkVisibility(), 100);
  });
}

/**
 * Abrir WhatsApp Web en desktop con detección avanzada
 */
async function tryOpenWhatsAppDesktop(phone, message) {
  const whatsappWebUrl = `https://web.whatsapp.com/send?phone=${phone}&text=${message}`;
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    let resolved = false;
    
    // Función para resolver solo una vez
    const resolveOnce = (success) => {
      if (!resolved) {
        resolved = true;
        resolve(success);
      }
    };
    
    // Intentar abrir en nueva ventana/pestaña
    const newWindow = window.open(whatsappWebUrl, '_blank', 'noopener,noreferrer');
    
    // Verificar si la ventana se abrió correctamente
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      resolveOnce(false);
      return;
    }
    
    // Monitear la nueva ventana
    const checkWindow = setInterval(() => {
      try {
        // Si la ventana se cierra rápidamente (usuario canceló)
        if (newWindow.closed) {
          clearInterval(checkWindow);
          resolveOnce(false);
          return;
        }
        
        // Si después de 5 segundos la ventana sigue abierta, asumimos éxito
        if (Date.now() - startTime > 5000) {
          clearInterval(checkWindow);
          resolveOnce(true);
        }
      } catch (e) {
        // Error de acceso cross-origin es normal
        clearInterval(checkWindow);
        resolveOnce(true);
      }
    }, 500);
    
    // Detectar si el usuario regresa al foco de la ventana original
    const handleFocus = () => {
      // Si regresa muy rápido, probablemente falló
      if (Date.now() - startTime < 2000) {
        resolveOnce(false);
      } else {
        resolveOnce(true);
      }
      window.removeEventListener('focus', handleFocus);
    };
    
    // Escuchar cuando la ventana original recupere el foco
    setTimeout(() => {
      window.addEventListener('focus', handleFocus);
    }, 1000);
    
    // Timeout final de seguridad
    setTimeout(() => {
      try {
        clearInterval(checkWindow);
        window.removeEventListener('focus', handleFocus);
        
        // Si la nueva ventana sigue abierta, es éxito
        if (newWindow && !newWindow.closed) {
          resolveOnce(true);
        } else {
          resolveOnce(false);
        }
      } catch (e) {
        resolveOnce(true);
      }
    }, 8000);
  });
}

/**
 * Modal universal de contacto adaptado por dispositivo
 */
function showContactModal(phone, whatsappMessage, originalMessage, lang, deviceType) {
  // Prevenir múltiples modales
  if (document.querySelector('.wa-modal')) return;
  
  const texts = {
    es: { 
      title: {
        ios: '📱 Elige cómo contactarnos',
        android: '📱 No se pudo abrir WhatsApp automáticamente',
        desktop: '💬 Opciones de contacto'
      },
      subtitle: {
        ios: 'Selecciona tu app preferida:',
        android: 'Elige una opción para contactarnos:',
        desktop: 'Elige cómo prefieres contactarnos:'
      },
      whatsapp: 'WhatsApp',
      messages: 'Mensajes (SMS)',
      web: 'WhatsApp Web',
      download: 'Descargar WhatsApp',
      imessage: 'Enviar SMS',
      copy: 'Copiar número',
      copied: '✓ Número copiado'
    },
    en: { 
      title: {
        ios: '📱 Choose how to contact us',
        android: '📱 Could not open WhatsApp automatically',
        desktop: '💬 Contact options'
      },
      subtitle: {
        ios: 'Select your preferred app:',
        android: 'Choose an option to contact us:',
        desktop: 'Choose how you prefer to contact us:'
      },
      whatsapp: 'WhatsApp',
      messages: 'Messages (SMS)',
      web: 'WhatsApp Web',
      download: 'Download WhatsApp',
      imessage: 'Send SMS',
      copy: 'Copy number',
      copied: '✓ Number copied'
    }
  };
  
  const t = texts[lang] || texts.es;
  const smsUrl = `sms:+${phone}${DEVICE_INFO.isIOS ? '&' : '?'}body=${encodeURIComponent(originalMessage)}`;
  
  // Generar opciones según el dispositivo
  let optionsHTML = '';
  
  if (deviceType === 'ios') {
    optionsHTML = `
      <a href="https://wa.me/${phone}?text=${whatsappMessage}" 
         class="wa-btn wa-primary"
         onclick="trackModalAction('whatsapp_ios_click')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
        </svg>
        ${t.whatsapp}
      </a>
      
      <a href="${smsUrl}" 
         class="wa-btn wa-imessage"
         onclick="trackModalAction('messages_ios_click')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3c5.5 0 10 3.58 10 8 0 4.42-4.5 8-10 8-1.12 0-2.18-.11-3.17-.31C7.7 19.77 6.12 20.5 4 21c2.5-2.5 2.5-3.5 2.5-4C4.46 15.46 2 12.85 2 11c0-4.42 4.5-8 10-8z"/>
        </svg>
        ${t.messages}
      </a>`;
  } else if (deviceType === 'android') {
    optionsHTML = `
      <a href="https://wa.me/${phone}?text=${whatsappMessage}" 
         class="wa-btn wa-primary"
         onclick="trackModalAction('whatsapp_android_retry')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
        </svg>
        ${t.whatsapp}
      </a>
      
      <a href="${smsUrl}" 
         class="wa-btn wa-secondary"
         onclick="trackModalAction('sms_android_click')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
        </svg>
        ${t.imessage}
      </a>
      
      <a href="https://www.whatsapp.com/download" 
         target="_blank" 
         rel="noopener"
         class="wa-btn wa-tertiary"
         onclick="trackModalAction('download_click')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        ${t.download}
      </a>`;
  } else {
    // Desktop
    optionsHTML = `
      <a href="https://web.whatsapp.com/send?phone=${phone}&text=${whatsappMessage}" 
         target="_blank" 
         rel="noopener"
         class="wa-btn wa-primary"
         onclick="trackModalAction('web_click')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
        </svg>
        ${t.web}
      </a>
      
      <a href="https://www.whatsapp.com/download" 
         target="_blank" 
         rel="noopener"
         class="wa-btn wa-secondary"
         onclick="trackModalAction('download_click')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        ${t.download}
      </a>`;
  }

  const modal = document.createElement('div');
  modal.className = 'wa-modal';
  modal.innerHTML = `
    <div class="wa-backdrop" onclick="closeWhatsAppModal()"></div>
    <div class="wa-content">
      <div class="wa-header">
        <h3>${t.title[deviceType]}</h3>
        <p class="wa-subtitle">${t.subtitle[deviceType]}</p>
        <button onclick="closeWhatsAppModal()" class="wa-close" aria-label="Cerrar">×</button>
      </div>
      
      <div class="wa-options">
        ${optionsHTML}
        
        <button onclick="copyWhatsAppNumber('${phone}', '${t.copied}')" 
                class="wa-btn wa-copy"
                id="copyButton">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
          </svg>
          ${t.copy}: +${phone}
        </button>
      </div>
    </div>
  `;

  // Estilos CSS modernos inline
  if (!document.querySelector('#wa-modal-styles')) {
    const styles = document.createElement('style');
    styles.id = 'wa-modal-styles';
    styles.textContent = `
      .wa-modal {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        animation: fadeIn 0.3s ease;
      }
      
      .wa-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
      }
      
      .wa-content {
        background: white;
        border-radius: 20px;
        max-width: 440px;
        width: 100%;
        position: relative;
        z-index: 1;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
        animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        overflow: hidden;
      }
      
      .wa-header {
        padding: 32px 32px 24px;
        text-align: center;
        background: linear-gradient(135deg, #25D366 0%, #20bd5a 100%);
        color: white;
        position: relative;
      }
      
      .wa-header h3 {
        margin: 0 0 8px;
        font-size: 1.25rem;
        font-weight: 600;
      }
      
      .wa-subtitle {
        margin: 0;
        opacity: 0.9;
        font-size: 0.9rem;
      }
      
      .wa-close {
        position: absolute;
        top: 16px;
        right: 20px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        font-size: 20px;
        cursor: pointer;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
      }
      
      .wa-close:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: rotate(90deg);
      }
      
      .wa-options {
        padding: 32px;
        display: flex;
        flex-direction: column;
        gap: 16px;
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
        gap: 12px;
        position: relative;
        overflow: hidden;
      }
      
      .wa-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transition: left 0.5s;
      }
      
      .wa-btn:hover::before {
        left: 100%;
      }
      
      .wa-primary {
        background: linear-gradient(135deg, #25D366 0%, #20bd5a 100%);
        color: white;
        box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3);
      }
      
      .wa-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(37, 211, 102, 0.4);
      }
      
      .wa-secondary {
        background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
        color: white;
        box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
      }
      
      .wa-secondary:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 123, 255, 0.4);
      }
      .wa-secondary {
        background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
        color: white;
        box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
      }
      
      .wa-secondary:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 123, 255, 0.4);
      }
      
      .wa-tertiary {
        background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
        color: white;
        box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);
      }
      
      .wa-tertiary:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(108, 117, 125, 0.4);
      }
      
      .wa-imessage {
        background: linear-gradient(135deg, #007AFF 0%, #0051D0 100%);
        color: white;
        box-shadow: 0 4px 15px rgba(0, 122, 255, 0.3);
      }
      
      .wa-imessage:hover { 
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 122, 255, 0.4);
      }
      .wa-copy {
        background: #f8f9fa;
        color: #495057;
        border: 2px solid #e9ecef;
      }
      
      .wa-copy:hover {
        background: #e9ecef;
        border-color: #25D366;
        color: #25D366;
      }
      
      .wa-copy.copied {
        background: #d4edda !important;
        color: #155724 !important;
        border-color: #c3e6cb !important;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes slideUp {
        from { 
          opacity: 0;
          transform: translateY(30px) scale(0.9);
        }
        to { 
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      
      @keyframes slideDown {
        from { 
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        to { 
          opacity: 0;
          transform: translateY(30px) scale(0.9);
        }
      }
      
      @media (max-width: 480px) {
        .wa-modal {
          padding: 16px;
        }
        
        .wa-header {
          padding: 24px 24px 20px;
        }
        
        .wa-options {
          padding: 24px;
        }
        
        .wa-btn {
          font-size: 15px;
        }
      }
    `;
    document.head.appendChild(styles);
  }

  document.body.appendChild(modal);

  // Event listeners
  document.addEventListener('keydown', handleEscapeKey);
  
  // Tracking del modal mostrado
  if (typeof dataLayer !== 'undefined') {
    dataLayer.push({
      'event': 'whatsapp_modal_shown',
      'modal_reason': 'whatsapp_failed_to_open'
    });
  }
}

/**
 * Funciones globales para el modal
 */
window.copyWhatsAppNumber = async function(phone, copiedText) {
  const button = document.getElementById('copyButton');
  const originalText = button.innerHTML;
  
  try {
    await navigator.clipboard.writeText(`+${phone}`);
    button.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
    </svg>${copiedText}`;
    button.classList.add('copied');
    
    trackModalAction('number_copied');
    
    setTimeout(() => {
      button.innerHTML = originalText;
      button.classList.remove('copied');
    }, 3000);
    
  } catch (err) {
    // Fallback para navegadores sin clipboard API
    const textArea = document.createElement('textarea');
    textArea.value = `+${phone}`;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      button.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>${copiedText}`;
      button.classList.add('copied');
      
      setTimeout(() => {
        button.innerHTML = originalText;
        button.classList.remove('copied');
      }, 3000);
    } catch (err) {
      console.error('Error copiando número:', err);
    }
    
    document.body.removeChild(textArea);
  }
};

window.closeWhatsAppModal = function() {
  const modal = document.querySelector('.wa-modal');
  if (modal) {
    modal.style.animation = 'fadeOut 0.3s ease';
    const content = modal.querySelector('.wa-content');
    if (content) {
      content.style.animation = 'slideDown 0.3s ease';
    }
    
    setTimeout(() => {
      modal.remove();
      document.removeEventListener('keydown', handleEscapeKey);
    }, 300);
  }
};

// Función para manejar la tecla Escape
function handleEscapeKey(e) {
  if (e.key === 'Escape') {
    closeWhatsAppModal();
  }
}

// Función para tracking de acciones del modal
function trackModalAction(action) {
  if (typeof dataLayer !== 'undefined') {
    dataLayer.push({
      'event': 'whatsapp_modal_action',
      'action': action
    });
  }
}

// Hacer trackModalAction global para onclick handlers
window.trackModalAction = trackModalAction;

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

/**
 * Inicialización cuando el DOM esté listo
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWhatsAppLanding);
} else {
  initWhatsAppLanding();
}