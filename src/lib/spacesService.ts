export class SpacesService {

  async getIndex() {
    try {
      const response = await fetch(`${import.meta.env.SPACES_ENDPOINT}/index.json`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const json = await response.json();
      return json;
    } catch (error) {
      console.error('Erreur lecture index.json:', error);
      throw new Error('Impossible de lire l\'index Spaces');
    }
  }

  async getPdfUrl(key: string) {
    return `${import.meta.env.SPACES_ENDPOINT}/${key}`;
  }
}
