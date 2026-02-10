package com.road.project.road_back.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.cloud.FirestoreClient;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.io.InputStream;

/**
 * Configuration Firebase pour l'intégration avec Firebase Auth et Firestore.
 * - Firebase Auth : Gère l'authentification (email/password)
 * - Firestore : Stocke les données utilisateur additionnelles (nom, prénom, rôle, etc.)
 */
@Configuration
@Slf4j
public class FirebaseConfig {

    @Value("${firebase.credentials.path:secretAccountKey.json}")
    private String firebaseCredentialsPath;

    private boolean firebaseInitialized = false;

    @PostConstruct
    public void initialize() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                InputStream serviceAccount = new ClassPathResource(firebaseCredentialsPath).getInputStream();

                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                        .build();

                FirebaseApp.initializeApp(options);
                firebaseInitialized = true;
                log.info("Firebase initialisé avec succès (Auth + Firestore)");
            } else {
                firebaseInitialized = true;
                log.info("Firebase déjà initialisé");
            }
        } catch (IOException e) {
            log.warn("Impossible d'initialiser Firebase: {}. Mode hors ligne activé.", e.getMessage());
            firebaseInitialized = false;
        }
    }

    @Bean
    public Firestore firestore() {
        if (firebaseInitialized && !FirebaseApp.getApps().isEmpty()) {
            return FirestoreClient.getFirestore();
        }
        return null;
    }

    @Bean
    public FirebaseAuth firebaseAuth() {
        if (firebaseInitialized && !FirebaseApp.getApps().isEmpty()) {
            return FirebaseAuth.getInstance();
        }
        return null;
    }

    public boolean isFirebaseInitialized() {
        return firebaseInitialized;
    }
}

