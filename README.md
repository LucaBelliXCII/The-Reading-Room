# The Reading Room — GitHub + Netlify

Questa versione contiene 55 libri (45 del catalogo iniziale, più i 10 thriller NYT).

## Struttura
- `index.html`: interfaccia e funzionalità del sito.
- `catalogo.js`: dati dei libri (titolo, autore, trame, tag, consigli, ecc.). **È il file da aggiornare ogni volta che vogliamo aggiungere libri.**
- `netlify.toml`: impostazioni per Netlify (sito statico senza build).

## Configurazione iniziale — una sola volta
1. Crea su GitHub un repository, ad es. `the-reading-room`, e carica **i tre file nella radice** del repository (non la cartella esterna né il file ZIP).
2. Apri il **progetto Netlify già esistente** `mellifluous-cobbler-6f8666`.
3. In **Project configuration → Developer settings → Continuous deployment → Repository**, scegli **Link repository** e collega il repository GitHub. Branch: `main`; build command: nessuno; publish directory: `.`.
4. In **ChatGPT → Impostazioni → Plugin → GitHub**, collega lo stesso account e concedi l'accesso a questo repository. Se non è elencato, verifica le autorizzazioni su GitHub.
5. Verifica che l'indirizzo già esistente funzioni e che compaiano 55 libri, prima di considerare completata la migrazione.

## Aggiornamenti futuri
Dì a ChatGPT quali libri aggiungere, rimuovere o modificare. Una volta collegato il repository e con le autorizzazioni di scrittura disponibili, ChatGPT potrà modificare `catalogo.js` tramite GitHub. Ogni commit su `main` attiverà il deploy automatico di Netlify.

## Cosa non è sincronizzato
- Preferiti, note, stati di lettura e libri inseriti dal pulsante “+ Libro” restano nel `localStorage` del singolo browser, con possibilità di esportare e importare un backup JSON.
- Questa migrazione **non modifica** il localStorage e non crea una sincronizzazione tra dispositivi.
- Evita di cambiare l'URL/dominio del sito o la chiave di storage se vuoi mantenere il progresso già registrato nello stesso browser.


## Sincronizzazione privata fra dispositivi (predisposta, non attiva finché non configurata)

Il sito continua a funzionare in locale senza configurazione. Per attivare l'account cloud:

1. Apri [Supabase](https://supabase.com/dashboard) e crea un progetto gratuito personale.
2. In **SQL Editor** esegui interamente `supabase_setup.sql` per creare tabelle e regole RLS (solo proprietario).
3. In **Authentication → URL Configuration**, imposta il Site URL su `https://mellifluous-cobbler-6f8666.netlify.app` e aggiungilo fra i Redirect URLs. Email authentication deve essere abilitata.
4. In **Project Settings → API Keys** copia **Project URL** e la sola **publishable key** (`sb_publishable_...`) in `sync-config.js`. Non inserire mai una `sb_secret_...`, `service_role` o password.
5. Pubblica il commit. Comparirà il pulsante **☁ Accedi** sul sito; fai login su ciascun dispositivo con la medesima email.

Ogni account ha il proprio storage locale e righe cloud protette da Row Level Security. Le modifiche sono salvate prima in locale e inviate quando c'è connessione. Il vecchio storage guest viene mantenuto intatto; se il cloud è vuoto al primo login viene importato automaticamente. Se sul cloud ci sono già dati, il pulsante **Importa dati locali precedenti** unisce i soli elementi mancanti. Il backup JSON rimane sempre disponibile. Per evitare conflitti, non modificare simultaneamente la **stessa** scheda libro da più dispositivi: in tal caso prevale l'ultima modifica ricevuta dal server.

Il catalogo editoriale `catalogo.js` resta pubblico e aggiornabile direttamente da GitHub/ChatGPT, indipendentemente dai dati personali.
## Traduzioni italiane (14 novembre 2026)

- `traduzioni.js` contiene una scheda per ciascuno dei 116 libri del catalogo, con lo stato: `it` (edizione pubblicata in italiano), `en` (nessuna edizione italiana trovata), `soon` (edizione annunciata, non ancora pubblicata), `verify` (informazione incerta).
- Il filtro **Lingua** nella pagina Esplora permette di vedere solo le edizioni italiane, solo i libri senza traduzione trovata, quelli annunciati e quelli ancora da verificare.
- Il badge compare sulle schede, nei dettagli e nella sezione Saghe. Nei dettagli è riportato anche il titolo italiano, quando noto, e alcune schede editoriali di riferimento.
- **Il badge ITA non garantisce la disponibilità in Kindle o ebook**: significa soltanto che è stata individuata un'edizione tradotta in italiano. Il badge ENG non è una certificazione definitiva di inesistenza della traduzione.
- I libri aggiunti manualmente possono avere uno stato linguistico assegnato durante l'inserimento; quelli senza dato vengono visualizzati come **DA VERIFICARE**.
- Per aggiungere nuovi libri al catalogo pubblico, aggiornare sia `catalogo.js` sia `traduzioni.js` (altrimenti appariranno come DA VERIFICARE).
- Per le saghe incomplete nella traduzione: Iron Gold è in italiano; Dark Age e Light Bringer non risultano pubblicati in traduzione italiana. Dungeon Crawler Carl è tradotto per i volumi 1–3; i successivi non risultano ancora pubblicati in italiano. The Wolves of War ha un'edizione italiana annunciata per il 19/02/2027.
