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