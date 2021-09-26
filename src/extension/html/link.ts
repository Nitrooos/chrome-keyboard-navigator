function getFullUrl(href: string) {
  const isFullUrl = !href.startsWith('/');
  const { protocol, host } = window.location;
  return isFullUrl ? href : `${protocol}${host}${href}`;
}

function isLink(element: HTMLElement) {
  return element.nodeName.toLowerCase() === 'a' && element.getAttribute('href');
}

export {
  getFullUrl,
  isLink
}
