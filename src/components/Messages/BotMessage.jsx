import { BotAvatar } from '../Avatars/BotAvatar.jsx';

const ALLOWED_TAGS = new Set(['p', 'ol', 'ul', 'li', 'strong', 'em', 'br']);

function sanitizeHtml(html) {
  if (typeof html !== 'string' || !html.trim()) {
    return '';
  }

  const parser = new DOMParser();
  const xmlSafeHtml = html.replace(/<br\s*>/gi, '<br />');
  const syntaxCheck = parser.parseFromString(`<root>${xmlSafeHtml}</root>`, 'application/xml');
  if (syntaxCheck.querySelector('parsererror')) {
    return '';
  }

  const htmlDoc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const wrapper = htmlDoc.body.firstElementChild;
  if (!wrapper) {
    return '';
  }

  const outDoc = document.implementation.createHTMLDocument('');
  const outRoot = outDoc.createElement('div');

  const copyAllowed = (node, targetParent) => {
    if (node.nodeType === Node.TEXT_NODE) {
      targetParent.appendChild(outDoc.createTextNode(node.textContent ?? ''));
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const tag = node.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      if (tag !== 'script' && tag !== 'style') {
        Array.from(node.childNodes).forEach((child) => copyAllowed(child, targetParent));
      }
      return;
    }

    const next = outDoc.createElement(tag);
    targetParent.appendChild(next);
    Array.from(node.childNodes).forEach((child) => copyAllowed(child, next));
  };

  Array.from(wrapper.childNodes).forEach((child) => copyAllowed(child, outRoot));
  return outRoot.innerHTML.trim();
}

function renderFallbackText(text) {
  const lines = String(text ?? '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line, index) => (
    <p key={`fallback-${index}`} className="bot-message-paragraph">
      {line}
    </p>
  ));
}

export function BotMessage({ message }) {
  const safeHtml = sanitizeHtml(message.html);

  return (
    <article className="message-row message-row-bot">
      <div className="message-bubble bot-bubble bot-welcome-card">
        <span className="bot-card-shine" aria-hidden="true" />
        <BotAvatar />
        <div className="bot-message-copy">
          {safeHtml ? (
            <div className="bot-message-text" dangerouslySetInnerHTML={{ __html: safeHtml }} />
          ) : (
            <div className="bot-message-text">{renderFallbackText(message.text)}</div>
          )}
        </div>
      </div>
      {message.timestamp && <time className="timestamp">{message.timestamp}</time>}
    </article>
  );
}
