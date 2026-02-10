/**
 * Service de gestion des signalements - Full Firebase
 * Utilise Firestore pour toutes les opérations CRUD
 */
import { db, auth } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

const SIGNALEMENTS_COLLECTION = 'signalements';
const CONFIGURATIONS_COLLECTION = 'configurations';

/**
 * Convertit un document Firestore en objet signalement
 */
const docToSignalement = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    syncId: doc.id,
    titre: data.titre || '',
    description: data.description || '',
    latitude: data.latitude,
    longitude: data.longitude,
    adresse: data.adresse || '',
    statut: data.statut || 'NOUVEAU',
    surfaceImpactee: data.surfaceImpactee,
    niveau: data.niveau || 1,
    budget: data.budget,
    entrepriseResponsable: data.entrepriseResponsable || '',
    dateDebut: data.dateDebut,
    dateFinPrevue: data.dateFinPrevue,
    dateFinReelle: data.dateFinReelle,
    dateNouveau: data.dateNouveau?.toDate?.() || data.dateNouveau,
    dateEnCours: data.dateEnCours?.toDate?.() || data.dateEnCours,
    dateTermine: data.dateTermine?.toDate?.() || data.dateTermine,
    pourcentageAvancement: data.pourcentageAvancement || 0,
    priorite: data.priorite || 'MOYENNE',
    type: data.type || 'REPARATION',
    photoUrl: data.photoUrl || '',
    isActive: data.isActive !== false,
    isSynced: true,
    createdAt: data.createdAt?.toDate?.() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
    createdByEmail: data.createdByEmail || '',
    createdBy: data.createdByEmail ? { email: data.createdByEmail } : null
  };
};

/**
 * Calcule le pourcentage d'avancement selon le statut
 */
const calculerPourcentage = (statut) => {
  switch (statut) {
    case 'NOUVEAU': return 0;
    case 'EN_COURS': return 50;
    case 'TERMINE': return 100;
    default: return 0;
  }
};

