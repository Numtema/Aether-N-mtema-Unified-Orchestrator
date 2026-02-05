
/**
 * AETHER NEXUS - SQL BRIDGE SERVICE
 * Ce service agit comme un client pour l'API PHP qui tourne sur Hostinger.
 */

export class SqlBridgeService {
  /**
   * IMPORTANT : Remplacez l'URL ci-dessous par l'adresse réelle de votre fichier api.php
   * Exemple : "https://lescercueilsencarton/api.php"
   */
  private static readonly API_URL = "https://lescercueilsencarton.fr/api.php"; 

  private static async request(action: string, payload: any = {}) {
    try {
      console.log(`[SQL Bridge] Action: ${action}`, payload);
      
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          ...payload
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SQL Bridge Error (${response.status}): ${errorText || response.statusText}`);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data.result;
    } catch (error: any) {
      console.error("SQL Bridge Request Failed:", error);
      // On throw l'erreur pour qu'elle soit captée par l'UI (systemMessage dans App.tsx)
      throw error;
    }
  }

  // Abstraction CRUD pour MySQL
  static async query(sql: string, params: any[] = []) {
    return this.request('query', { sql, params });
  }

  static async saveRecord(table: string, data: any) {
    return this.request('save', { table, data });
  }

  static async getRecords(table: string, filters: Record<string, any> = {}) {
    return this.request('fetch', { table, filters });
  }

  static async deleteRecord(table: string, id: string) {
    return this.request('delete', { table, id });
  }
}
