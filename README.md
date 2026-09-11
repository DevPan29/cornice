# Cornice

Slideshow di foto da Google Drive, pensato per restare acceso su un dispositivo
fisso appeso al muro. Una pagina sola, nessun build, nessun database. L'accesso è
protetto da un token nell'indirizzo, verificato da un Worker Cloudflare.

```
cornice/
├── wrangler.jsonc      configurazione del Worker
├── src/
│   └── index.js        controllo del token, poi serve gli asset
└── public/
    └── index.html      la cornice
```

---

## 1. Le foto su Google Drive

1. Crea una cartella dedicata, es. `Cornice`.
2. Tasto destro → **Condividi** → *Accesso generale* → **Chiunque abbia il link**,
   ruolo **Visualizzatore**. Senza questo passaggio l'elenco si legge ma le immagini
   restano nere: è l'errore più comune.
3. Copia il link di condivisione:

   ```
   https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz?usp=drive_link
   ```

   **Nel campo *ID della cartella* va solo la parte centrale**, fra `/folders/` e il
   punto interrogativo:

   ```
   1AbCdEfGhIjKlMnOpQrStUvWxYz
   ```

   Niente `https://`, niente `?usp=drive_link`.

Consiglio: tieni nella cartella copie ridimensionate a ~2000px lato lungo. Le foto da
8 MB appesantiscono il caricamento senza guadagno visibile su uno schermo 1080p.

## 2. La chiave API di Google

