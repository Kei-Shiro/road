/**
 * Service de caméra pour la prise de photos
 * Utilise @capacitor/camera pour capturer des images
 */
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export const cameraService = {
  /**
   * Prend une photo avec la caméra
   * @returns {Promise<{dataUrl: string, format: string}>}
   */
  async takePhoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        saveToGallery: false,
        correctOrientation: true,
      });

      return {
        dataUrl: image.dataUrl,
        format: image.format,
      };
    } catch (error) {
      console.error('Erreur lors de la prise de photo:', error);
      throw new Error('Impossible de prendre la photo');
    }
  },

  /**
   * Sélectionne une photo depuis la galerie
   * @returns {Promise<{dataUrl: string, format: string}>}
   */
  async pickFromGallery() {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });

      return {
        dataUrl: image.dataUrl,
        format: image.format,
      };
    } catch (error) {
      console.error('Erreur lors de la sélection de photo:', error);
      throw new Error('Impossible de sélectionner la photo');
    }
  },

  /**
   * Propose à l'utilisateur de choisir entre la caméra et la galerie
   * @returns {Promise<{dataUrl: string, format: string}>}
   */
  async promptForPhoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
        promptLabelHeader: 'Ajouter une photo',
        promptLabelPhoto: 'Depuis la galerie',
        promptLabelPicture: 'Prendre une photo',
        saveToGallery: false,
        correctOrientation: true,
      });

      return {
        dataUrl: image.dataUrl,
        format: image.format,
      };
    } catch (error) {
      if (error.message?.includes('cancelled') || error.message?.includes('User cancelled')) {
        throw new Error('Annulé');
      }
      console.error('Erreur lors de la capture:', error);
      throw new Error('Impossible de capturer la photo');
    }
  },

  /**
   * Vérifie les permissions de la caméra
   * @returns {Promise<boolean>}
   */
  async checkPermissions() {
    try {
      const permissions = await Camera.checkPermissions();
      return permissions.camera === 'granted' || permissions.photos === 'granted';
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error);
      return false;
    }
  },

  /**
   * Demande les permissions de la caméra
   * @returns {Promise<boolean>}
   */
  async requestPermissions() {
    try {
      const permissions = await Camera.requestPermissions();
      return permissions.camera === 'granted' || permissions.photos === 'granted';
    } catch (error) {
      console.error('Erreur lors de la demande de permissions:', error);
      return false;
    }
  },
};

