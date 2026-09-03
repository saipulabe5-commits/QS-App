export default function stripViteClient() {
  return {
    name: 'strip-vite-client',
    transformIndexHtml(html: string) {
      return html.replace(/<script type="module" src="\/@vite\/client"><\/script>/g, '');
    }
  }
}
