/**
 * @file supabase-config.js
 * @description Zentrale Konfiguration fuer Supabase.
 *
 * SUPABASE FREE TIER LIMITS (Stand 2025):
 * - Database Storage: 500 MB
 * - Auth Users: Unbegrenzt (Fair Use)
 * - API Requests: Unbegrenzt, Rate Limit 60 req/s pro IP
 * - Storage: 1 GB
 * - Bandwidth (Egress): 2 GB / Monat
 * - Realtime Connections: 200 gleichzeitig
 *
 * UNSERE SYNC-STRATEGIE (Limit-sicher):
 * - Debounced Sync: 5 Sekunden nach letzter Aenderung
 * - Periodischer Sync: Alle 2 Minuten (nur wenn Tab fokussiert)
 * - Sync bei Tab-Verlassen / Seite schliessen
 * - Bei ~50 aktiven Usern und durchschnittlich 50KB Payload:
 *   -> ~720 Requests/Tag/User = ~21.600/Monat = vollkommen im Limit
 *   -> Bandwidth: ~1-3 MB/Monat/User = im 2GB Limit
 */
const DQ_SUPABASE_CONFIG = {
    URL: 'https://kbanvccqqldfzpiiknah.supabase.co',
    KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiYW52Y2NxcWxkZnpwaWlrbmFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMDMwNzQsImV4cCI6MjA5MjU3OTA3NH0.xM3TaDLbQRklgGQqBli5IBxNP3DeJpxc3UvfwxSCcqQ'
};
