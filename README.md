# Grabbe LDAP User Manager 🔐

Ein moderner Web-basierter LDAP-Benutzermanager für das Grabbe-Gymnasium. Verwalten Sie Benutzer, Gruppen, Quotas und Sicherheitseinstellungen über eine intuitive Oberfläche.

## 🚀 Funktionen
- **Benutzerverwaltung**: Erstellen, Bearbeiten und Löschen von LDAP-Benutzern.
- **Gruppenverwaltung**: Dynamisches Zuweisen von Benutzern zu Gruppen (ou=groups).
- **Ressourcen-Quotas**: Festlegen von Cloud-Speicher (Nextcloud) und Mailbox-Größen.
- **Konto-Sicherheit**: Passwortänderung mit Stärke-Indikator und Sperren/Entsperren von Konten.
- **Profil-Medien**: Unterstützung für Profilbilder (jpegPhoto).
- **Sichere Authentifizierung**: Login über den LDAP-Admin-Account mit JWT-Session.

## 🛠 Tech-Stack
- **Frontend/Backend**: [Next.js 15+](https://nextjs.org/) (App Router, React)
- **Styling**: Vanilla CSS & TailwindCSS (Lucide Icons für Symbole)
- **Bilder/Assets**: Integrierte Bildmanipulation für Profilfotos
- **LDAP-Kommunikation**: [ldapts](https://github.com/pfmooney/node-ldapts) (Type-safe LDAP client)

## 📋 Anforderungen
- Node.js 18.x oder neuer
- pnpm (empfohlen)
- Ein funktionsfähiger OpenLDAP Server (oder ähnlicher LDAP-Dienst)

## ⚙️ Vorbereitung (LDAP Schema)
Dieses Portal nutzt benutzerdefinierte Felder in der Objektklasse `grabbePerson`. Bitte stellen Sie sicher, dass Ihr LDAP-Server diese Attribute kennt. Ein Beispiel-LDIF zur Schema-Erweiterung finden Sie hier:

```ldif
# Attribute definition
olcAttributeTypes: ( 1.3.6.1.4.1.9999.1.1 NAME 'cloudQuota' DESC 'Cloud Storage' EQUALITY caseIgnoreMatch SYNTAX 1.3.6.1.4.1.1466.115.121.1.15 SINGLE-VALUE )
olcAttributeTypes: ( 1.3.6.1.4.1.9999.1.2 NAME 'mailQuota' DESC 'Mail Storage' EQUALITY caseIgnoreMatch SYNTAX 1.3.6.1.4.1.1466.115.121.1.15 SINGLE-VALUE )
olcAttributeTypes: ( 1.3.6.1.4.1.9999.1.3 NAME 'grabbeDisabled' DESC 'Account Status' EQUALITY caseIgnoreMatch SYNTAX 1.3.6.1.4.1.1466.115.121.1.15 SINGLE-VALUE )
olcAttributeTypes: ( 1.3.6.1.4.1.9999.1.4 NAME 'grabbeBirthday' DESC 'Birthday' EQUALITY caseIgnoreMatch SYNTAX 1.3.6.1.4.1.1466.115.121.1.15 SINGLE-VALUE )

# ObjectClass definition
olcObjectClasses: ( 1.3.6.1.4.1.9999.2.1 NAME 'grabbePerson' DESC 'Custom Grabbe Class' SUP top AUXILIARY MAY ( grabbeBirthday $ cloudQuota $ mailQuota $ grabbeDisabled ) )
```

## 🛠 Installation & Entwicklung

1.  **Repository klonen:**
    ```bash
    git clone https://github.com/ihr-repo/ldap-user-manager.git
    cd ldap-user-manager
    ```

2.  **Abhängigkeiten installieren:**
    ```bash
    pnpm install
    ```

3.  **Konfiguration:**
    Kopieren Sie die Beispiel-Config und passen Sie die LDAP-Zugangsdaten an.
    ```bash
    cp .env.example .env.local
    ```

4.  **Entwicklungsserver starten:**
    ```bash
    pnpm dev
    ```

## 🌐 Linux Deployment (Produktion)

Wir empfehlen den Einsatz von **PM2** und **Nginx** auf einem Linux-Server (z.B. Debian/Ubuntu).

1.  **Build erstellen:**
    ```bash
    pnpm build
    ```

2.  **PM2 installieren (falls nicht vorhanden):**
    ```bash
    sudo npm install -g pm2
    ```

3.  **App mit PM2 starten:**
    Erstellen Sie eine `ecosystem.config.js` oder starten Sie direkt:
    ```bash
    pm2 start pnpm --name "ldap-manager" -- start
    ```

4.  **Autostart aktivieren:**
    ```bash
    pm2 save
    pm2 startup
    ```

5.  **Nginx als Reverse Proxy (Beispiel):**
    ```nginx
    server {
        listen 80;
        server_name portal.grabbe-gymnasium.cloud;

        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

## 📄 Lizenz
Dieses Projekt ist für den internen Gebrauch am Grabbe-Gymnasium bestimmt.