1. [console.cloud.google.com](https://console.cloud.google.com) → nuovo progetto (es. `cornice`).
2. *API e servizi* → *Libreria* → **Google Drive API** → **Abilita**.
3. *API e servizi* → **Credenziali** (menu di sinistra) → **+ Crea credenziali** →
   **Chiave API**.

   Non usare il pulsante *Crea credenziali* che compare nella pagina di dettaglio
   dell'API: apre la procedura guidata "Quale API stai utilizzando?", che propone solo
   **Dati utente** (client OAuth: richiederebbe il login a ogni riavvio) e **Dati
   applicazione** (service account: file di credenziali privato, impubblicabile in una
   pagina statica). Qui serve la chiave API semplice, che quella procedura non offre.

4. Nel pannello di creazione:
   - **Nome**: qualcosa di riconoscibile, es. `cornice-web`
   - **Seleziona limitazioni dell'API** → spunta solo **Google Drive API**
   - **Autentica le chiamate API tramite un service account** → lascia deselezionato
   - **Restrizioni delle applicazioni** → **Siti web**
5. Copia la chiave `AIza...`.

### Il referrer: solo il dominio, senza percorso

Sotto *Restrizioni relative ai siti web* → **Add**:

```
https://tuo-worker.tuosubdomain.workers.dev/*
```

**Non** un indirizzo che contenga un percorso. Con la policy predefinita dei browser
(`strict-origin-when-cross-origin`) la richiesta verso Google porta con sé solo
l'origine, mai il percorso: una regola con un percorso non combacia mai e Google
risponde **403**.

Le modifiche alle chiavi impiegano qualche minuto a propagarsi: dopo il salvataggio
attendi ~5 minuti e ricarica con `Ctrl+F5`.

**Ogni cambio di dominio va riportato qui**, altrimenti la cornice smette di leggere
la cartella.

La chiave finisce nel browser: è accettabile, perché con quelle due limitazioni può
solo elencare cartelle già pubbliche del tuo progetto. In più, con il token davanti,
la pagina che la contiene non è raggiungibile da chi non ha l'indirizzo completo.

---

## 3. L'accesso con token

### Perché un token e non un login

La cornice gira su un dispositivo fisso, spesso vecchio, che deve accendersi e mostrare
le foto senza che nessuno tocchi niente. Qualunque autenticazione interattiva
(Cloudflare Access, OAuth, un form di login) richiede un browser moderno e una sessione
che prima o poi scade: su un tablet datato la pagina di login può proprio non aprirsi.
Il token elimina il problema alla radice: si passa una volta sola, il Worker imposta un
cookie che dura un anno, e il dispositivo non si autentica mai più.

### Come funziona

`src/index.js` intercetta **ogni** richiesta prima che venga servito qualsiasi file —
è quello che fa `run_worker_first` in `wrangler.jsonc`. Tre casi:

1. `?k=` corrisponde al secret → serve la pagina e imposta il cookie `frame_auth`
2. cookie `frame_auth` valido → serve la pagina
3. niente di valido → **404**, non 403: chi capita sull'indirizzo per caso non deve
   sapere che lì c'è qualcosa

### Configurazione del secret

Dashboard Cloudflare → **Workers & Pages** → il progetto → **Settings** →
**Runtime variables and secrets** → **Add**:

| campo | valore |
| --- | --- |
| tipo | **Secret** |
| nome | `FRAME_TOKEN` |
| valore | una stringa lunga e casuale, generata a caso (non riusarla altrove) |

Salva e fai un nuovo deploy: i secret vengono applicati al deploy successivo.

> La sezione *Runtime variables* resta disabilitata finché il Worker non ha del codice
> ("Variables cannot be added to a Worker that only has static assets"). Se la vedi
> grigia, manca `main` in `wrangler.jsonc`. La sezione *Variables and secrets* dentro
> **Builds** è un'altra cosa: contiene le variabili disponibili durante la build.

### Primo accesso

```
https://tuo-worker.workers.dev/?k=IL_TUO_TOKEN
```

Da quel momento il cookie autorizza le visite successive per un anno, anche senza il
token nell'indirizzo. Sul dispositivo conviene salvare in home l'indirizzo **senza**
`?k=`, così il segreto non resta visibile nella barra.

Il token convive con i parametri di configurazione:

```
https://tuo-worker.workers.dev/?k=TOKEN&folderId=1AbC...&apiKey=AIza...&intervalSec=45&onHour=8&offHour=22
```

Conviene fare la prima prova **dal PC**: se qualcosa non va (token sbagliato, chiave non
valida, cartella non condivisa) hai la console del browser per capire dove si rompe.
Solo quando funziona lì, apri l'indirizzo sul dispositivo finale.

### Se il cookie si perde

Svuotare i dati del browser cancella anche il cookie: basta riaprire l'indirizzo con
`?k=`. Tieni il token annotato da qualche parte — dopo il salvataggio non è più
leggibile dalla dashboard, ma puoi sempre sostituirlo con un valore nuovo.

---

## 4. Prima configurazione della cornice

Apri il sito: si presenta il pannello impostazioni. Inserisci ID cartella e chiave,
premi **Prova la cartella**, poi **Salva e avvia**. Le impostazioni restano nel browser
del dispositivo.

### Comandi

| | |
| --- | --- |
| Tocco / clic | schermo intero, mostra data, ora, didascalia e controlli |
| Barra dei controlli | precedente · play/pausa · successiva |
| Barra spaziatrice | play / pausa |
| `←` `→` | foto precedente / successiva |
| Pressione lunga (1,4 s) o `S` | impostazioni |
| `N` | passa a notte / risveglia |
| `F` | schermo intero |

I controlli compaiono al tocco insieme alla didascalia e svaniscono dopo 7 secondi:
niente resta acceso fisso sullo schermo. In pausa restano visibili finché non si
riprende, perché è lì che servono. La pausa ferma solo l'avanzamento automatico:
le frecce e i pulsanti continuano a funzionare. All'ora di riposo la pausa si azzera,
così al mattino la cornice riparte da sola.

Il pulsante *precedente* si disattiva quando non c'è più cronologia indietro: la
cronologia tiene le ultime 60 foto.

---

## 5. Elenco JSON al posto di Drive

Se un giorno Google cambia gli indirizzi delle immagini, il sito funziona anche con un
file `photos.json` accanto all'`index.html`, senza toccare il codice:

```json
{ "photos": [
  { "url": "foto/mare-2019.jpg", "name": "Polignano", "taken": "2019-07-14" },
  { "url": "https://.../compleanno.jpg" }
] }
```

Poi metti l'indirizzo del file nel campo *elenco JSON* delle impostazioni.

---

## 6. Lo schermo

La pagina può solo diventare nera all'ora di riposo. Lo **standby vero** dipende dal
dispositivo.

**Tablet Android + Fully Kiosk Browser** — la strada più completa. Un tablet usato o da
100 €, e nell'app imposti: avvio automatico della pagina, schermo intero senza barre,
accensione/spegnimento a orario, salvaschermo e **rilevamento del movimento con la
fotocamera frontale**. La versione PLUS costa una manciata di euro, una volta sola.

**iPad vecchio** — riciclo a costo zero, con dei limiti da conoscere. Il browser è
quello di sistema (su iOS tutti i browser usano WebKit: installarne un altro non cambia
nulla), quindi su versioni datate certe pagine moderne non si aprono — è esattamente il
motivo per cui qui l'accesso passa da un token e non da un login. Non c'è modo di
spegnere lo schermo a orario né di rilevare il movimento. Si usa **Accesso Guidato**
per bloccare il dispositivo su Safari a schermo intero, e *Blocco automatico: Mai*.
Tenerlo sempre in carica accelera il degrado della batteria: valuta una presa comandata.
`wakeLock` richiede iPadOS 16+; sotto quella versione lo schermo resta acceso solo grazie
a *Blocco automatico: Mai*.

**Raspberry Pi + monitor** — Chromium in modalità kiosk, `wlr-randr`/`vcgencmd` da cron
per spegnere l'uscita HDMI la sera e riaccenderla al mattino, sensore PIR sui GPIO per il
risveglio al movimento. Più lavoro, controllo totale, e il monitor si spegne davvero.

**Monitor "smart" con browser integrato** — comodo ma il browser è limitato: niente
kiosk vero, niente ricarica automatica, aggiornamenti a sorpresa. È l'opzione che
consiglio meno.

In tutti i casi: pannello **IPS opaco**, luminosità bassa (la cornice deve sembrare una
stampa, non una TV), e alimentazione su una presa comandata se vuoi il taglio netto di
notte.
