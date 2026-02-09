# 📊 Scénarios - Avancement et Statistiques de Traitement (Manager)

---

## 🎯 Règles de Calcul de l'Avancement

| Statut | Avancement | Couleur |
|--------|------------|---------|
| 🔴 NOUVEAU | **0%** | Rouge |
| 🟠 EN_COURS | **50%** | Orange |
| 🟢 TERMINE | **100%** | Vert |

> ⚠️ L'avancement est **fixe** selon le statut (EN_COURS = toujours 50%, jamais 30% ou 60%)

## 📅 Dates Automatiques par Étape

| Champ | Déclencheur |
|-------|-------------|
| `dateNouveau` | Création du signalement |
| `dateEnCours` | Passage à EN_COURS |
| `dateTermine` | Passage à TERMINE |

---

## Scénario 18 : Création signalement (0%)

**Étapes :** Créer un signalement → `dateNouveau` enregistrée automatiquement

```
POST /api/signalements → statut: "NOUVEAU", pourcentageAvancement: 0, dateNouveau: "2026-02-03T10:30:00"
```

📸 `screen_24_creation_nouveau_signalement.png`

---

## Scénario 19 : Passage à "En cours" (50%)

**Étapes :** Éditer signalement → Statut "EN_COURS" + Entreprise/Budget/Surface → Enregistrer

```
PUT /api/signalements/20 { "statut": "EN_COURS" }
→ pourcentageAvancement: 50, dateEnCours: "2026-02-03T14:45:00"
```

📸 `screen_25_passage_en_cours.png`

---

## Scénario 20 : Passage à "Terminé" (100%)

**Étapes :** Éditer signalement EN_COURS → Statut "TERMINE" → Enregistrer

```
PUT /api/signalements/20 { "statut": "TERMINE" }
→ pourcentageAvancement: 100, dateTermine: "2026-02-05T16:20:00"
```

📸 `screen_26_passage_termine.png`

---

## Scénario 21 : Statistiques de traitement

**Étapes :** Page Gestion → Section "Statistiques de Traitement des Travaux"

```
GET /api/signalements/stats
→ traitement: { tempsNouveauAEnCours: 48.5, tempsEnCoursATermine: 168.0, tempsTotal: 216.5 }
```

**Cartes affichées :** 🔴 Nouveau (0%): 8 | 🟠 En cours (50%): 10 | 🟢 Terminé (100%): 7

📸 `screen_27_cartes_resume_statut.png`

---

## Scénario 22 : Temps moyens de traitement

**Affichage :**
- Nouveau → En cours : **2j 0h**
- En cours → Terminé : **7j 0h**  
- Nouveau → Terminé : **9j 0h** (total)

📸 `screen_28_temps_moyen_traitement.png`

---

## Scénario 23 : Tableau détaillé des travaux

| ID | Titre | Date Création (0%) | Date En Cours (50%) | Date Terminé (100%) | Avancement | Durée | Entreprise |
|----|-------|-------------------|---------------------|---------------------|------------|-------|------------|
| #1 | Réparation Analakely | 01/02 10:30 | 03/02 14:45 | 05/02 16:20 | ████ 100% | 4j 6h | COLAS |
| #2 | Extension boulevard | 15/01 09:00 | 20/01 11:30 | - | ██░░ 50% | - | SOGEA |

📸 `screen_29_tableau_detail_travaux.png`

---

## ✅ Règles Métier

1. **Avancement fixe** : NOUVEAU=0%, EN_COURS=50%, TERMINE=100%
2. **Dates automatiques** : Enregistrées au changement de statut
3. **Conservation** : Les dates ne sont jamais écrasées
4. **Format temps** : < 24h en heures, ≥ 24h en jours/heures

---

## 📊 Screenshots

| N° | Fichier | Description |
|----|---------|-------------|
| 24 | `screen_24_creation_nouveau_signalement.png` | Création (0%) |
| 25 | `screen_25_passage_en_cours.png` | Passage EN_COURS (50%) |
| 26 | `screen_26_passage_termine.png` | Passage TERMINE (100%) |
| 27 | `screen_27_cartes_resume_statut.png` | Cartes résumé |
| 28 | `screen_28_temps_moyen_traitement.png` | Temps moyens |
| 29 | `screen_29_tableau_detail_travaux.png` | Tableau détaillé |

---

**Application TravauxTana v1.1 - 03 Février 2026**

