# Security Policy

## 🔒 Versioni Supportate

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | ✅ Supportata      |

## 🚨 Segnalazione Vulnerabilità

Se scopri una vulnerabilità di sicurezza, per favore **NON** creare una issue pubblica.

### Procedura di Segnalazione

1. **Email privata**: Invia una email a [security@example.com] con:
   - Descrizione dettagliata della vulnerabilità
   - Passi per riprodurre
   - Impatto potenziale
   - Versione software interessata

2. **Risposta**: Riceverai una conferma entro 48 ore

3. **Risoluzione**: Lavoreremo per risolvere il problema rapidamente

### Linee Guida Sicurezza

#### ✅ Comportamenti Sicuri
- **Database locale**: mantieni `rabbi_ebike.db` in cartella protetta
- **Backup**: proteggi i file di backup (contengono dati clienti)
- **Rete**: non esporre il server direttamente su internet
- **Accesso**: limita l'accesso alla cartella dell'applicazione

#### ⚠️ Rischi Potenziali
- **Esposizione database**: file SQLite contiene dati sensibili clienti
- **Accesso rete**: server senza autenticazione (solo uso locale)
- **Backup**: file backup non cifrati di default

#### 🛡️ Raccomandazioni
1. **Firewall**: blocca porte 3001 e 8080 dall'esterno
2. **Backup sicuri**: cifra i backup se contengono dati sensibili
3. **Accesso limitato**: usa solo su reti fidate
4. **Aggiornamenti**: mantieni Node.js aggiornato

### Configurazione Sicura

```bash
# Limita server solo a localhost
# In server/server.js:
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});

# Backup cifrato
tar -czf - server/rabbi_ebike.db | openssl enc -aes-256-cbc -out backup_sicuro.tar.gz.enc
```

## 🔍 Audit Sicurezza

Per verificare la sicurezza delle dipendenze:

```bash
# Frontend
npm audit
npm audit fix

# Backend  
cd server && npm audit
cd server && npm audit fix
```

## 📚 Risorse

- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [SQLite Security](https://www.sqlite.org/security.html)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)