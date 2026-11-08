::: header
:::: identity
# Kari Nordmann

[Dataingeniørstudent · Fullstackutvikling og drift]{.subtitle}
::::

:::: contact
[+47 123 45 678](tel:+4712345678) · [kari.nordmann@example.com](mailto:kari.nordmann@example.com)\
[karinordmann.example.com](https://karinordmann.example.com) · [github.com/kari-nordmann](https://github.com/kari-nordmann)\
[linkedin.com/in/kari-nordmann](https://www.linkedin.com/in/kari-nordmann)
::::
:::

## Profil

Dataingeniørstudent ved Fjordvik høgskole med erfaring fra både frontend og backend, mest med Java, Spring Boot, React, TypeScript og PostgreSQL. Utvikler et reservasjonssystem for studentforeningen Kodeklubben. Drifter i tillegg en liten hjemmeserver med Linux, Docker og k3s, der prosjektene mine kjører.

## Teknisk kompetanse

Språk
: Java, TypeScript, JavaScript, Python, SQL

Backend
: Spring Boot, Spring Security, REST API, FastAPI

Frontend
: React, Vite, Tailwind CSS, HTML og CSS

Databaser
: PostgreSQL, Flyway, datamodellering

Infrastruktur
: Linux, Docker og Docker Compose, k3s (Kubernetes), Nginx

CI/CD og verktøy
: Git, GitHub Actions, GitHub Container Registry (GHCR)

Maskinlæring
: scikit-learn, pandas, Jupyter

## Utvalgte prosjekter

### Romreservasjon for Kodeklubben [Frivillig prosjekt]{.aside}

[React · TypeScript · Spring Boot · Spring Security · PostgreSQL · Flyway · Docker]{.stack}

Reservasjonssystem for grupperom og utstyr i studentforeningen Kodeklubben. Jeg utvikler både frontend og backend. Systemet kjører i et testmiljø og skal snart tas i bruk av medlemmene.

- REST API med innlogging, to administratorroller og tilgang per gruppe og rom: direkte reservasjon, søknad eller ingen tilgang
- Søknader som administrator godkjenner, gjentakende reservasjoner og regler som hindrer dobbeltbooking
- Kalender i React med dag-, uke- og månedsvisning
- Skjemaet versjoneres med Flyway. Images bygges i GitHub Actions og kjøres med Docker Compose bak Nginx

### Hjemmeserver og drift

[Linux · Docker · k3s · GitHub Actions · GHCR]{.stack}

Liten klynge på to brukte stasjonære maskiner. Her kjører prosjektene mine, testmiljøet til romreservasjonen og noen apper for venner.

- Flytter tjenestene fra én Docker-host til en k3s-klynge med to noder på hver sin maskin. Seks av ni apper er flyttet
- Hver app kjører med én pod per node, så den fortsatt svarer hvis én maskin går ned
- Images bygges i GitHub Actions og publiseres til GHCR
- Setter opp VM-er fra maler, med faste IP-adresser og daglig backup til den andre maskinen

### Ordspill [[Live](https://ordspill.example.com) · [GitHub](https://github.com/kari-nordmann/ordspill)]{.aside}

[Java · Spring Boot · React]{.stack}

Ordspill i nettleseren, med spillogikken skrevet i Java. Du kan spille mot en annen person eller mot datamaskinen på tre nivåer, og se statistikk over tidligere spill med beste trekk og poengutvikling.

### Spamfilter for e-post [[Live](https://spamfilter.example.com) · [GitHub](https://github.com/kari-nordmann/spamfilter)]{.aside}

[Python · scikit-learn · FastAPI · React · TypeScript]{.stack}

Skoleprosjekt i maskinlæring. Jeg laget en nettside der du limer inn en e-posttekst og får vite om modellen mener den er spam. Modellen ser bare på teksten og åpner aldri lenker.

- Utviklet modellen, FastAPI-backend og React-frontend, og drifter den på hjemmeserveren min
- Logistisk regresjon på TF-IDF av ord og tegn-n-gram, trent på 20 000 e-poster
- På 5 000 test-e-poster holdt utenfor treningen: 95,1 % accuracy, 96,4 % presisjon og 91,2 % recall. 2,0 % av de vanlige e-postene ble feilaktig flagget

### Plassfinner [[Live](https://plassfinner.example.com) · [GitHub](https://github.com/kari-nordmann/plassfinner)]{.aside}

[ESP32 · Bevegelsessensor · React · TypeScript · Leaflet]{.stack}

Prototype som viser ledige lesesalsplasser, laget som gruppeprosjekt. En bevegelsessensor på en ESP32 registrerer om plassen er i bruk, og nettsiden viser status på et kart. Kartet bruker foreløpig testdata.

- Jeg hadde hovedansvaret for den fysiske prototypen og nettsiden

## Arbeidserfaring

### Studentassistent, Fjordvik høgskole [jan. 2026 – nå · Fjordvik]{.aside}

- Veileder studenter i databaser, diskret matematikk og forkurs i matematikk
- Retter og vurderer innleveringer

### Eksamensvakt, Fjordvik høgskole [des. 2025 – nå · Fjordvik]{.aside}

- Teknisk støtte til studenter under digital eksamen, ofte i flere rom samtidig

### Lagermedarbeider, Nordlys Distribusjon AS [jun. 2022 – nå · Strandby og Fjordvik]{.aside}

Fast ansatt i perioder. Jobber nå ved siden av studiene og i ferier.

- Plukk og pakking med stemmestyrt plukking, truckkjøring, varemottak og påfylling
- Håndterer varer fra andre leverandører, som krever nøyaktighet og mye kontakt med de andre involverte
- Hadde ansvaret for én kundes distribusjon i en sommerjobb

### Lagerarbeider, Fjelltopp Logistikk [apr. 2023 – apr. 2024 · Strandby]{.aside}

- Lasting og lossing av varer, med strenge krav til sikkerhet og presisjon

### Tidligere arbeidserfaring

- Butikkmedarbeider, Dagligvare Sentrum, Strandby (2021–2022)
- Medarbeider, Kafé Hjørnet, Strandby (2020–2021)

## Utdanning

### Bachelor i dataingeniør, Fjordvik høgskole [aug. 2024 – jun. 2027 (forventet)]{.aside}

Fordypning i programvareutvikling og arkitektur. Relevante emner: databaser, programmering og webapplikasjoner, distribuerte systemer og nettverksteknologi, maskinlæring.

### Studiespesialisering, Strandby videregående skole [aug. 2019 – jun. 2022]{.aside}

## Verv og frivillig arbeid

### Nestleder, Kodeklubben [aug. 2025 – jan. 2026]{.aside}

Medlem siden aug. 2024. Kodeklubben lager IT-løsninger for studentforeninger i Fjordvik.

- Ansvar for administrativt arbeid, kontrakter og oppfølging

### Sekretær, Linjeforeningen Bit [aug. 2024 – feb. 2026]{.aside}

Linjeforeningen for dataingeniør og informasjonsteknologi ved Fjordvik høgskole.

- Del av styret sammen med leder og nestleder. Skrev møtereferater og var med på å ta beslutninger

### Frivillig, Fjordvik Tech Meetup [okt. 2026]{.aside}

- Praktisk gjennomføring og logistikk under konferansen

## Språk

Norsk
: morsmål

Engelsk
: flytende