export const signalementService = {
  /**
   * Récupère tous les signalements actifs
   */
  async getAll(page = 0, size = 50) {
    try {
      // Vérifier l'authentification
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.warn('Utilisateur non authentifié - retour liste vide');
        return {
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: page,
          size: size
        };
      }

      const signalementRef = collection(db, SIGNALEMENTS_COLLECTION);

      // Requête simple sans orderBy pour éviter les problèmes d'index
      const q = query(
        signalementRef,
        where('isActive', '==', true),
        limit(size)
      );

      const snapshot = await getDocs(q);
      let signalements = snapshot.docs.map(docToSignalement);

      // Trier côté client
      signalements.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      });

      return {
        content: signalements,
        totalElements: signalements.length,
        totalPages: 1,
        number: page,
        size: size
      };
    } catch (error) {
      console.error('Erreur récupération signalements:', error);
      // Retourner une liste vide en cas d'erreur plutôt que de planter
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: page,
        size: size
      };
    }
  },

  /**
   * Récupère les signalements par statut
   */
  async getByStatut(statut, page = 0, size = 50) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { content: [], totalElements: 0, totalPages: 0, number: page, size: size };
      }

      const signalementRef = collection(db, SIGNALEMENTS_COLLECTION);

      // Requête simple - tri côté client
      const q = query(
        signalementRef,
        where('statut', '==', statut),
        where('isActive', '==', true),
        limit(size)
      );

      const snapshot = await getDocs(q);
      let signalements = snapshot.docs.map(docToSignalement);

      // Trier côté client
      signalements.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      });

      return {
        content: signalements,
        totalElements: signalements.length,
        totalPages: 1,
        number: page,
        size: size
      };
    } catch (error) {
      console.error('Erreur récupération par statut:', error);
      return { content: [], totalElements: 0, totalPages: 0, number: page, size: size };
    }
  },

  /**
   * Récupère un signalement par son ID
   */
  async getById(id) {
    try {
      const docRef = doc(db, SIGNALEMENTS_COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Signalement non trouvé');
      }

      return docToSignalement(docSnap);
    } catch (error) {
      console.error('Erreur récupération signalement:', error);
      throw error;
    }
  },

  /**
   * Récupère les signalements dans une zone géographique
   */
  async getByBounds(minLat, maxLat, minLng, maxLng) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return [];
      }

      const signalementRef = collection(db, SIGNALEMENTS_COLLECTION);
      const q = query(
        signalementRef,
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);

      // Filtrer côté client (Firestore ne supporte pas les requêtes géographiques complexes)
      const signalements = snapshot.docs
        .map(docToSignalement)
        .filter(s =>
          s.latitude >= minLat &&
          s.latitude <= maxLat &&
          s.longitude >= minLng &&
          s.longitude <= maxLng
        );

      return signalements;
    } catch (error) {
      console.error('Erreur récupération par bounds:', error);
      return [];
    }
  },

  /**
   * Récupère les signalements de l'utilisateur connecté
   */
  async getMySignalements(page = 0, size = 50) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { content: [], totalElements: 0, totalPages: 0, number: page, size: size };
      }

      const signalementRef = collection(db, SIGNALEMENTS_COLLECTION);

      // Requête simple sans orderBy pour éviter les index composites
      const q = query(
        signalementRef,
        where('createdByEmail', '==', currentUser.email),
        where('isActive', '==', true),
        limit(size)
      );

      const snapshot = await getDocs(q);
      let signalements = snapshot.docs.map(docToSignalement);

      // Trier côté client
      signalements.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      });

      return {
        content: signalements,
        totalElements: signalements.length,
        totalPages: 1,
        number: page,
        size: size
      };
    } catch (error) {
      console.error('Erreur récupération mes signalements:', error);
      return { content: [], totalElements: 0, totalPages: 0, number: page, size: size };
    }
  },

  /**
   * Crée un nouveau signalement
   */
  async create(data) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Non authentifié');
      }

      const now = new Date();
      const statut = data.statut || 'NOUVEAU';
      const pourcentage = calculerPourcentage(statut);

      // Récupérer le prix par m² pour calculer le budget
      let prixParM2 = 50000;
      try {
        const configDoc = await getDoc(doc(db, CONFIGURATIONS_COLLECTION, 'PRIX_PAR_M2'));
        if (configDoc.exists()) {
          prixParM2 = parseFloat(configDoc.data().valeur) || 50000;
        }
      } catch (e) {
        console.warn('Impossible de récupérer le prix par m²:', e);
      }

      const niveau = data.niveau || 1;
      const surface = data.surfaceImpactee || 0;
      const budget = prixParM2 * niveau * surface;

      const signalementData = {
        titre: data.titre,
        description: data.description || '',
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        adresse: data.adresse || '',
        statut: statut,
        surfaceImpactee: surface,
        niveau: niveau,
        budget: budget,
        entrepriseResponsable: data.entrepriseResponsable || '',
        dateDebut: data.dateDebut || null,
        dateFinPrevue: data.dateFinPrevue || null,
        dateFinReelle: data.dateFinReelle || null,
        dateNouveau: statut === 'NOUVEAU' ? serverTimestamp() : null,
        dateEnCours: statut === 'EN_COURS' ? serverTimestamp() : null,
        dateTermine: statut === 'TERMINE' ? serverTimestamp() : null,
        pourcentageAvancement: pourcentage,
        priorite: data.priorite || 'MOYENNE',
        type: data.type || 'REPARATION',
        photoUrl: data.photoUrl || '',
        isActive: true,
        isSynced: true,
        createdByEmail: currentUser.email,
        createdById: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, SIGNALEMENTS_COLLECTION), signalementData);

      return {
        id: docRef.id,
        syncId: docRef.id,
        ...signalementData,
        createdAt: now,
        updatedAt: now,
        createdBy: { email: currentUser.email }
      };
    } catch (error) {
      console.error('Erreur création signalement:', error);
      throw error;
    }
  },

  /**
   * Met à jour un signalement existant
   */
  async update(id, data) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Non authentifié');
      }

      const docRef = doc(db, SIGNALEMENTS_COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Signalement non trouvé');
      }

      const existingData = docSnap.data();
      const updateData = {
        updatedAt: serverTimestamp(),
        updatedByEmail: currentUser.email
      };

      // Copier les champs modifiés
      if (data.titre !== undefined) updateData.titre = data.titre;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.latitude !== undefined) updateData.latitude = parseFloat(data.latitude);
      if (data.longitude !== undefined) updateData.longitude = parseFloat(data.longitude);
      if (data.adresse !== undefined) updateData.adresse = data.adresse;
      if (data.entrepriseResponsable !== undefined) updateData.entrepriseResponsable = data.entrepriseResponsable;
      if (data.dateDebut !== undefined) updateData.dateDebut = data.dateDebut;
      if (data.dateFinPrevue !== undefined) updateData.dateFinPrevue = data.dateFinPrevue;
      if (data.dateFinReelle !== undefined) updateData.dateFinReelle = data.dateFinReelle;
      if (data.priorite !== undefined) updateData.priorite = data.priorite;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl;
      if (data.surfaceImpactee !== undefined) updateData.surfaceImpactee = data.surfaceImpactee;
      if (data.niveau !== undefined) updateData.niveau = data.niveau;

      // Gestion du changement de statut
      if (data.statut !== undefined && data.statut !== existingData.statut) {
        updateData.statut = data.statut;
        updateData.pourcentageAvancement = calculerPourcentage(data.statut);

        switch (data.statut) {
          case 'NOUVEAU':
            if (!existingData.dateNouveau) updateData.dateNouveau = serverTimestamp();
            break;
          case 'EN_COURS':
            if (!existingData.dateEnCours) updateData.dateEnCours = serverTimestamp();
            break;
          case 'TERMINE':
            updateData.dateTermine = serverTimestamp();
            break;
        }
      }

      // Recalculer le budget si nécessaire
      if (data.niveau !== undefined || data.surfaceImpactee !== undefined) {
        let prixParM2 = 50000;
        try {
          const configDoc = await getDoc(doc(db, CONFIGURATIONS_COLLECTION, 'PRIX_PAR_M2'));
          if (configDoc.exists()) {
            prixParM2 = parseFloat(configDoc.data().valeur) || 50000;
          }
        } catch (e) {
          console.warn('Impossible de récupérer le prix par m²:', e);
        }

        const niveau = data.niveau || existingData.niveau || 1;
        const surface = data.surfaceImpactee || existingData.surfaceImpactee || 0;
        updateData.budget = prixParM2 * niveau * surface;
      }

      await updateDoc(docRef, updateData);

      // Retourner le signalement mis à jour
      const updatedDocSnap = await getDoc(docRef);
      return docToSignalement(updatedDocSnap);
    } catch (error) {
      console.error('Erreur mise à jour signalement:', error);
      throw error;
    }
  },

  /**
   * Supprime un signalement (soft delete)
   */
  async delete(id) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Non authentifié');
      }

      const docRef = doc(db, SIGNALEMENTS_COLLECTION, id);

      await updateDoc(docRef, {
        isActive: false,
        updatedAt: serverTimestamp(),
        updatedByEmail: currentUser.email
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur suppression signalement:', error);
      throw error;
    }
  },

  /**
   * Récupère les statistiques globales
   */
  async getStats() {
    try {
      const signalementRef = collection(db, SIGNALEMENTS_COLLECTION);
      const q = query(signalementRef, where('isActive', '==', true));
      const snapshot = await getDocs(q);

      const signalements = snapshot.docs.map(doc => doc.data());

      const stats = {
        total: signalements.length,
        nouveaux: signalements.filter(s => s.statut === 'NOUVEAU').length,
        enCours: signalements.filter(s => s.statut === 'EN_COURS').length,
        termines: signalements.filter(s => s.statut === 'TERMINE').length,
        surfaceTotale: signalements.reduce((sum, s) => sum + (s.surfaceImpactee || 0), 0),
        budgetTotal: signalements.reduce((sum, s) => sum + (s.budget || 0), 0),
        parPriorite: {
          BASSE: signalements.filter(s => s.priorite === 'BASSE').length,
          MOYENNE: signalements.filter(s => s.priorite === 'MOYENNE').length,
          HAUTE: signalements.filter(s => s.priorite === 'HAUTE').length,
          URGENTE: signalements.filter(s => s.priorite === 'URGENTE').length
        },
        parType: {
          REPARATION: signalements.filter(s => s.type === 'REPARATION').length,
          CONSTRUCTION: signalements.filter(s => s.type === 'CONSTRUCTION').length,
          ENTRETIEN: signalements.filter(s => s.type === 'ENTRETIEN').length,
          EXTENSION: signalements.filter(s => s.type === 'EXTENSION').length
        }
      };

      return stats;
    } catch (error) {
      console.error('Erreur récupération statistiques:', error);
      throw error;
    }
  },

  /**
   * Recherche des signalements par mot-clé
   */
  async search(queryText, page = 0, size = 20) {
    try {
      // Firestore ne supporte pas la recherche full-text
      // On récupère tous les signalements et on filtre côté client
      const signalementRef = collection(db, SIGNALEMENTS_COLLECTION);
      const q = query(
        signalementRef,
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      const queryLower = queryText.toLowerCase();

      const signalements = snapshot.docs
        .map(docToSignalement)
        .filter(s =>
          s.titre?.toLowerCase().includes(queryLower) ||
          s.description?.toLowerCase().includes(queryLower) ||
          s.adresse?.toLowerCase().includes(queryLower) ||
          s.entrepriseResponsable?.toLowerCase().includes(queryLower)
        )
        .slice(page * size, (page + 1) * size);

      return {
        content: signalements,
        totalElements: signalements.length,
        totalPages: 1,
        number: page,
        size: size
      };
    } catch (error) {
      console.error('Erreur recherche signalements:', error);
      throw error;
    }
  },

  /**
   * Récupère les configurations
   */
  async getConfigurations() {
    try {
      const configRef = collection(db, CONFIGURATIONS_COLLECTION);
      const snapshot = await getDocs(configRef);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        cle: doc.data().cle || doc.id,
        valeur: doc.data().valeur,
        description: doc.data().description
      }));
    } catch (error) {
      console.error('Erreur récupération configurations:', error);
      throw error;
    }
  }
};
