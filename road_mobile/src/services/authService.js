/**
 * Service d'authentification - Full Firebase
 * Utilise Firebase Auth pour l'authentification et Firestore pour les données utilisateur
 */
import { Preferences } from '@capacitor/preferences';
import { auth, db } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  updateProfile,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

const USERS_COLLECTION = 'users';

/**
 * Stocke les données utilisateur localement
 */
const storeUserData = async (token, user) => {
  try {
    await Preferences.set({ key: 'token', value: token });
    await Preferences.set({ key: 'user', value: JSON.stringify(user) });
  } catch {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
};

/**
 * Récupère les données utilisateur stockées localement
 */
const getStoredUser = async () => {
  try {
    const { value } = await Preferences.get({ key: 'user' });
    return value ? JSON.parse(value) : null;
  } catch {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

/**
 * Récupère le token stocké localement
 */
const getStoredToken = async () => {
  try {
    const { value } = await Preferences.get({ key: 'token' });
    return value;
  } catch {
    return localStorage.getItem('token');
  }
};

/**
 * Supprime les données d'authentification locales
 */
const clearAuthData = async () => {
  try {
    await Preferences.remove({ key: 'token' });
    await Preferences.remove({ key: 'user' });
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

/**
 * Récupère les données utilisateur depuis Firestore
 */
const getUserDataFromFirestore = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));
    if (userDoc.exists()) {
      return { id: uid, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Erreur récupération Firestore:', error);
    return null;
  }
};

/**
 * Crée ou met à jour les données utilisateur dans Firestore
 */
const setUserDataInFirestore = async (uid, data) => {
  try {
    await setDoc(doc(db, USERS_COLLECTION, uid), {
      ...data,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Erreur écriture Firestore:', error);
    return false;
  }
};

export const authService = {
  /**
   * Connexion avec email et mot de passe via Firebase Auth
   */
  async login(email, password) {
    try {
      // Authentification Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const token = await firebaseUser.getIdToken();

      // Récupérer les données supplémentaires depuis Firestore
      let userData = await getUserDataFromFirestore(firebaseUser.uid);

      // Si pas de données Firestore, créer les données par défaut
      if (!userData) {
        userData = {
          email: firebaseUser.email,
          nom: '',
          prenom: firebaseUser.displayName || '',
          telephone: '',
          role: 'UTILISATEUR',
          isActive: true,
          isLocked: false,
          isOnline: true,
          loginAttempts: 0,
          createdAt: serverTimestamp()
        };
        await setUserDataInFirestore(firebaseUser.uid, userData);
        userData.id = firebaseUser.uid;
      }

      // Mettre à jour le statut de connexion
      await setUserDataInFirestore(firebaseUser.uid, {
        isOnline: true,
        lastLogin: serverTimestamp(),
        loginAttempts: 0
      });

      // Formater l'utilisateur pour l'application
      const user = {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        nom: userData.nom || '',
        prenom: userData.prenom || '',
        telephone: userData.telephone || '',
        role: userData.role || 'UTILISATEUR',
        isOnline: true,
        lastLogin: new Date().toISOString(),
        createdAt: userData.createdAt
      };

      // Stocker localement
      await storeUserData(token, user);

      return {
        accessToken: token,
        user
      };
    } catch (error) {
      console.error('Erreur de connexion Firebase:', error);

      // Gérer les codes d'erreur Firebase
      if (error.code === 'auth/user-not-found') {
        throw new Error('Utilisateur non trouvé');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Mot de passe incorrect');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Email invalide');
      } else if (error.code === 'auth/user-disabled') {
        throw new Error('Compte désactivé');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Trop de tentatives, réessayez plus tard');
      }

      throw error;
    }
  },

  /**
   * Inscription d'un nouvel utilisateur via Firebase Auth
   */
  async register(data) {
    try {
      // Créer l'utilisateur dans Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = userCredential.user;

      // Mettre à jour le profil Firebase Auth
      await updateProfile(firebaseUser, {
        displayName: `${data.prenom} ${data.nom}`
      });

      // Créer les données dans Firestore
      const userData = {
        email: data.email,
        nom: data.nom,
        prenom: data.prenom,
        telephone: data.telephone || '',
        role: 'UTILISATEUR',
        isActive: true,
        isLocked: false,
        isOnline: true,
        loginAttempts: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setUserDataInFirestore(firebaseUser.uid, userData);

      const token = await firebaseUser.getIdToken();

      const user = {
        id: firebaseUser.uid,
        email: data.email,
        nom: data.nom,
        prenom: data.prenom,
        telephone: data.telephone || '',
        role: 'UTILISATEUR',
        isOnline: true,
        createdAt: new Date().toISOString()
      };

      await storeUserData(token, user);

      return {
        accessToken: token,
        user
      };
    } catch (error) {
      console.error('Erreur inscription Firebase:', error);

      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Cet email est déjà utilisé');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Email invalide');
      }

      throw error;
    }
  },

  /**
   * Déconnexion
   */
  async logout() {
    try {
      // Mettre à jour le statut hors ligne dans Firestore
      const currentUser = auth.currentUser;
      if (currentUser) {
        await setUserDataInFirestore(currentUser.uid, {
          isOnline: false
        });
      }

      // Déconnecter de Firebase Auth
      await firebaseSignOut(auth);
    } catch (error) {
      console.warn('Erreur déconnexion Firebase:', error);
    }

    // Nettoyer les données locales
    await clearAuthData();
  },

  /**
   * Récupère le profil utilisateur depuis Firestore
   */
  async getProfile() {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Non authentifié');
    }

    const userData = await getUserDataFromFirestore(currentUser.uid);
    if (!userData) {
      throw new Error('Profil non trouvé');
    }

    return {
      id: currentUser.uid,
      email: currentUser.email,
      nom: userData.nom || '',
      prenom: userData.prenom || '',
      telephone: userData.telephone || '',
      role: userData.role || 'UTILISATEUR',
      isOnline: userData.isOnline,
      lastLogin: userData.lastLogin,
      createdAt: userData.createdAt
    };
  },

  /**
   * Met à jour le profil utilisateur
   */
  async updateProfile(data) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Non authentifié');
    }

    try {
      // Mettre à jour Firebase Auth si nécessaire
      if (data.prenom || data.nom) {
        const displayName = `${data.prenom || ''} ${data.nom || ''}`.trim();
        await updateProfile(currentUser, { displayName });
      }

      if (data.email && data.email !== currentUser.email) {
        await updateEmail(currentUser, data.email);
      }

      if (data.password) {
        await updatePassword(currentUser, data.password);
      }

      // Mettre à jour Firestore
      const updateData = {};
      if (data.nom !== undefined) updateData.nom = data.nom;
      if (data.prenom !== undefined) updateData.prenom = data.prenom;
      if (data.telephone !== undefined) updateData.telephone = data.telephone;
      if (data.email !== undefined) updateData.email = data.email;

      await setUserDataInFirestore(currentUser.uid, updateData);

      // Mettre à jour le stockage local
      const storedUser = await getStoredUser();
      const updatedUser = { ...storedUser, ...updateData };
      await Preferences.set({ key: 'user', value: JSON.stringify(updatedUser) });

      return updatedUser;
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);

      if (error.code === 'auth/requires-recent-login') {
        throw new Error('Veuillez vous reconnecter pour modifier ces informations');
      }

      throw error;
    }
  },

  /**
   * Récupère l'utilisateur actuel depuis le stockage local
   */
  async getCurrentUser() {
    return await getStoredUser();
  },

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  async isAuthenticated() {
    const token = await getStoredToken();
    return !!token && !!auth.currentUser;
  },

  /**
   * Récupère le token actuel
   */
  async getToken() {
    const currentUser = auth.currentUser;
    if (currentUser) {
      return await currentUser.getIdToken();
    }
    return await getStoredToken();
  },

  /**
   * Observe les changements d'état d'authentification
   */
  onAuthStateChanged(callback) {
    return firebaseOnAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await getUserDataFromFirestore(firebaseUser.uid);
        callback({
          id: firebaseUser.uid,
          email: firebaseUser.email,
          ...userData
        });
      } else {
        callback(null);
      }
    });
  },

  /**
   * Met à jour les données utilisateur stockées localement
   */
  async updateStoredUser(user) {
    try {
      await Preferences.set({ key: 'user', value: JSON.stringify(user) });
    } catch {
      localStorage.setItem('user', JSON.stringify(user));
    }
  },

  /**
   * Rafraîchit le token Firebase
   */
  async refreshToken() {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken(true);
      await Preferences.set({ key: 'token', value: token });
      return token;
    }
    return null;
  }
};
