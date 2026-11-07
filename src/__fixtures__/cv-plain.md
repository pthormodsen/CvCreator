# Patrik Thormodsen

Dataingeniørstudent · Fullstackutvikling og IT-infrastruktur

[+47 904 71 841](tel:+4790471841) · [patrik.thormodsen@gmail.com](mailto:patrik.thormodsen@gmail.com)\
[portfolio.patreek.no](https://portfolio.patreek.no) · [github.com/pthormodsen](https://github.com/pthormodsen)\
[linkedin.com/in/pthormodsen](https://www.linkedin.com/in/pthormodsen)

## Profil

Dataingeniørstudent ved Høgskulen på Vestlandet med erfaring fra både frontend og backend, mest med Java, Spring Boot, React, TypeScript og PostgreSQL. Utvikler bookingsystemet til Velferdstinget Vest gjennom Fribyte. Drifter i tillegg egen serverinfrastruktur med Proxmox, Linux, Docker og k3s, der prosjektene mine kjører.

## Teknisk kompetanse

- **Språk:** Java, TypeScript, JavaScript, Python, SQL
- **Backend:** Spring Boot, Spring Security, REST API, FastAPI
- **Frontend:** React, Vite, Tailwind CSS, HTML og CSS
- **Databaser:** PostgreSQL, Flyway, datamodellering
- **Infrastruktur:** Linux, Proxmox, Docker og Docker Compose, k3s (Kubernetes), Nginx, Cloudflare Tunnel
- **CI/CD og verktøy:** Git, GitHub Actions, GitHub Container Registry (GHCR)
- **Maskinlæring:** scikit-learn, pandas, Jupyter

## Utvalgte prosjekter

### VT Booking for Velferdstinget Vest | Gjennom Fribyte

*React · TypeScript · Spring Boot · Spring Security · PostgreSQL · Flyway · Docker*

Bookingsystem for møterom og lokaler hos Velferdstinget Vest. Jeg utvikler både frontend og backend. Systemet kjører i et testmiljø og skal snart tas i bruk av organisasjonene.

- REST API med innlogging, to administratorroller og tilgang per organisasjon og rom: direkte booking, søknad eller ingen tilgang
- Søknader som administrator godkjenner, gjentakende bookinger og regler som hindrer dobbeltbooking
- Kalender i React med dag-, uke- og månedsvisning
- Skjemaet versjoneres med Flyway. Images bygges i GitHub Actions og kjøres med Docker Compose bak Nginx

### Homelab og serverinfrastruktur

*Proxmox · Linux · Docker · k3s · GitHub Actions · GHCR · Cloudflare Tunnel*

Proxmox-klynge på tre fysiske maskiner, der to står på hele tiden. Her kjører prosjektene mine, testmiljøet til VT Booking og noen apper for andre.

- Flytter tjenestene fra én Docker-host til en k3s-klynge med to noder på hver sin maskin. Åtte av ti apper er flyttet
- Hver app kjører med én pod per node, så den fortsatt svarer hvis én maskin går ned
- Images bygges i GitHub Actions og publiseres til GHCR. Ekstern tilgang går gjennom Cloudflare Tunnel
- Setter opp VM-er fra maler, med faste IP-adresser og daglig backup til den andre maskinen

### Chess | [Live](https://chess.patreek.no) · [GitHub](https://github.com/pthormodsen/Chess)

*Java · Spring Boot · React · Stockfish*

Sjakk i nettleseren, med spillogikken skrevet i Java. Du kan spille mot en annen person eller mot Stockfish med valgfri Elo, og analysere egne eller importerte partier (PGN) med beste trekk, trekkvurdering og evalueringsgraf.

### Phishing URL Detector | [Live](https://phishing.patreek.no) · [GitHub](https://github.com/pthormodsen/PhishingURL)

*Python · scikit-learn · FastAPI · React · TypeScript*

Skoleprosjekt i DAT158 Maskinlæring. Jeg laget en nettside der du limer inn en URL og får vite om modellen mener den er phishing. Modellen ser bare på selve URL-teksten og besøker aldri siden.

- Utviklet modellen, FastAPI-backend og React-frontend, og drifter den i k3s-klyngen min
- Logistisk regresjon på TF-IDF av tegn-n-gram, trent på 24 000 URL-er
- På 10 000 test-URL-er holdt utenfor treningen: 90,6 % accuracy, 97,7 % presisjon og 80,8 % recall. 1,5 % av de legitime URL-ene ble feilaktig flagget

### SeatSense | [Live](https://seatsense.patreek.no) · [GitHub](https://github.com/pthormodsen/SeatSense)

*ESP32-S3 · mmWave-sensor (HLK-LD2410C) · React · TypeScript · MazeMap*

Prototype som viser ledige leseplasser på campus, laget som gruppeprosjekt. En mmWave-sensor på en ESP32-S3 registrerer om plassen er i bruk, og nettsiden viser status på et MazeMap-kart. Kartet bruker foreløpig mockdata.

- Jeg hadde hovedansvaret for den fysiske prototypen og nettsiden

## Arbeidserfaring

### Studentassistent, Høgskulen på Vestlandet | jan. 2026 – nå · Bergen

- Veileder studenter i DAT107 Databaser, MAT210 Videregående diskret matematikk og FOR033 Matematikk forkurs
- Retter og vurderer innleveringer

### Teknisk eksamensvakt, Høgskulen på Vestlandet | des. 2025 – nå · Bergen

- Teknisk støtte til studenter under digital eksamen, blant annet i WISEflow, ofte i flere rom samtidig

### Lagermedarbeider / ringehjelp, TINE Supply Chain | jun. 2022 – nå · Sola og Bergen

Fast ansatt i perioder. Jobber nå ved siden av studiene og i ferier.

- Plukk og pakking med stemmestyrt plukking (Pick By Voice), truckkjøring, varemottak og påfylling
- Håndterer tredjepartsvarer, som krever nøyaktighet og mye kontakt med de andre involverte
- Hadde ansvaret for Lervig-distribusjonen i en sommerjobb

### Terminalsoldat, Forsvaret | apr. 2023 – apr. 2024 · Gardermoen

- Lasting og lossing av militære fly, med strenge krav til sikkerhet og presisjon

### Tidligere arbeidserfaring

- Butikkmedarbeider, REMA 1000 Hove, Sandnes (2021–2022)
- Medarbeider, McDonald's, Sandnes (2020–2021)

## Utdanning

### Bachelor i dataingeniør, Høgskulen på Vestlandet | aug. 2024 – jun. 2027 (forventet)

Fordypning i programvareutvikling og arkitektur. Relevante emner: DAT107 Databaser, DAT108 Programmering og webapplikasjoner, DAT110 Distribuerte systemer og nettverksteknologi, DAT158 Maskinlæring.

### Studiespesialisering, Bryne og Sandnes vidaregåande skule | aug. 2019 – jun. 2022

## Verv og frivillig arbeid

### Nestleder, Fribyte | aug. 2025 – jan. 2026

Medlem siden aug. 2024. Fribyte drifter IT-tjenester for studentorganisasjoner i Bergen.

- Ansvar for administrativt arbeid, kontrakter og oppfølging

### Sekretær, Root | aug. 2024 – feb. 2026

Linjeforeningen for dataingeniør og informasjonsteknologi ved HVL.

- Del av ledelsen sammen med leder og nestleder. Skrev møtereferater og var med på å ta beslutninger

### Frivillig, Cloud Native Bergen | okt. 2026

- Praktisk gjennomføring og logistikk under konferansen

## Språk

- **Norsk:** morsmål
- **Engelsk:** flytende
