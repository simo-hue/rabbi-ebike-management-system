# Contributing to Rabbi E-Bike Management System

Grazie per il tuo interesse nel contribuire al progetto! 🎉

## 🚀 Come Contribuire

### 1. Fork del Repository
```bash
# Clona il tuo fork
git clone https://github.com/TUO-USERNAME/rabbi-ebike-management-system.git
cd rabbi-ebike-management-system
```

### 2. Setup Ambiente di Sviluppo
```bash
# Installa dipendenze frontend
npm install

# Installa dipendenze server
cd server && npm install
```

### 3. Crea un Branch per la Tua Feature
```bash
git checkout -b feature/nome-nuova-feature
# oppure
git checkout -b fix/nome-bug-fix
```

## 📋 Linee Guida

### Code Style
- Usa **TypeScript** per il frontend
- Mantieni lo stile esistente con **Prettier**
- Segui le convenzioni **ESLint**
- Commenta il codice complesso

### Commit Messages
```bash
git commit -m "feat: aggiunge nuova funzionalità X"
git commit -m "fix: risolve problema Y"
git commit -m "docs: aggiorna documentazione Z"
```

### Testing
- Testa sempre le modifiche localmente
- Verifica che il server si avvii senza errori
- Controlla che il frontend funzioni correttamente

## 🐛 Segnalazione Bug

Usa il template Bug Report con:
- Passi per riprodurre
- Sistema operativo e versioni
- Log degli errori
- Screenshot se utili

## ✨ Richieste Funzionalità

Usa il template Feature Request con:
- Descrizione dettagliata
- Caso d'uso
- Mockup se disponibili

## 📚 Documentazione

- Aggiorna il README se necessario
- Documenta nuove API nel codice
- Aggiungi esempi d'uso

## ⚡ Pull Request

1. **Testa** le tue modifiche
2. **Documenta** i cambiamenti
3. **Descrivi** chiaramente la PR
4. **Linka** issue correlate

### Template PR
```markdown
## Descrizione
Breve descrizione delle modifiche

## Tipo di Modifica
- [ ] Bug fix
- [ ] Nuova feature
- [ ] Breaking change
- [ ] Documentazione

## Testing
- [ ] Testato localmente
- [ ] Server funziona
- [ ] Frontend funziona

## Checklist
- [ ] Codice segue lo style guide
- [ ] Self-review completato
- [ ] Documentazione aggiornata
```

## 🏗️ Architettura

### Frontend (React + TypeScript)
```
src/
├── components/     # Componenti React
├── services/       # API calls
├── types/          # Type definitions
└── hooks/          # Custom hooks
```

### Backend (Node.js + Express)
```
server/
├── server.js       # Main server file
├── rabbi_ebike.db  # SQLite database
└── backups/        # Database backups
```

## 🔧 Commands Utili

```bash
# Avvia sviluppo
npm run dev          # Frontend
cd server && npm start  # Backend

# Build produzione
npm run build

# Linting
npm run lint

# Test database
cd server && sqlite3 rabbi_ebike.db .tables
```

## 📞 Supporto

- Apri una [Issue](https://github.com/username/rabbi-ebike-management-system/issues) per problemi
- Consulta la [Documentazione](README.md) completa

## 📄 Licenza

Contribuendo, accetti che i tuoi contributi saranno rilasciati sotto la licenza MIT del progetto.