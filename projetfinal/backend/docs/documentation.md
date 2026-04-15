# 📄 Documentation — Application Bancaire

# 1. Présentation

## 1.1 Description

L'application bancaire permet aux clients de gérer leurs comptes bancaires de manière sécurisée. Elle offre plusieurs fonctionnalités telles que la consultation des comptes, les transactions, les dépôts de chèques et la gestion des opérations planifiées.

## 1.2 Objectifs

* Simuler une application bancaire réelle
* Permettre la gestion des comptes
* Offrir des transactions sécurisées
* Automatiser les opérations récurrentes

---

# 2. Architecture

## 2.1 Architecture générale

```
Frontend → Backend → Base de données
```

## 2.2 Technologies utilisées

### Frontend

* React / Next.js
* Tailwind CSS

### Backend

* Node.js
* Express

### Base de données

* SQLite

### Outils

* Git
* GitHub
* JSDoc
* md-to-pdf

---

# 3. Fonctionnalités

## 3.1 Gestion des comptes

* Création de compte
* Consultation de compte
* Fermeture de compte

## 3.2 Transactions

* Dépôt
* Retrait
* Transfert

## 3.3 Dépôt de chèque

* Photo du chèque
* Lecture QR code
* Validation automatique

## 3.4 Transactions futures

* Planification
* Filtres
* Visualisation

## 3.5 Transactions récurrentes

* Paiements automatiques
* Fréquence configurable

## 3.6 Historique des opérations

* Consultation historique
* Filtres
* Recherche

---

# 4. User Stories

## User Story 1 : Consulter les comptes

En tant que client, je veux consulter mes comptes afin de voir mon solde.

## User Story 2 : Dépôt de chèque

En tant que client, je veux déposer un chèque via une photo.

## User Story 3 : Transactions futures

En tant que client, je veux consulter les transactions futures.

## User Story 4 : Transactions récurrentes

En tant que client, je veux programmer des transactions récurrentes.

## User Story 5 : Fermeture de compte

En tant qu’étudiant, je veux fermer un compte bancaire.

---

# 5. Diagrammes UML

## Diagramme de Séquence — Dépôt de chèque

```
Client → Application → Backend → Base de données
```

## Diagramme de Séquence — Transactions futures

```
Client → Interface → Backend → Database
```

---

# 6. API Backend

## Comptes

### GET /accounts

Retourne la liste des comptes

### POST /accounts

Créer un compte

### DELETE /accounts/:id

Supprimer un compte

---

## Transactions

### GET /transactions

Retourne les transactions

### POST /transactions

Créer une transaction

---

## Dépôt de chèque

### POST /cheques

Déposer un chèque

---

# 7. Installation

## Prérequis

* Node.js
* npm

## Installation

```bash
npm install
```

## Lancer l'application

```bash
npm run dev
```

---

# 8. Structure du projet

```
projetfinal/
 ├── frontend/
 ├── backend/
 │    ├── src/
 │    ├── docs/
 │    ├── controllers/
 │    ├── routes/
 │    └── database/
```

---

# 9. Sécurité

* Authentification utilisateur
* Validation des données
* Protection API

---

# 10. Améliorations futures

* Authentification JWT
* Notifications
* Mobile app
* Dashboard analytics

---

# 11. Auteurs

Projet réalisé dans le cadre du projet intégrateur.

---

# 12. Génération du PDF

Commande :

```bash
npm run docs
```

Le fichier sera généré :

```
docs/documentation.pdf
```

---
