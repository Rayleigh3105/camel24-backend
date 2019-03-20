# Error code Beschreibung
#### Camel-0 = Verbindungsprobleme
- **Camel-00** -> Allgemeiner nicht definierter code
- **Camel-01** -> Es konnte keine Verbindung zum E-Mail Client hergestellt werden.
- **Camel-02** -> Es konnte keine Verbindung zum E-Mail Client hergestellt werden wenn Email versendet werden soll.

#### Camel-1 = User Operationen
#### 400
- **Camel-11** -> Bei der Datenbankoperation ist etwas schiefgelaufen. (Wenn nach User gesucht wird ohne filter)
- **Camel-12** -> Bei der Datenbankoperation ist etwas schiefgelaufen. (Wenn nach User gesucht wird mit filter)
- **Camel-13** -> E-Mail ist schon regestriert. (When fetching for user und Anzahl wird berechnet)
- **Camel-14** -> Bei der Datenbankoperation ist etwas schiefgelaufen. (Wenn beim Speichern des Benutzers in der Datenbank was falsch läuft)
- **Camel-15** -> Bei der Datenbankoperation ist etwas schiefgelaufen. (Wenn der Auth Token generiert wird) -> Register
- **Camel-152** -> Bei der Datenbankoperation ist etwas schiefgelaufen. (Wenn der Auth Token generiert wird) -> Login
- **Camel-16**
    - Benutzer (${body.kundenNummer}) konnte nicht gefunden werden, , oder nicht gültiges Passwort.
    - Zu Bearbeitender Benutzer konnte nicht gefunden werden,
- **Camel-18** -> Authentifzierunstoken konnte nicht gelöscht werden.
- **Camel-19** -> Bei der Datenbankoperation ist etwas schiefgelaufen. (Wenn User geupdated wird)
- **Camel-111** -> Bei der Datenbankoperation ist etwas schiefgelaufen. (Wenn User geupdated wird)


#### 404
- **Camel-17** -> Authentifizierungs Token konnte nicht gefunden werden.

#### Camel-2 = Auftrag Operationen
#### 400
- **Camel-21** -> Bei der Datenbankoperation ist etwas schiefgelaufen. (Beim laden der Aufträge)
- **Camel-22** -> Ordner struktur konnte nicht erstellt werden
- **Camel-23** -> Beim Speicher des Auftrags ist etwas schiefgelaufen
- **Camel-25** -> Beim Mappen der Daten ist etwas schiefgelaufen
- **Camel-26** -> Beim erstellen des Barcodes ist etwas schiefgelaufen
- **Camel-27** -> Beim Speicher der Datei ist ein Fehler aufgetreten
- **Camel-28** -> Beim generieren der PDF ist etwas schief gelaufen
- **Camel-29** -> Beim generieren der E-Mail ist ein Fehler aufgetreten.
- **Camel-30** -> Beim downloaden der PDF Datei ist etwas schiefgelaufen.
#### Json Validation
- **Camel-31** -> Angabe der E-Mail ist beim Absender erforderlich.
- **Camel-32** -> Ansprechpartner muss bei persönlicher Zustellung gegeben sein.
- **Camel-33** -> Bei Waffen oder Munitionsversand muss eine persönliche Zustellung erfolgen.
- **Camel-34** -> Abholdatum darf nicht muss zwischen Montag und Freitag erfolgen.
- **Camel-35** -> Zustelldatum darf nicht muss zwischen Montag und Freitag erfolgen.
- **Camel-36** -> Abholzeitfenster muss mind. 2 Stunden betragen.
- **Camel-37** -> Zustellzeitfenster muss mind. 2 Stunden betragen.
- **Camel-38** -> Abholdatum muss mindestens einen Tag nach der Auftragserstellung sein.
- **Camel-39** -> Zustelldatum muss mind. 2 Stunden betragen.
- **Camel-40** -> Abholung muss zwischen 08:00 und 16:00 Uhr erfolgen.
- **Camel-41** -> Zustellung muss zwischen 08:00 und 16:00 Uhr erfolgen.
- **Camel-42** -> Abholzeit 'von' und 'bis' muss Pattern ^[0-9]{2}:[0-9]{2}$ entsprechen.
- **Camel-43** -> Zustellzeit 'von' und 'bis' muss Pattern ^[0-9]{2}:[0-9]{2}$ entsprechen.
- **Camel-44** -> PLZ muss Pattern ^[0-9]{5}$ entsprechen.


raml2html -t nunjucks/template.nunjucks -i camel-api-documentation.raml -o camel-api-documentation.html
