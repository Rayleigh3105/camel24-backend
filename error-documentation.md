# Error code Beschreibung
#### Camel-0 = Verbindungsprobleme
- **Camel-00** -> Allgemeiner nicht definierter code
- **Camel-01** -> Es konnte keine Verbindung zum E-Mail Client hergestellt werden.
- **Camel-02** -> Es konnte keine Verbindung zum E-Mail Client hergestellt werden wenn Email versendet werden soll.

#### Camel-1 = User Operationen
- **Camel-11** -> Bei der Datenbankoperation ist etwas schiefgelaufen. (Wenn nach User gesucht wird ohne filter)
- **Camel-12** -> Bei der Datenbankoperation ist etwas schiefgelaufen. (Wenn nach User gesucht wird mit filter)
- **Camel-13** -> E-Mail ist schon regestriert. (When fetching for user und Anzahl wird berechnet)
- **Camel-14** -> Bei der Datenbankoperation ist etwas schiefgelaufen. (Wenn beim Speichern des Benutzers in der Datenbank was falsch läuft)
- **Camel-15** -> Bei der Datenbankoperation ist etwas schiefgelaufen. (Wenn der Auth Token generiert wird)