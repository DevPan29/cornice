# Cornice — guida rapida

Un solo file (`index.html`). Nessun build, nessun server, nessun costo di hosting.

---

## 1. Le foto su Google Drive

1. Crea una cartella dedicata, es. `Cornice`.
2. Tasto destro → **Condividi** → *Chiunque abbia il link* → **Visualizzatore**.
   Senza questo passaggio le immagini non si aprono (l'elenco sì, le foto no: è l'errore più comune).
3. Copia l'ID dal link:
   `https://drive.google.com/drive/folders/`**`1AbC...xyz`** ← questo è l'ID.

Consiglio: tieni nella cartella copie ridimensionate a ~2000px lato lungo. Le foto da 8 MB
appesantiscono il caricamento senza guadagno visibile su uno schermo 1080p.

## 2. La chiave API

1. [console.cloud.google.com](https://console.cloud.google.com) → nuovo progetto (es. `cornice`).
2. *API e servizi* → *Libreria* → **Google Drive API** → **Abilita**.
3. *Credenziali* → **Crea credenziali** → **Chiave API**.
4. Apri la chiave → **Limitazioni per l'applicazione** → *Referrer HTTP* → aggiungi
   `https://tuonome.github.io/*` (o il dominio che userai).
5. **Limitazioni delle API** → solo *Google Drive API*.

La chiave resta visibile nel browser: è normale e accettabile, perché con quelle due limitazioni
può solo elencare cartelle già pubbliche del tuo progetto.

## 3. Pubblicazione gratuita

**GitHub Pages** — repo nuovo, carichi `index.html`, *Settings → Pages → Deploy from branch: main /root*.
Online in un paio di minuti su `https://tuonome.github.io/cornice/`.

**Cloudflare Pages** — trascini la cartella su *Create project → Direct upload*. Dominio
`*.pages.dev`, HTTPS incluso, e in più hai **Cloudflare Access** se un giorno vuoi una vera
autenticazione davanti al sito (gratis fino a 50 utenti).

Entrambi: 0 €, banda più che sufficiente, deploy in un minuto.

## 4. Prima configurazione

Apri il sito: si presenta il pannello impostazioni. Inserisci ID cartella e chiave, premi
**Prova la cartella**, poi **Salva e avvia**.

Le impostazioni restano nel browser del dispositivo. Per configurare la cornice a distanza puoi
anche passarle nell'indirizzo:

```
https://.../cornice/?folderId=1AbC...&apiKey=AIza...&intervalSec=45&onHour=8&offHour=22
```

### Comandi

| | |
|---|---|
| Tocco / clic | schermo intero, mostra ora e didascalia; di notte risveglia |
| Pressione lunga (1,4 s) o tasto `S` | impostazioni |
| `←` `→` | foto precedente / successiva |
| `N` | passa a notte / risveglia |

## 5. Elenco JSON al posto di Drive

Se un giorno Google cambia gli indirizzi delle immagini, il sito funziona anche con un file
`photos.json` accanto all'`index.html`, senza toccare il codice:

```json
{ "photos": [
  { "url": "foto/mare-2019.jpg", "name": "Polignano", "taken": "2019-07-14" },
  { "url": "https://.../compleanno.jpg" }
] }
```

Poi metti l'indirizzo del file nel campo *elenco JSON* delle impostazioni.

## 6. Lo schermo

La pagina web può solo diventare nera alle 22. Lo **standby vero** dipende dal dispositivo:

**Tablet Android + Fully Kiosk Browser** — la strada più economica e completa. Un tablet usato
recuperato o da 100 €, e nell'app imposti: avvio automatico della pagina, schermo intero senza
barre, accensione/spegnimento a orario, salvaschermo e **rilevamento del movimento con la
fotocamera frontale** (o via Bluetooth/PIR). La versione PLUS costa una manciata di euro, una
volta sola. Copre da sola gli ultimi due requisiti senza scrivere una riga di codice.

**Raspberry Pi + monitor** — Chromium in modalità kiosk, `wlr-randr`/`vcgencmd` da cron per
spegnere l'uscita HDMI alle 22 e riaccenderla alle 8, sensore PIR sui GPIO per il risveglio al
movimento. Più lavoro, controllo totale, e il monitor si spegne davvero.

**Monitor "smart" con browser integrato** — comodo ma il browser è limitato: niente kiosk vero,
niente ricarica automatica, aggiornamenti a sorpresa. È l'opzione che consiglio meno.

In tutti i casi: pannello **IPS opaco**, luminosità bassa (la cornice deve sembrare una stampa,
non una TV), e alimentazione su una presa comandata se vuoi il taglio netto di notte.
