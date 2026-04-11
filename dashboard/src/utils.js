// Utility to format JSON with syntax highlighting
export function formatJSON(data) {
  if (data === null || data === undefined) return 'null';
  
  try {
    const json = typeof data === 'string' ? JSON.parse(data) : data;
    return JSON.stringify(json, null, 2);
  } catch {
    return String(data);
  }
}

export function syntaxHighlight(json) {
  if (!json) return '';
  
  const str = typeof json === 'object' ? JSON.stringify(json, null, 2) : json;
  
  return str.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'json-number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'json-key';
        } else {
          cls = 'json-string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

export function getMethodColor(method) {
  const colors = {
    GET: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    POST: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
    PUT: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    DELETE: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    PATCH: 'bg-violet-500/20 text-violet-400 border border-violet-500/30',
  };
  return colors[method] || 'bg-gray-500/20 text-gray-400';
}

export function getStatusColor(status) {
  if (!status) return 'text-gray-400';
  if (status >= 200 && status < 300) return 'text-emerald-400';
  if (status >= 300 && status < 400) return 'text-amber-400';
  if (status >= 400 && status < 500) return 'text-rose-400';
  if (status >= 500) return 'text-rose-500';
  return 'text-gray-400';
}

export function getStatusBg(status) {
  if (!status) return 'bg-gray-500/20 text-gray-400';
  if (status >= 200 && status < 300) return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
  if (status >= 300 && status < 400) return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
  if (status >= 400) return 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
  return 'bg-gray-500/20 text-gray-400';
}

export function getServiceFromUrl(url) {
  if (!url) return 'unknown';
  if (url.startsWith('/auth')) return 'auth';
  if (url.startsWith('/order')) return 'order';
  if (url.startsWith('/logs')) return 'gateway';
  return 'other';
}

export function formatTimestamp(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
  } catch {
    return ts;
  }
}

export function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(() => {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  });
}
